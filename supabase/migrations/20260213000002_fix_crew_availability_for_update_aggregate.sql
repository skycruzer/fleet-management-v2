-- Fix: FOR UPDATE is not allowed with aggregate functions
-- Developer: Maurice Rondeau | Date: February 13, 2026
--
-- Issue: PostgreSQL does not allow FOR UPDATE combined with aggregate functions
-- like COUNT(). The previous version of check_crew_availability_atomic used
-- SELECT COUNT(*) ... FOR UPDATE which raises:
--   "FOR UPDATE is not allowed with aggregate functions"
--
-- Fix: Separate row locking from aggregation. Use PERFORM ... FOR UPDATE to
-- acquire locks first, then COUNT(*) in a second query. The locks are held
-- for the duration of the transaction, preserving race-condition safety.

CREATE OR REPLACE FUNCTION check_crew_availability_atomic(
  p_pilot_role text,
  p_start_date date,
  p_end_date date,
  p_exclude_request_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_total_pilots int;
  v_on_leave_count int;
  v_available int;
  v_minimum_required int := 10;
  v_can_approve boolean;
  v_remaining_after_approval int;
BEGIN
  -- Step 1a: Lock all active pilots of this role to prevent concurrent modifications
  PERFORM 1
  FROM pilots
  WHERE role = p_pilot_role::pilot_role
    AND is_active = true
  FOR UPDATE;

  -- Step 1b: Count them (locks already held from above)
  SELECT COUNT(*) INTO v_total_pilots
  FROM pilots
  WHERE role = p_pilot_role::pilot_role
    AND is_active = true;

  -- Step 2a: Lock relevant leave request rows to prevent concurrent approvals
  PERFORM 1
  FROM pilot_requests pr
  INNER JOIN pilots p ON pr.pilot_id = p.id
  WHERE p.role = p_pilot_role::pilot_role
    AND pr.request_category = 'LEAVE'
    AND pr.workflow_status = 'APPROVED'
    AND (pr.id != p_exclude_request_id OR p_exclude_request_id IS NULL)
    AND NOT (pr.end_date < p_start_date OR pr.start_date > p_end_date)
  FOR UPDATE OF pr;

  -- Step 2b: Count distinct pilots on leave (locks already held from above)
  SELECT COUNT(DISTINCT pr.pilot_id) INTO v_on_leave_count
  FROM pilot_requests pr
  INNER JOIN pilots p ON pr.pilot_id = p.id
  WHERE p.role = p_pilot_role::pilot_role
    AND pr.request_category = 'LEAVE'
    AND pr.workflow_status = 'APPROVED'
    AND (pr.id != p_exclude_request_id OR p_exclude_request_id IS NULL)
    AND NOT (pr.end_date < p_start_date OR pr.start_date > p_end_date);

  -- Calculate availability
  v_available := v_total_pilots - v_on_leave_count;
  v_remaining_after_approval := v_available - 1;
  v_can_approve := v_remaining_after_approval >= v_minimum_required;

  -- Return result as JSON
  RETURN jsonb_build_object(
    'total_pilots', v_total_pilots,
    'on_leave_count', v_on_leave_count,
    'available', v_available,
    'minimum_required', v_minimum_required,
    'remaining_after_approval', v_remaining_after_approval,
    'can_approve', v_can_approve,
    'reason', CASE
      WHEN v_can_approve THEN
        format('Sufficient crew: %s available after approval', v_remaining_after_approval)
      ELSE
        format('Crew shortage: Only %s would remain (minimum: %s)',
          v_remaining_after_approval, v_minimum_required)
    END
  );
END;
$$ LANGUAGE plpgsql;
