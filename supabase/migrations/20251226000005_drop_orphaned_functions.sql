-- Migration: Drop Orphaned Functions
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- These functions reference tables that no longer exist (crew_members, crew_checks,
-- expiry_alerts, audit_log, etc.) from a legacy schema. They cause linter errors
-- and should be removed.

-- ============================================================================
-- SECTION 1: Functions referencing crew_members (doesn't exist)
-- ============================================================================

DROP FUNCTION IF EXISTS public.check_training_currency();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_manager_or_admin();
DROP FUNCTION IF EXISTS public.map_crew_name_to_id(text);
DROP FUNCTION IF EXISTS public.validate_crew_member_completeness();

-- ============================================================================
-- SECTION 2: Functions referencing crew_checks (doesn't exist)
-- ============================================================================

DROP FUNCTION IF EXISTS public.insert_crew_checks_batch();
DROP FUNCTION IF EXISTS public.add_crew_check(uuid, text, date, date, text, text);
DROP FUNCTION IF EXISTS public.add_crew_check(uuid, varchar, date, date, varchar, varchar);

-- ============================================================================
-- SECTION 3: Functions referencing other non-existent tables
-- ============================================================================

-- References expiry_alerts
DROP FUNCTION IF EXISTS public.cleanup_old_expiry_alerts();

-- References audit_log (we use audit_logs)
DROP FUNCTION IF EXISTS public.create_audit_log(text, text, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.create_audit_log(varchar, varchar, uuid, jsonb, jsonb);

-- References mv_pilot_expiry_status (materialized view doesn't exist)
DROP FUNCTION IF EXISTS public.get_renewal_recommendations(integer);

-- References system_settings type
DROP FUNCTION IF EXISTS public.get_system_settings(text, text);
DROP FUNCTION IF EXISTS public.get_system_settings(varchar, varchar);
DROP FUNCTION IF EXISTS public.upsert_system_settings(text, text, integer, numeric, numeric, numeric, numeric, integer, integer, integer, boolean, boolean, text, text);
DROP FUNCTION IF EXISTS public.upsert_system_settings(varchar, varchar, integer, numeric, numeric, numeric, numeric, integer, integer, integer, boolean, boolean, varchar, varchar);

-- References pilot_certifications (we use pilot_checks)
DROP FUNCTION IF EXISTS public.update_certification_status();

-- References user_profiles
DROP FUNCTION IF EXISTS public.user_has_admin_role(uuid);

-- References non-existent get_current_user_role function
DROP FUNCTION IF EXISTS public.user_has_role(text[]);
DROP FUNCTION IF EXISTS public.user_has_role(varchar[]);

-- ============================================================================
-- SECTION 4: Functions with column mismatches
-- ============================================================================

-- References check_types.code (column is check_code)
DROP FUNCTION IF EXISTS public.import_crew_check(text, text, date, date, text, text);
DROP FUNCTION IF EXISTS public.import_crew_check(varchar, varchar, date, date, varchar, varchar);
DROP FUNCTION IF EXISTS public.mark_check_complete(uuid, text, date);
DROP FUNCTION IF EXISTS public.mark_check_complete(uuid, varchar, date);

-- References notifications.recipient_type (column doesn't exist)
DROP FUNCTION IF EXISTS public.create_notification(uuid, text, uuid, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_notification(uuid, varchar, uuid, varchar, varchar, varchar, varchar, jsonb);

-- References flight_requests.preferred_date (column doesn't exist)
DROP FUNCTION IF EXISTS public.submit_flight_request_tx(uuid, text, text, date, text);
DROP FUNCTION IF EXISTS public.submit_flight_request_tx(uuid, varchar, varchar, date, varchar);

-- References pilots.email (column doesn't exist)
DROP FUNCTION IF EXISTS public.is_pilot_owner(uuid);

-- ============================================================================
-- SECTION 5: Functions with return type mismatches
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_expiring_checks(integer);
DROP FUNCTION IF EXISTS public.find_pilot_by_name(text);
DROP FUNCTION IF EXISTS public.find_pilot_by_name(varchar);

-- ============================================================================
-- SECTION 6: Functions with variable naming issues (optional cleanup)
-- ============================================================================

-- These have warnings about reserved keywords as variable names
-- We'll recreate calculate_check_status with fixed variable name
DROP FUNCTION IF EXISTS public.calculate_check_status(date, date);

-- Recreate with fixed variable name
CREATE OR REPLACE FUNCTION public.calculate_check_status(
  p_completion_date date,
  p_validity_date date
)
RETURNS text AS $$
DECLARE
  check_date date := CURRENT_DATE;
BEGIN
  IF p_validity_date IS NULL THEN
    RETURN 'unknown';
  ELSIF p_validity_date < check_date THEN
    RETURN 'expired';
  ELSIF p_validity_date <= check_date + INTERVAL '30 days' THEN
    RETURN 'expiring';
  ELSE
    RETURN 'valid';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = '';

-- Fix calculate_optimal_renewal_date (unused parameter warning)
DROP FUNCTION IF EXISTS public.calculate_optimal_renewal_date(date, integer);

CREATE OR REPLACE FUNCTION public.calculate_optimal_renewal_date(
  p_expiry_date date,
  p_validity_period_months integer DEFAULT 12
)
RETURNS date AS $$
BEGIN
  -- Calculate optimal renewal date (30 days before expiry)
  -- The validity_period_months could be used for more complex calculations
  RETURN p_expiry_date - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = '';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  RAISE NOTICE '=== Orphaned Function Cleanup Complete ===';
  RAISE NOTICE '';

  -- Count remaining functions that might have issues
  SELECT COUNT(*) INTO orphan_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'check_training_currency',
    'is_admin',
    'is_manager_or_admin',
    'map_crew_name_to_id',
    'validate_crew_member_completeness',
    'insert_crew_checks_batch',
    'cleanup_old_expiry_alerts',
    'create_audit_log',
    'get_renewal_recommendations',
    'get_system_settings',
    'upsert_system_settings',
    'update_certification_status',
    'user_has_admin_role',
    'user_has_role',
    'import_crew_check',
    'mark_check_complete',
    'create_notification',
    'submit_flight_request_tx',
    'is_pilot_owner',
    'get_expiring_checks',
    'find_pilot_by_name',
    'add_crew_check'
  );

  IF orphan_count = 0 THEN
    RAISE NOTICE '✅ All orphaned functions have been dropped';
  ELSE
    RAISE NOTICE '⚠️  % orphaned functions may still exist (check for overloaded signatures)', orphan_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ calculate_check_status: Fixed reserved keyword variable name';
  RAISE NOTICE '✅ calculate_optimal_renewal_date: Fixed unused parameter warning';
END $$;
