-- Atomic Crew Availability Check - Prevents race conditions during concurrent leave approvals
-- Developer: Maurice Rondeau | Date: January 12, 2026

DO $$
BEGIN
  -- Drop existing function if it exists
  DROP FUNCTION IF EXISTS check_crew_availability_atomic(text, date, date, uuid);
END $$;

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
  SELECT COUNT(*) INTO v_total_pilots
  FROM pilots
  WHERE role = p_pilot_role
    AND is_active = true
  FOR UPDATE;

  SELECT COUNT(DISTINCT pr.pilot_id) INTO v_on_leave_count
  FROM pilot_requests pr
  INNER JOIN pilots p ON pr.pilot_id = p.id
  WHERE p.role = p_pilot_role
    AND pr.request_category = 'LEAVE'
    AND pr.workflow_status IN ('APPROVED', 'PENDING')
    AND (pr.id != p_exclude_request_id OR p_exclude_request_id IS NULL)
    AND NOT (pr.end_date < p_start_date OR pr.start_date > p_end_date)
  FOR UPDATE OF pr;

  v_available := v_total_pilots - v_on_leave_count;
  v_remaining_after_approval := v_available - 1;
  v_can_approve := v_remaining_after_approval >= v_minimum_required;

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
