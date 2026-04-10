-- ============================================================================
-- Migration: Fix Broken Functions
-- Created: 2025-10-27
-- Purpose: Fix remaining broken functions with column/table reference errors
-- Reference: SUPABASE_DATABASE_REVIEW.md - Critical Issue #3
-- ============================================================================

-- This migration fixes:
-- 1. Functions referencing non-existent columns
-- 2. Functions referencing non-existent tables (crew_checks, fleet, expiry_alerts)
-- 3. Type casting issues
-- 4. Duplicate function versions

-- ============================================================================
-- PHASE 1: Drop Functions Referencing Non-Existent Tables
-- ============================================================================

-- Drop functions referencing crew_checks table (doesn't exist - use pilot_checks)
DROP FUNCTION IF EXISTS get_pilot_check_types(uuid);
DROP FUNCTION IF EXISTS mark_check_complete(uuid, uuid);
DROP FUNCTION IF EXISTS update_check_expiry_dates(uuid, date, date);
DROP FUNCTION IF EXISTS generate_check_alerts();
DROP FUNCTION IF EXISTS update_crew_instructor_status(uuid, boolean);

-- Drop functions referencing fleet table (not needed)
DROP FUNCTION IF EXISTS calculate_pilot_to_hull_ratio();

-- Drop functions referencing expiry_alerts table (doesn't exist)
DROP FUNCTION IF EXISTS cleanup_old_expiry_alerts(interval);
DROP FUNCTION IF EXISTS generate_certification_alerts();
DROP FUNCTION IF EXISTS generate_comprehensive_expiry_alerts();
DROP FUNCTION IF EXISTS generate_expiry_alerts();
DROP FUNCTION IF EXISTS generate_simplified_expiry_alerts();
DROP FUNCTION IF EXISTS acknowledge_alert(uuid);

-- Drop functions referencing audit_log (should use audit_logs plural)
DROP FUNCTION IF EXISTS create_audit_log(text, text, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS daily_maintenance();

-- Drop functions referencing crew_members table (use pilots instead)
DROP FUNCTION IF EXISTS check_training_currency(uuid);
DROP FUNCTION IF EXISTS get_dashboard_metrics();

-- ============================================================================
-- PHASE 2: Fix submit_flight_request_tx Column References
-- ============================================================================

-- Drop old version with wrong column names
DROP FUNCTION IF EXISTS submit_flight_request_tx(uuid, text, date, text, jsonb);
DROP FUNCTION IF EXISTS submit_flight_request_tx(uuid, text, date, text, text);

-- Create correct version
CREATE OR REPLACE FUNCTION submit_flight_request_tx(
  p_pilot_user_id UUID,
  p_request_type TEXT,
  p_flight_date DATE,
  p_reason TEXT DEFAULT NULL,
  p_route_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_pilot_id UUID;
BEGIN
  -- Get pilot_id from pilot_user_id
  SELECT p.id INTO v_pilot_id
  FROM pilots p
  JOIN pilot_users pu ON p.user_id = pu.id
  WHERE pu.id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for user %', p_pilot_user_id;
  END IF;

  -- Insert flight request (no submission_type or preferred_date columns)
  INSERT INTO flight_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    flight_date,
    reason,
    route_details,
    status,
    created_at
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_flight_date,
    p_reason,
    p_route_details,
    'PENDING',
    NOW()
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit flight request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION submit_flight_request_tx(uuid, text, date, text, jsonb) IS
'Transaction function for pilot flight requests with correct column names';

-- ============================================================================
-- PHASE 3: Fix batch_update_certifications (Remove completion_date Reference)
-- ============================================================================

DROP FUNCTION IF EXISTS batch_update_certifications(jsonb[]);

CREATE OR REPLACE FUNCTION batch_update_certifications(
  p_updates jsonb[]
)
RETURNS TABLE(
  updated_count INTEGER,
  error_count INTEGER,
  errors TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_update jsonb;
  v_cert_id uuid;
  v_updated_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Loop through each update
  FOREACH v_update IN ARRAY p_updates
  LOOP
    BEGIN
      v_cert_id := (v_update->>'id')::uuid;

      -- Update pilot_checks (no completion_date column)
      UPDATE pilot_checks
      SET
        expiry_date = COALESCE((v_update->>'expiry_date')::date, expiry_date),
        updated_at = NOW()
      WHERE id = v_cert_id;

      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_errors := array_append(v_errors, SQLERRM);
    END;
  END LOOP;

  RETURN QUERY SELECT v_updated_count, v_error_count, v_errors;
END;
$$;

COMMENT ON FUNCTION batch_update_certifications IS
'Batch update certifications without completion_date column';

-- ============================================================================
-- PHASE 4: Fix create_pilot_with_certifications Type Casting
-- ============================================================================

DROP FUNCTION IF EXISTS create_pilot_with_certifications(jsonb, jsonb[]);

CREATE OR REPLACE FUNCTION create_pilot_with_certifications(
  p_pilot_data JSONB,
  p_certifications JSONB[] DEFAULT ARRAY[]::JSONB[]
)
RETURNS TABLE(
  pilot_id UUID,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  role pilot_role,
  seniority_number INTEGER,
  certifications_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pilot_id UUID;
  v_seniority_number INTEGER;
  v_cert jsonb;
  v_certs_created INTEGER := 0;
BEGIN
  -- Calculate next seniority number
  SELECT COALESCE(MAX(seniority_number), 0) + 1
  INTO v_seniority_number
  FROM pilots;

  -- Insert pilot with proper type casting
  INSERT INTO pilots (
    employee_id,
    first_name,
    middle_name,
    last_name,
    role,  -- Cast to pilot_role enum
    contract_type,
    nationality,
    passport_number,
    passport_expiry,
    date_of_birth,
    commencement_date,
    seniority_number,
    is_active
  ) VALUES (
    p_pilot_data->>'employee_id',
    p_pilot_data->>'first_name',
    p_pilot_data->>'middle_name',
    p_pilot_data->>'last_name',
    (p_pilot_data->>'role')::pilot_role,  -- FIX: Cast text to pilot_role enum
    p_pilot_data->>'contract_type',
    p_pilot_data->>'nationality',
    p_pilot_data->>'passport_number',
    (p_pilot_data->>'passport_expiry')::date,
    (p_pilot_data->>'date_of_birth')::date,
    (p_pilot_data->>'commencement_date')::timestamptz,
    v_seniority_number,
    COALESCE((p_pilot_data->>'is_active')::boolean, true)
  )
  RETURNING id INTO v_pilot_id;

  -- Insert certifications if provided
  IF p_certifications IS NOT NULL THEN
    FOREACH v_cert IN ARRAY p_certifications
    LOOP
      BEGIN
        INSERT INTO pilot_checks (
          pilot_id,
          check_type_id,
          expiry_date
        ) VALUES (
          v_pilot_id,
          (v_cert->>'check_type_id')::uuid,
          (v_cert->>'expiry_date')::date
        );
        v_certs_created := v_certs_created + 1;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but continue
          RAISE WARNING 'Failed to insert certification: %', SQLERRM;
      END;
    END LOOP;
  END IF;

  -- Return pilot details
  RETURN QUERY
  SELECT
    v_pilot_id,
    (p_pilot_data->>'employee_id')::TEXT,
    (p_pilot_data->>'first_name')::TEXT,
    (p_pilot_data->>'last_name')::TEXT,
    (p_pilot_data->>'role')::pilot_role,
    v_seniority_number,
    v_certs_created;
END;
$$;

COMMENT ON FUNCTION create_pilot_with_certifications IS
'Create pilot with certifications and proper type casting';

-- ============================================================================
-- PHASE 5: Fix Functions Using check_code Instead of code
-- ============================================================================

-- Update get_expiring_checks to use correct column name
DROP FUNCTION IF EXISTS get_expiring_checks(integer);

CREATE OR REPLACE FUNCTION get_expiring_checks(p_days_threshold INTEGER DEFAULT 30)
RETURNS TABLE(
  pilot_id UUID,
  pilot_name TEXT,
  check_type_name TEXT,
  check_code TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as pilot_id,
    (p.first_name || ' ' || p.last_name) as pilot_name,
    ct.name as check_type_name,
    ct.check_code as check_code,  -- FIX: Use check_code not code
    pc.expiry_date,
    (pc.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM pilot_checks pc
  JOIN pilots p ON pc.pilot_id = p.id
  JOIN check_types ct ON pc.check_type_id = ct.id
  WHERE pc.expiry_date <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL
    AND p.is_active = true
  ORDER BY pc.expiry_date ASC, p.last_name, p.first_name;
END;
$$;

COMMENT ON FUNCTION get_expiring_checks IS
'Get expiring certifications using correct check_code column';

-- ============================================================================
-- PHASE 6: Fix calculate_years_in_service (Use commencement_date)
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_years_in_service(uuid);

CREATE OR REPLACE FUNCTION calculate_years_in_service(p_pilot_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_commencement_date DATE;
  v_years_in_service NUMERIC;
BEGIN
  -- Get commencement date (not hire_date which doesn't exist)
  SELECT commencement_date INTO v_commencement_date
  FROM pilots
  WHERE id = p_pilot_id;

  IF v_commencement_date IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate years of service
  v_years_in_service := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_commencement_date));

  RETURN v_years_in_service;
END;
$$;

COMMENT ON FUNCTION calculate_years_in_service(uuid) IS
'Calculate years of service using commencement_date (not hire_date)';

-- ============================================================================
-- PHASE 7: Remove Unused Function Parameters
-- ============================================================================

-- Fix complete_task - remove unused p_completed_by parameter
DROP FUNCTION IF EXISTS complete_task(uuid, uuid);

CREATE OR REPLACE FUNCTION complete_task(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE tasks
  SET
    status = 'COMPLETED',
    completion_date = NOW(),
    updated_at = NOW()
  WHERE id = p_task_id
  RETURNING true INTO v_updated;

  RETURN COALESCE(v_updated, false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete task: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION complete_task(uuid) IS
'Marks a task as completed (removed unused parameter)';

-- Fix calculate_optimal_renewal_date - remove unused validity_period_months
DROP FUNCTION IF EXISTS calculate_optimal_renewal_date(date, integer);

CREATE OR REPLACE FUNCTION calculate_optimal_renewal_date(
  p_current_expiry_date DATE
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_optimal_date DATE;
BEGIN
  -- Calculate optimal renewal date (30 days before expiry)
  v_optimal_date := p_current_expiry_date - INTERVAL '30 days';

  RETURN v_optimal_date;
END;
$$;

COMMENT ON FUNCTION calculate_optimal_renewal_date(date) IS
'Calculate optimal renewal date (removed unused parameter)';

-- ============================================================================
-- Migration Complete - Broken Functions Fixed
-- ============================================================================

-- Summary of changes:
--  Dropped 15+ functions referencing non-existent tables
--  Fixed submit_flight_request_tx column references
--  Fixed batch_update_certifications (removed completion_date)
--  Fixed create_pilot_with_certifications type casting
--  Fixed get_expiring_checks (use check_code not code)
--  Fixed calculate_years_in_service (use commencement_date)
--  Removed unused function parameters (complete_task, calculate_optimal_renewal_date)

-- Database function errors should be significantly reduced!
