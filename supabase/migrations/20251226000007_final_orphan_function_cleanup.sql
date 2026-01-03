-- Migration: Final Orphaned Function Cleanup
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- Drops functions that reference:
-- 1. Dropped tables (leave_requests)
-- 2. Missing columns (pilot_sessions.revoked_at, last_activity_at)
-- 3. Missing functions (is_pilot_owner)
-- 4. Missing columns in report_email_settings

-- ============================================================================
-- SECTION 1: Drop functions referencing leave_requests (dropped table)
-- ============================================================================

DROP FUNCTION IF EXISTS public.submit_leave_request_tx(
  uuid, text, date, date, integer, text, text
) CASCADE;

DROP FUNCTION IF EXISTS public.approve_leave_request(
  uuid, uuid, text
) CASCADE;

DROP FUNCTION IF EXISTS public.delete_pilot_with_cascade(uuid) CASCADE;

DROP FUNCTION IF EXISTS public.check_deprecated_table_usage() CASCADE;

-- ============================================================================
-- SECTION 2: Drop functions with missing columns in pilot_sessions
-- ============================================================================

-- These reference columns that don't exist: revoked_at, last_activity_at
DROP FUNCTION IF EXISTS public.revoke_all_pilot_sessions(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_pilot_session(text) CASCADE;

-- ============================================================================
-- SECTION 3: Drop functions referencing is_pilot_owner (dropped function)
-- ============================================================================

DROP FUNCTION IF EXISTS public.can_access_pilot_data(uuid) CASCADE;

-- ============================================================================
-- SECTION 4: Drop/fix get_report_email_recipients
-- ============================================================================

-- This function references a column 'email' that doesn't exist in report_email_settings
DROP FUNCTION IF EXISTS public.get_report_email_recipients(text) CASCADE;

-- ============================================================================
-- SECTION 5: Use pg_proc to catch any remaining overloads
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  drop_cmd TEXT;
BEGIN
  RAISE NOTICE '=== Dropping Remaining Orphaned Functions ===';

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
      'submit_leave_request_tx',
      'approve_leave_request',
      'delete_pilot_with_cascade',
      'check_deprecated_table_usage',
      'revoke_all_pilot_sessions',
      'validate_pilot_session',
      'can_access_pilot_data',
      'get_report_email_recipients'
    )
  LOOP
    drop_cmd := format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.func_name, func_record.func_args);
    RAISE NOTICE 'Dropping: %(%)', func_record.func_name, func_record.func_args;
    EXECUTE drop_cmd;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Cleanup Complete ===';
END $$;

-- ============================================================================
-- SECTION 6: Recreate session validation with correct schema
-- ============================================================================

-- Check pilot_sessions table structure first
DO $$
DECLARE
  has_revoked_at BOOLEAN;
  has_last_activity BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pilot_sessions' AND column_name = 'revoked_at'
  ) INTO has_revoked_at;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pilot_sessions' AND column_name = 'last_activity_at'
  ) INTO has_last_activity;

  RAISE NOTICE 'pilot_sessions.revoked_at exists: %', has_revoked_at;
  RAISE NOTICE 'pilot_sessions.last_activity_at exists: %', has_last_activity;
END $$;

-- Create simplified validate_pilot_session that works with current schema
CREATE OR REPLACE FUNCTION public.validate_pilot_session(token TEXT)
RETURNS TABLE (
  session_id UUID,
  pilot_user_id UUID,
  is_valid BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.pilot_user_id,
    (ps.is_active AND ps.expires_at > NOW()) AS is_valid,
    ps.expires_at
  FROM public.pilot_sessions ps
  WHERE ps.session_token = token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- Create simplified revoke_all_pilot_sessions that works with current schema
CREATE OR REPLACE FUNCTION public.revoke_all_pilot_sessions(user_id UUID, reason TEXT DEFAULT 'User logout')
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE public.pilot_sessions
  SET is_active = false
  WHERE pilot_user_id = user_id
    AND is_active = true;

  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

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
    'submit_leave_request_tx',
    'approve_leave_request',
    'delete_pilot_with_cascade',
    'check_deprecated_table_usage',
    'can_access_pilot_data',
    'get_report_email_recipients'
  );

  IF orphan_count = 0 THEN
    RAISE NOTICE '✅ All orphaned functions have been cleaned up';
  ELSE
    RAISE NOTICE '⚠️  % orphaned functions still remain', orphan_count;
  END IF;

  -- Verify recreated functions exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_pilot_session' AND pronamespace = 'public'::regnamespace) THEN
    RAISE NOTICE '✅ validate_pilot_session recreated with correct schema';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'revoke_all_pilot_sessions' AND pronamespace = 'public'::regnamespace) THEN
    RAISE NOTICE '✅ revoke_all_pilot_sessions recreated with correct schema';
  END IF;
END $$;
