-- Fix: Crew Availability Check - Only count APPROVED requests, not PENDING
-- Developer: Maurice Rondeau | Date: January 16, 2026
--
-- Issue: The previous version incorrectly counted PENDING requests as "on leave"
-- This caused the availability check to fail because it was inflating the "on leave" count
-- with requests that haven't been approved yet.
--
-- Fix: Change workflow_status filter from IN ('APPROVED', 'PENDING') to = 'APPROVED'

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
  -- Count total active pilots of the given role (with row lock to prevent race conditions)
  SELECT COUNT(*) INTO v_total_pilots
  FROM pilots
  WHERE role = p_pilot_role
    AND is_active = true
  FOR UPDATE;

  -- Count pilots on APPROVED leave during the requested period
  -- FIX: Only count APPROVED requests, not PENDING (was: IN ('APPROVED', 'PENDING'))
  SELECT COUNT(DISTINCT pr.pilot_id) INTO v_on_leave_count
  FROM pilot_requests pr
  INNER JOIN pilots p ON pr.pilot_id = p.id
  WHERE p.role = p_pilot_role
    AND pr.request_category = 'LEAVE'
    AND pr.workflow_status = 'APPROVED'
    AND (pr.id != p_exclude_request_id OR p_exclude_request_id IS NULL)
    AND NOT (pr.end_date < p_start_date OR pr.start_date > p_end_date)
  FOR UPDATE OF pr;

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
$$ LANGUAGE plpgsql
