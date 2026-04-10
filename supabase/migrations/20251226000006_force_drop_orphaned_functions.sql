-- Migration: Force Drop Orphaned Functions
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- Uses CASCADE and queries pg_proc to drop all orphaned functions regardless of signature

DO $$
DECLARE
  func_record RECORD;
  drop_cmd TEXT;
BEGIN
  RAISE NOTICE '=== Dropping Orphaned Functions ===';

  -- Find and drop all versions of orphaned functions
  FOR func_record IN
    SELECT
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS func_args,
      p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'add_crew_check',
      'check_training_currency',
      'cleanup_old_expiry_alerts',
      'create_audit_log',
      'create_notification',
      'find_pilot_by_name',
      'get_expiring_checks',
      'get_renewal_recommendations',
      'get_system_settings',
      'import_crew_check',
      'insert_crew_checks_batch',
      'is_admin',
      'is_manager_or_admin',
      'is_pilot_owner',
      'map_crew_name_to_id',
      'mark_check_complete',
      'submit_flight_request_tx',
      'update_certification_status',
      'upsert_system_settings',
      'user_has_admin_role',
      'user_has_role',
      'validate_crew_member_completeness',
      'calculate_check_status',
      'calculate_optimal_renewal_date'
    )
  LOOP
    drop_cmd := format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.func_name, func_record.func_args);
    RAISE NOTICE 'Dropping: %(%)', func_record.func_name, func_record.func_args;
    EXECUTE drop_cmd;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Orphaned Functions Cleanup Complete ===';
END $$;

-- ============================================================================
-- Recreate useful functions with proper implementations
-- ============================================================================

-- calculate_check_status: Useful utility function
CREATE OR REPLACE FUNCTION public.calculate_check_status(
  p_expiry_date date
)
RETURNS text AS $$
BEGIN
  IF p_expiry_date IS NULL THEN
    RETURN 'unknown';
  ELSIF p_expiry_date < CURRENT_DATE THEN
    RETURN 'expired';
  ELSIF p_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    RETURN 'expiring';
  ELSE
    RETURN 'valid';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = '';

COMMENT ON FUNCTION public.calculate_check_status(date) IS
  'Calculates check status based on expiry date. Returns: expired, expiring, valid, or unknown.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'add_crew_check',
    'check_training_currency',
    'cleanup_old_expiry_alerts',
    'create_audit_log',
    'create_notification',
    'find_pilot_by_name',
    'get_expiring_checks',
    'get_renewal_recommendations',
    'get_system_settings',
    'import_crew_check',
    'insert_crew_checks_batch',
    'is_admin',
    'is_manager_or_admin',
    'is_pilot_owner',
    'map_crew_name_to_id',
    'mark_check_complete',
    'submit_flight_request_tx',
    'update_certification_status',
    'upsert_system_settings',
    'user_has_admin_role',
    'user_has_role',
    'validate_crew_member_completeness'
  );

  IF orphan_count = 0 THEN
    RAISE NOTICE '✅ All orphaned functions have been dropped';
  ELSE
    RAISE NOTICE '⚠️  % orphaned functions still remain', orphan_count;
  END IF;

  -- Verify calculate_check_status was recreated
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_check_status' AND pronamespace = 'public'::regnamespace) THEN
    RAISE NOTICE '✅ calculate_check_status recreated with simplified signature';
  END IF;
END $$;
