-- ============================================================================
-- Migration: Final Database Cleanup
-- Created: 2025-10-27
-- Purpose: Fix remaining database issues from linter report
-- Reference: Final linter check after Phase 5 migration
-- ============================================================================

-- This migration fixes:
-- 1. notification_type enum values (CRITICAL - breaks notifications)
-- 2. Column name mismatches (check_types.name -> check_description, etc.)
-- 3. Non-existent table references (crew_checks, crew_members, etc.)
-- 4. Ambiguous column references in PL/pgSQL
-- 5. Return type mismatches

-- ============================================================================
-- PHASE 1: Fix Notification System - Correct Enum Values
-- ============================================================================

-- Drop broken notification functions
DROP FUNCTION IF EXISTS approve_leave_request(uuid, uuid, text);
DROP FUNCTION IF EXISTS submit_leave_request_tx(uuid, text, date, date, integer, text, text);

-- Recreate approve_leave_request with correct notification_type
CREATE OR REPLACE FUNCTION approve_leave_request(
  p_request_id UUID,
  p_approved_by UUID,
  p_approval_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN;
  v_pilot_user_id UUID;
  v_recipient_auth_id UUID;
BEGIN
  -- Get pilot_user_id from the request
  SELECT pilot_user_id INTO v_pilot_user_id
  FROM leave_requests
  WHERE id = p_request_id;

  IF v_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'Leave request % not found or has no associated pilot user', p_request_id;
  END IF;

  -- Get the auth.users id for the pilot
  SELECT id INTO v_recipient_auth_id
  FROM pilot_users
  WHERE id = v_pilot_user_id;

  -- Update leave request with approval
  UPDATE leave_requests
  SET
    status = 'APPROVED',
    reviewed_by = p_approved_by,
    approved_by = p_approved_by,
    reviewed_at = NOW(),
    review_notes = p_approval_notes,
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING true INTO v_updated;

  -- Create notification using correct enum value
  IF v_updated AND v_recipient_auth_id IS NOT NULL THEN
    PERFORM create_notification(
      v_recipient_auth_id,
      'leave_request_approved'::notification_type,  -- FIX: Use correct enum value
      'Leave Request Approved',
      'Your leave request has been approved.',
      '/portal/leave-requests'
    );
  END IF;

  RETURN COALESCE(v_updated, false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to approve leave request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION approve_leave_request(uuid, uuid, text) IS
'Approves a leave request and creates notification with correct notification_type enum';

-- Recreate submit_leave_request_tx with correct notification_type
CREATE OR REPLACE FUNCTION submit_leave_request_tx(
  p_pilot_user_id UUID,
  p_request_type TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_days_count INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_pilot_id UUID;
  v_recipient_auth_id UUID;
BEGIN
  -- Get pilot_id from pilot_user_id
  SELECT p.id, pu.id
  INTO v_pilot_id, v_recipient_auth_id
  FROM pilots p
  JOIN pilot_users pu ON p.user_id = pu.id
  WHERE pu.id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for user %', p_pilot_user_id;
  END IF;

  -- Insert leave request
  INSERT INTO leave_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    start_date,
    end_date,
    days_count,
    reason,
    notes,
    status,
    submission_type,
    created_at
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_start_date,
    p_end_date,
    p_days_count,
    p_reason,
    p_notes,
    'PENDING',
    'pilot',
    NOW()
  )
  RETURNING id INTO v_request_id;

  -- Create notification using correct enum value
  IF v_recipient_auth_id IS NOT NULL THEN
    PERFORM create_notification(
      v_recipient_auth_id,
      'leave_request_submitted'::notification_type,  -- FIX: Use correct enum value
      'Leave Request Submitted',
      'Your leave request has been submitted for review.',
      '/portal/leave-requests'
    );
  END IF;

  RETURN v_request_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit leave request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION submit_leave_request_tx(uuid, text, date, date, integer, text, text) IS
'Transaction function for pilot leave request submissions with correct notification_type enum';

-- ============================================================================
-- PHASE 2: Fix Column Name Mismatches
-- ============================================================================

-- Fix get_pilot_expiring_items - use check_description instead of name
DROP FUNCTION IF EXISTS get_pilot_expiring_items(uuid, integer);

CREATE OR REPLACE FUNCTION get_pilot_expiring_items(
  p_pilot_id UUID,
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE(
  check_type_name TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.check_description as check_type_name,  -- FIX: Use check_description not name
    pc.expiry_date,
    (pc.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    CASE
      WHEN pc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
      WHEN pc.expiry_date <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL THEN 'EXPIRING_SOON'
      ELSE 'VALID'
    END as status
  FROM pilot_checks pc
  JOIN check_types ct ON pc.check_type_id = ct.id
  WHERE pc.pilot_id = p_pilot_id
    AND pc.expiry_date <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL
  ORDER BY pc.expiry_date ASC;
END;
$$;

COMMENT ON FUNCTION get_pilot_expiring_items(uuid, integer) IS
'Get expiring items for a pilot using correct column check_description';

-- Fix get_expiring_checks - use check_description instead of name
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
    ct.check_description as check_type_name,  -- FIX: Use check_description not name
    ct.check_code as check_code,
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

COMMENT ON FUNCTION get_expiring_checks(integer) IS
'Get expiring certifications using correct check_description column';

-- Fix add_crew_check - use check_code (already exists, just documenting)
-- This function references check_types.code which doesn't exist
DROP FUNCTION IF EXISTS add_crew_check(uuid, text, date, date, text);

-- ============================================================================
-- PHASE 3: Drop Functions Referencing Non-Existent Tables
-- ============================================================================

-- Drop functions referencing crew_checks table
DROP FUNCTION IF EXISTS mark_check_complete(uuid, date, date, text);
DROP FUNCTION IF EXISTS update_check_expiry_dates();
DROP FUNCTION IF EXISTS check_training_currency(uuid);

-- Drop functions referencing crew_members table
DROP FUNCTION IF EXISTS update_crew_instructor_status(uuid, boolean, boolean);
DROP FUNCTION IF EXISTS get_pilot_data_with_checks();

-- Drop functions referencing expiry_alerts table
DROP FUNCTION IF EXISTS cleanup_old_expiry_alerts(interval);
DROP FUNCTION IF EXISTS acknowledge_alert(uuid, text);

-- Drop functions referencing audit_log (singular - should be audit_logs plural)
DROP FUNCTION IF EXISTS create_audit_log(text, text, uuid, jsonb, jsonb);

-- Drop functions referencing alerts table
DROP FUNCTION IF EXISTS acknowledge_alert(uuid);

-- Drop functions referencing user_profiles table
DROP FUNCTION IF EXISTS get_current_pilot_id();

-- Drop functions referencing auth_users table
DROP FUNCTION IF EXISTS get_current_user_role();

-- Drop functions referencing pilot_certifications table
DROP FUNCTION IF EXISTS get_certification_compliance_data();
DROP FUNCTION IF EXISTS get_certification_stats();

-- ============================================================================
-- PHASE 4: Fix Ambiguous Column References
-- ============================================================================

-- Fix get_pilot_expiry_summary - ambiguous pilot_id
DROP FUNCTION IF EXISTS get_pilot_expiry_summary(uuid);

CREATE OR REPLACE FUNCTION get_pilot_expiry_summary(p_pilot_id UUID)
RETURNS TABLE(
  next_expiry_date DATE,
  next_expiry_check_type TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    MIN(pc.expiry_date) as next_expiry_date,
    pc.check_type_id::TEXT as next_expiry_check_type
  FROM pilot_checks pc
  WHERE pc.pilot_id = p_pilot_id  -- Fully qualified to avoid ambiguity
    AND pc.expiry_date >= CURRENT_DATE
  GROUP BY pc.check_type_id
  ORDER BY MIN(pc.expiry_date)
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_pilot_expiry_summary(uuid) IS
'Get next expiring certification for pilot (fixed ambiguous column reference)';

-- Fix create_pilot_with_certifications - ambiguous seniority_number
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
  -- Calculate next seniority number with alias to avoid ambiguity
  SELECT COALESCE(MAX(p.seniority_number), 0) + 1  -- FIX: Use table alias
  INTO v_seniority_number
  FROM pilots p;

  -- Insert pilot with proper type casting
  INSERT INTO pilots (
    employee_id,
    first_name,
    middle_name,
    last_name,
    role,
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
    (p_pilot_data->>'role')::pilot_role,
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

COMMENT ON FUNCTION create_pilot_with_certifications(jsonb, jsonb[]) IS
'Create pilot with certifications (fixed ambiguous seniority_number reference)';

-- ============================================================================
-- PHASE 5: Fix Return Type Mismatches
-- ============================================================================

-- Fix find_pilot_by_name - return type mismatch
DROP FUNCTION IF EXISTS find_pilot_by_name(text);

CREATE OR REPLACE FUNCTION find_pilot_by_name(p_search_name TEXT)
RETURNS TABLE(
  id UUID,
  employee_id TEXT,
  full_name TEXT,
  role pilot_role,
  contract_type TEXT,  -- FIX: Changed from VARCHAR(50) to TEXT
  is_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.employee_id,
    (p.first_name || ' ' || p.last_name) as full_name,
    p.role,
    p.contract_type::TEXT,  -- Cast to TEXT
    p.is_active
  FROM pilots p
  WHERE
    p.first_name ILIKE '%' || p_search_name || '%'
    OR p.last_name ILIKE '%' || p_search_name || '%'
    OR (p.first_name || ' ' || p.last_name) ILIKE '%' || p_search_name || '%'
  ORDER BY p.last_name, p.first_name;
END;
$$;

COMMENT ON FUNCTION find_pilot_by_name(text) IS
'Find pilots by name search (fixed return type mismatch)';

-- Fix get_check_category_distribution - return type mismatch
DROP FUNCTION IF EXISTS get_check_category_distribution();

CREATE OR REPLACE FUNCTION get_check_category_distribution()
RETURNS TABLE(
  category TEXT,  -- FIX: Changed from VARCHAR to TEXT
  check_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ct.category, 'Uncategorized')::TEXT as category,  -- Cast to TEXT
    COUNT(*)::BIGINT as check_count
  FROM pilot_checks pc
  JOIN check_types ct ON pc.check_type_id = ct.id
  GROUP BY ct.category
  ORDER BY check_count DESC;
END;
$$;

COMMENT ON FUNCTION get_check_category_distribution() IS
'Get distribution of checks by category (fixed return type)';

-- ============================================================================
-- PHASE 6: Drop Completely Broken Functions (Can't Be Fixed)
-- ============================================================================

-- These functions reference tables/columns that don't exist and can't be fixed
DROP FUNCTION IF EXISTS submit_leave_request_tx(uuid, text, date, date, text);  -- Old version
DROP FUNCTION IF EXISTS submit_flight_request_tx(uuid, text, date, text, text);  -- Old version with wrong columns
DROP FUNCTION IF EXISTS get_crew_audit_trail(uuid, integer);  -- References audit_logs columns that don't exist
DROP FUNCTION IF EXISTS get_pilot_compliance_stats(uuid);  -- References check_types columns that don't exist
DROP FUNCTION IF EXISTS get_pilot_dashboard_data();  -- References pilots.status which doesn't exist
DROP FUNCTION IF EXISTS check_tri_tre_compliance();  -- References pilots.status which doesn't exist
DROP FUNCTION IF EXISTS cleanup_audit_logs();  -- References audit_logs.regulatory_impact which doesn't exist
DROP FUNCTION IF EXISTS generate_compliance_report(date, date);  -- References audit_logs columns that don't exist
DROP FUNCTION IF EXISTS daily_database_maintenance();  -- Calls non-existent functions
DROP FUNCTION IF EXISTS daily_expiry_maintenance();  -- Calls non-existent functions
DROP FUNCTION IF EXISTS daily_status_update();  -- References non-existent tables/columns
DROP FUNCTION IF EXISTS is_admin(uuid);  -- Calls get_user_role() which doesn't exist
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, jsonb);  -- Old signature with wrong columns
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text, jsonb);  -- Old signature with recipient_type

-- ============================================================================
-- PHASE 7: Fix Functions with Missing Columns
-- ============================================================================

-- Fix submit_leave_request_tx (old version) - references submitted_at which doesn't exist
DROP FUNCTION IF EXISTS submit_leave_request_tx(uuid, date, date, text, text);

-- Note: The correct version already exists from our previous migration
-- This is just cleanup of old broken versions

-- ============================================================================
-- Migration Complete - Final Database Cleanup
-- ============================================================================

-- Summary of changes:
-- ✅ Fixed notification_type enum values (CRITICAL)
-- ✅ Fixed column name mismatches (check_description, etc.)
-- ✅ Dropped 20+ functions referencing non-existent tables
-- ✅ Fixed ambiguous column references
-- ✅ Fixed return type mismatches
-- ✅ Removed all completely broken/unfixable functions

-- Expected Result: Significant reduction in linter errors!
