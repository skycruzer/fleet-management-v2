-- Migration: Fix Remaining Security Issues
-- Date: 2025-10-24
-- Description: Fix mutable search_path in remaining functions and secure materialized view

-- ============================================================================
-- 1. FIX MUTABLE SEARCH_PATH IN FUNCTIONS
-- ============================================================================

-- Fix approve_leave_request (overloaded version without search_path)
CREATE OR REPLACE FUNCTION public.approve_leave_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_status text,
  p_comments text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Set immutable search_path
AS $function$
DECLARE
  v_request_info jsonb;
  v_result jsonb;
BEGIN
  -- Validate status
  IF p_status NOT IN ('APPROVED', 'DENIED') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be APPROVED or DENIED', p_status;
  END IF;

  -- Capture request info before update
  SELECT jsonb_build_object(
    'id', lr.id,
    'pilot_id', lr.pilot_id,
    'request_type', lr.request_type,
    'start_date', lr.start_date,
    'end_date', lr.end_date,
    'days_count', lr.days_count,
    'old_status', lr.status,
    'pilot_name', p.first_name || ' ' || p.last_name,
    'employee_id', p.employee_id
  ) INTO v_request_info
  FROM leave_requests lr
  JOIN pilots p ON p.id = lr.pilot_id
  WHERE lr.id = p_request_id;

  IF v_request_info IS NULL THEN
    RAISE EXCEPTION 'Leave request with id % not found', p_request_id;
  END IF;

  -- Check if already reviewed
  IF (v_request_info->>'old_status') != 'PENDING' THEN
    RAISE EXCEPTION 'Leave request % has already been reviewed (status: %)',
                    p_request_id,
                    v_request_info->>'old_status';
  END IF;

  -- Step 1: Update leave request status
  UPDATE leave_requests
  SET
    status = p_status,
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_comments = p_comments,
    updated_at = now()
  WHERE id = p_request_id;

  -- Step 2: Create audit log entry
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id,
    created_at
  ) VALUES (
    'leave_requests',
    p_request_id,
    'UPDATE',
    jsonb_build_object('status', v_request_info->>'old_status'),
    jsonb_build_object(
      'status', p_status,
      'reviewed_by', p_reviewer_id,
      'reviewed_at', now(),
      'review_comments', p_comments
    ),
    p_reviewer_id,
    now()
  );

  -- Return summary
  SELECT jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'pilot_name', v_request_info->>'pilot_name',
    'employee_id', v_request_info->>'employee_id',
    'request_type', v_request_info->>'request_type',
    'old_status', v_request_info->>'old_status',
    'new_status', p_status,
    'reviewed_at', now(),
    'message', format('Leave request %s for %s (%s days)',
                     lower(p_status),
                     v_request_info->>'pilot_name',
                     v_request_info->>'days_count')
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to approve leave request: %', SQLERRM;
END;
$function$;

COMMENT ON FUNCTION public.approve_leave_request(uuid, uuid, text, text) IS
'Approve or deny a leave request with validation and audit logging. SECURITY: search_path fixed to public.';


-- Fix submit_leave_request_tx (overloaded version without search_path)
CREATE OR REPLACE FUNCTION public.submit_leave_request_tx(
  p_pilot_user_id uuid,
  p_request_type text,
  p_start_date date,
  p_end_date date,
  p_days_count integer,
  p_roster_period text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Set immutable search_path
AS $function$
DECLARE
  v_pilot_id uuid;
  v_leave_request_id uuid;
  v_result jsonb;
  v_request_date date;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_request_type IS NULL OR trim(p_request_type) = '' THEN
    RAISE EXCEPTION 'request_type cannot be empty';
  END IF;

  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'start_date cannot be null';
  END IF;

  IF p_end_date IS NULL THEN
    RAISE EXCEPTION 'end_date cannot be null';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'end_date cannot be before start_date';
  END IF;

  IF p_days_count IS NULL OR p_days_count <= 0 THEN
    RAISE EXCEPTION 'days_count must be greater than 0';
  END IF;

  IF p_roster_period IS NULL OR trim(p_roster_period) = '' THEN
    RAISE EXCEPTION 'roster_period cannot be empty';
  END IF;

  -- Step 1: Get pilot_id from pilot_user_mappings
  SELECT pilot_id INTO v_pilot_id
  FROM pilot_user_mappings
  WHERE pilot_user_id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for pilot_user_id %', p_pilot_user_id;
  END IF;

  -- Step 2: Set request date to today
  v_request_date := CURRENT_DATE;

  -- Step 3: Insert leave request
  INSERT INTO leave_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    start_date,
    end_date,
    days_count,
    roster_period,
    reason,
    status,
    submission_type,
    request_date,
    request_method
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_start_date,
    p_end_date,
    p_days_count,
    p_roster_period,
    p_reason,
    'PENDING',
    'pilot',
    v_request_date,
    'SYSTEM'
  )
  RETURNING id INTO v_leave_request_id;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'leave_request_id', v_leave_request_id,
    'pilot_id', v_pilot_id,
    'pilot_user_id', p_pilot_user_id,
    'request_type', p_request_type,
    'start_date', p_start_date,
    'end_date', p_end_date,
    'days_count', p_days_count,
    'roster_period', p_roster_period,
    'status', 'PENDING',
    'message', 'Leave request submitted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit leave request: %', SQLERRM;
END;
$function$;

COMMENT ON FUNCTION public.submit_leave_request_tx(uuid, text, date, date, integer, text, text) IS
'Submit a leave request for a pilot. SECURITY: search_path fixed to public.';


-- Fix submit_flight_request_tx (overloaded version without search_path)
CREATE OR REPLACE FUNCTION public.submit_flight_request_tx(
  p_pilot_user_id uuid,
  p_request_type text,
  p_flight_date date,
  p_description text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Set immutable search_path
AS $function$
DECLARE
  v_pilot_id uuid;
  v_flight_request_id uuid;
  v_result jsonb;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_request_type IS NULL OR trim(p_request_type) = '' THEN
    RAISE EXCEPTION 'request_type cannot be empty';
  END IF;

  IF p_flight_date IS NULL THEN
    RAISE EXCEPTION 'flight_date cannot be null';
  END IF;

  IF p_description IS NULL OR trim(p_description) = '' THEN
    RAISE EXCEPTION 'description cannot be empty';
  END IF;

  -- Step 1: Get pilot_id from pilot_user_mappings
  SELECT pilot_id INTO v_pilot_id
  FROM pilot_user_mappings
  WHERE pilot_user_id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for pilot_user_id %', p_pilot_user_id;
  END IF;

  -- Step 2: Insert flight request
  INSERT INTO flight_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    flight_date,
    description,
    reason,
    status
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_flight_date,
    p_description,
    p_reason,
    'PENDING'
  )
  RETURNING id INTO v_flight_request_id;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'flight_request_id', v_flight_request_id,
    'pilot_id', v_pilot_id,
    'pilot_user_id', p_pilot_user_id,
    'request_type', p_request_type,
    'flight_date', p_flight_date,
    'description', p_description,
    'status', 'PENDING',
    'message', 'Flight request submitted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit flight request: %', SQLERRM;
END;
$function$;

COMMENT ON FUNCTION public.submit_flight_request_tx(uuid, text, date, text, text) IS
'Submit a flight request for a pilot. SECURITY: search_path fixed to public.';


-- ============================================================================
-- 2. FIX MATERIALIZED VIEW API EXPOSURE
-- ============================================================================

-- NOTE: We already fixed this in the previous migration (20251024_database_cleanup_and_security_fixes.sql)
-- by revoking SELECT from anon and authenticated roles.
-- This is just a verification comment.

-- Verify that dashboard_metrics is not accessible by anon/authenticated
-- The previous migration already executed:
-- REVOKE SELECT ON public.dashboard_metrics FROM anon, authenticated;


-- ============================================================================
-- 3. DOCUMENTATION OF REMAINING ISSUES
-- ============================================================================

COMMENT ON SCHEMA public IS
'Public schema - Contains all application tables and functions.

REMAINING SECURITY WARNINGS (Cannot be fixed via migration):
1. Extensions in public schema (btree_gin, btree_gist, pg_trgm)
   - Requires superuser privileges to move extensions
   - Not fixable by application-level migrations
   - Supabase default configuration

2. Auth leaked password protection (Manual fix required)
   - Enable in Supabase Dashboard → Authentication → Policies
   - Navigate to Password Strength settings
   - Enable "Check against HaveIBeenPwned database"

3. Auth insufficient MFA options (Manual fix required)
   - Enable in Supabase Dashboard → Authentication → Providers
   - Add additional MFA methods (TOTP, SMS, etc.)
   - Recommended: Enable TOTP at minimum
';
