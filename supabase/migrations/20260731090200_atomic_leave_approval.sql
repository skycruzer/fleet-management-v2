-- ============================================================================
-- Fix: crew-minimum check and approval write were in separate transactions
-- ============================================================================
-- `check_crew_availability_atomic` takes `PERFORM ... FOR UPDATE` row locks on
-- pilots and pilot_requests. Those locks are held for the duration of the
-- TRANSACTION — but Supabase runs each RPC in its own transaction, so they are
-- released the moment the function returns. The subsequent
-- `UPDATE pilot_requests SET workflow_status = 'APPROVED'` in
-- lib/services/unified-request-service.ts is a separate PostgREST round-trip in
-- a separate transaction.
--
-- So the sequence that actually needs protecting — check, then write — spans two
-- transactions and holds no lock across the gap. The comment on migration
-- 20260213000002 ("The locks are held for the duration of the transaction,
-- preserving race-condition safety") is true of the RPC's own transaction, but
-- not of the check-then-write pair.
--
-- Concrete failure: 21 active Captains, 10 already approved on overlapping
-- leave. Two reviewers approve two different pending Captain requests for those
-- dates simultaneously. Each call excludes only its OWN request, so each computes
-- available = 11 and remaining_after_approval = 10, satisfying `>= 10`; both
-- return can_approve = true. Both updates commit, leaving 9 Captains available
-- and breaching the documented 10-Captain minimum. Also reachable by a single
-- reviewer double-clicking, since /api/requests/[id]/status sets rateLimit:false.
--
-- This function performs the lock, the re-check and the status update inside ONE
-- transaction, so a concurrent approver blocks on the same locks and then
-- re-counts with the winner's row already committed.
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_leave_request_atomic(
  p_request_id uuid,
  p_reviewed_by uuid,
  p_comments text DEFAULT NULL,
  p_force boolean DEFAULT false
) RETURNS jsonb AS $$
DECLARE
  v_request pilot_requests%ROWTYPE;
  v_total_pilots int;
  v_on_leave_count int;
  v_available int;
  v_minimum_required int;
  v_remaining_after_approval int;
  v_can_approve boolean;
  v_reason text;
  v_rank pilot_role;
  v_req_start date;
  v_req_end date;
  v_requirements jsonb;
  v_per_hull int;
  v_aircraft int;
BEGIN
  -- Lock the target request first. If a concurrent approver holds it, we wait
  -- here and then observe their committed state.
  SELECT * INTO v_request
  FROM pilot_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Request not found');
  END IF;

  -- Only LEAVE requests are subject to the crew minimum. Non-leave categories
  -- fall straight through to the update below.
  IF v_request.request_category = 'LEAVE' AND v_request.start_date IS NOT NULL THEN

    -- end_date is nullable and means "single day". Previously this branch required
    -- end_date IS NOT NULL, so a single-day leave request skipped the crew check
    -- entirely and was approved unconditionally.
    v_req_start := v_request.start_date;
    v_req_end   := COALESCE(v_request.end_date, v_request.start_date);

    -- pilot_requests.rank is text; an unexpected value would abort the whole
    -- approval as a cast error. Reject it as a normal failure instead.
    BEGIN
      v_rank := v_request.rank::pilot_role;
    EXCEPTION WHEN invalid_text_representation OR datatype_mismatch THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', format('Request has an unrecognised rank: %s', coalesce(v_request.rank, '<null>'))
      );
    END;

    -- Derive the minimum from settings.pilot_requirements so this gate cannot
    -- diverge from leave-eligibility and the preview paths, which compute
    -- minimum_<rank>_per_hull * number_of_aircraft. Falls back to the historical
    -- 5-per-hull x 2 hulls = 10 when the setting is absent or malformed.
    SELECT value INTO v_requirements FROM settings WHERE key = 'pilot_requirements';

    v_aircraft := COALESCE(NULLIF(v_requirements->>'number_of_aircraft', '')::int, 2);
    IF v_rank = 'Captain' THEN
      v_per_hull := COALESCE(NULLIF(v_requirements->>'minimum_captains_per_hull', '')::int, 5);
    ELSE
      v_per_hull := COALESCE(NULLIF(v_requirements->>'minimum_first_officers_per_hull', '')::int, 5);
    END IF;
    v_minimum_required := v_per_hull * v_aircraft;

    -- Lock active pilots of this rank, then count them. FOR UPDATE cannot be
    -- combined with an aggregate, hence the PERFORM/SELECT split (see 20260213000002).
    PERFORM 1
    FROM pilots
    WHERE role = v_rank
      AND is_active = true
    FOR UPDATE;

    SELECT COUNT(*) INTO v_total_pilots
    FROM pilots
    WHERE role = v_rank
      AND is_active = true;

    -- Lock overlapping approved leave rows for this rank, then count distinct
    -- pilots. Because we are inside the SAME transaction as the UPDATE below,
    -- these locks are still held when we write.
    PERFORM 1
    FROM pilot_requests pr
    INNER JOIN pilots p ON pr.pilot_id = p.id
    WHERE p.role = v_rank
      AND pr.request_category = 'LEAVE'
      AND pr.workflow_status = 'APPROVED'
      AND pr.id != p_request_id
      -- COALESCE: pr.end_date is nullable. Without it the comparison yields NULL,
      -- NOT(NULL) is NULL, and the row is silently dropped from BOTH the lock and
      -- the count — under-counting pilots on leave and over-reporting availability,
      -- which is precisely the breach this function exists to prevent. A null
      -- end_date means a single-day request, matching the display path.
      AND NOT (COALESCE(pr.end_date, pr.start_date) < v_req_start
               OR pr.start_date > v_req_end)
    FOR UPDATE OF pr;

    SELECT COUNT(DISTINCT pr.pilot_id) INTO v_on_leave_count
    FROM pilot_requests pr
    INNER JOIN pilots p ON pr.pilot_id = p.id
    WHERE p.role = v_rank
      AND pr.request_category = 'LEAVE'
      AND pr.workflow_status = 'APPROVED'
      AND pr.id != p_request_id
      -- COALESCE: pr.end_date is nullable. Without it the comparison yields NULL,
      -- NOT(NULL) is NULL, and the row is silently dropped from BOTH the lock and
      -- the count — under-counting pilots on leave and over-reporting availability,
      -- which is precisely the breach this function exists to prevent. A null
      -- end_date means a single-day request, matching the display path.
      AND NOT (COALESCE(pr.end_date, pr.start_date) < v_req_start
               OR pr.start_date > v_req_end);

    v_available := v_total_pilots - v_on_leave_count;
    v_remaining_after_approval := v_available - 1;
    v_can_approve := v_remaining_after_approval >= v_minimum_required;

    IF NOT v_can_approve THEN
      v_reason := format(
        'Insufficient %s crew: %s available, %s would remain after approval (minimum %s required)',
        v_request.rank, v_available, v_remaining_after_approval, v_minimum_required
      );

      -- force still writes, but the caller gets the reason back so it can log
      -- the override exactly as before.
      IF NOT p_force THEN
        RETURN jsonb_build_object(
          'success', false,
          'blocked_by_crew_minimum', true,
          'reason', v_reason,
          'rank', v_rank,
          'total_pilots', v_total_pilots,
          'on_leave_count', v_on_leave_count,
          'available', v_available,
          'remaining_after_approval', v_remaining_after_approval,
          'minimum_required', v_minimum_required
        );
      END IF;
    END IF;
  END IF;

  -- Same transaction, locks still held.
  UPDATE pilot_requests
  SET workflow_status = 'APPROVED',
      reviewed_by     = p_reviewed_by,
      reviewed_at     = now(),
      review_comments = p_comments,
      updated_at      = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'forced', COALESCE(NOT v_can_approve, false),
    'reason', v_reason,
    'rank', v_rank,
    'available', v_available,
    'remaining_after_approval', v_remaining_after_approval,
    'minimum_required', v_minimum_required
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION approve_leave_request_atomic IS
  'Approves a pilot request, re-checking the crew minimum under row locks in the SAME transaction as the write. Replaces the check_crew_availability_atomic + separate UPDATE sequence, which could not hold locks across two RPCs.';

-- Callable only by the service role; every caller goes through
-- lib/services/unified-request-service.ts, which runs server-side.
REVOKE ALL ON FUNCTION approve_leave_request_atomic(uuid, uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_leave_request_atomic(uuid, uuid, text, boolean) TO service_role;
