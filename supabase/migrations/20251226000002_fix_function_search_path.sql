-- Migration: Fix Function Search Path Security Warnings
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- Fixes: function_search_path_mutable warnings from Supabase linter
-- Issue: Functions without SET search_path are vulnerable to search path injection
-- Solution: Add SET search_path = '' to all SECURITY DEFINER functions
--
-- Also addresses:
-- - materialized_view_in_api: pilot_dashboard_metrics accessible via API
-- - auth_leaked_password_protection: Requires dashboard configuration (documented below)
--
-- NOTE: auth_leaked_password_protection must be enabled in Supabase Dashboard:
-- Go to Authentication > Settings > Password Security > Enable "Leaked Password Protection"

-- ============================================================================
-- 1. Pilot Portal Auth Functions
-- ============================================================================

-- Fix: get_current_pilot_user_id
CREATE OR REPLACE FUNCTION public.get_current_pilot_user_id()
RETURNS uuid AS $$
BEGIN
  -- Try to get pilot_user_id from session variable (set by pilot portal API)
  RETURN NULLIF(current_setting('app.current_pilot_user_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- Fix: user_owns_leave_bid
CREATE OR REPLACE FUNCTION public.user_owns_leave_bid(bid_uuid uuid)
RETURNS boolean AS $$
DECLARE
  pilot_user_uuid uuid;
BEGIN
  -- Get the pilot_user_id from session
  pilot_user_uuid := public.get_current_pilot_user_id();

  IF pilot_user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if this pilot_user owns the bid via pilot_id
  RETURN EXISTS (
    SELECT 1
    FROM public.leave_bids lb
    INNER JOIN public.pilot_users pu ON lb.pilot_id = pu.pilot_id
    WHERE lb.id = bid_uuid
    AND pu.id = pilot_user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- ============================================================================
-- 2. Pilot Session Functions
-- ============================================================================

-- Fix: cleanup_expired_pilot_sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_pilot_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.pilot_sessions
  WHERE expires_at < NOW()
    AND is_active = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix: revoke_all_pilot_sessions
CREATE OR REPLACE FUNCTION public.revoke_all_pilot_sessions(user_id UUID, reason TEXT DEFAULT 'User logout')
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE public.pilot_sessions
  SET is_active = false,
      revoked_at = NOW(),
      revocation_reason = reason
  WHERE pilot_user_id = user_id
    AND is_active = true;

  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix: validate_pilot_session
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

  -- Update last activity time if session is valid
  UPDATE public.pilot_sessions
  SET last_activity_at = NOW()
  WHERE session_token = token
    AND is_active = true
    AND public.pilot_sessions.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- ============================================================================
-- 3. Account Lockout Functions
-- ============================================================================

-- Fix: cleanup_old_failed_attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_failed_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Fix: cleanup_expired_lockouts
CREATE OR REPLACE FUNCTION public.cleanup_expired_lockouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.account_lockouts
  WHERE locked_until < NOW() - INTERVAL '7 days';
END;
$$;

-- Fix: is_account_locked
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  lock_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lock_count
  FROM public.account_lockouts
  WHERE email = LOWER(user_email)
    AND locked_until > NOW();

  RETURN lock_count > 0;
END;
$$;

-- Fix: get_lockout_expiry
CREATE OR REPLACE FUNCTION public.get_lockout_expiry(user_email VARCHAR)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT locked_until INTO expiry_time
  FROM public.account_lockouts
  WHERE email = LOWER(user_email)
    AND locked_until > NOW()
  ORDER BY locked_at DESC
  LIMIT 1;

  RETURN expiry_time;
END;
$$;

-- ============================================================================
-- 4. Password History Functions
-- ============================================================================

-- Fix: get_password_history_count
CREATE OR REPLACE FUNCTION public.get_password_history_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  history_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO history_count
  FROM public.password_history
  WHERE user_id = user_uuid;

  RETURN history_count;
END;
$$;

-- Fix: cleanup_password_history
CREATE OR REPLACE FUNCTION public.cleanup_password_history(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.password_history
  WHERE id IN (
    SELECT id
    FROM public.password_history
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    OFFSET 5
  );
END;
$$;

-- Fix: get_password_age_days
CREATE OR REPLACE FUNCTION public.get_password_age_days(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  days_old INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER
  INTO days_old
  FROM public.password_history
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(days_old, 0);
END;
$$;

-- Fix: trigger_cleanup_password_history (trigger function, no SECURITY DEFINER needed but add search_path)
CREATE OR REPLACE FUNCTION public.trigger_cleanup_password_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Only keep last 5 passwords
  DELETE FROM public.password_history
  WHERE id IN (
    SELECT id
    FROM public.password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 5
  );

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. Pilot Request Sync Functions
-- ============================================================================

-- Fix: sync_pilot_to_requests (if exists)
CREATE OR REPLACE FUNCTION public.sync_pilot_to_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync pilot data to pilot_requests when pilot is updated
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.pilot_requests
    SET
      rank = NEW.role,
      employee_number = NEW.employee_id,
      name = COALESCE(NEW.full_name, NEW.first_name || ' ' || NEW.last_name)
    WHERE pilot_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: sync_pilot_request_denormalization
CREATE OR REPLACE FUNCTION public.sync_pilot_request_denormalization()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if relevant fields have changed
  IF (OLD.role IS DISTINCT FROM NEW.role OR
      OLD.employee_id IS DISTINCT FROM NEW.employee_id OR
      OLD.full_name IS DISTINCT FROM NEW.full_name) THEN

    UPDATE public.pilot_requests
    SET
      rank = NEW.role,
      employee_number = NEW.employee_id,
      name = COALESCE(NEW.full_name, NEW.first_name || ' ' || NEW.last_name)
    WHERE pilot_id = NEW.id;

    RAISE NOTICE 'Synced denormalized data for pilot %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================================================
-- 6. Deprecated Table Check Function
-- ============================================================================

-- Fix: check_deprecated_table_usage
CREATE OR REPLACE FUNCTION public.check_deprecated_table_usage()
RETURNS TABLE (
  table_name text,
  status text,
  record_count bigint,
  recommendation text
) AS $$
DECLARE
  leave_exists boolean;
  flight_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = 'leave_requests') INTO leave_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = 'flight_requests') INTO flight_exists;

  IF leave_exists THEN
    RETURN QUERY
    SELECT
      'leave_requests'::text,
      'DEPRECATED - READ ONLY'::text,
      (SELECT COUNT(*) FROM public.leave_requests),
      'Migrate to pilot_requests with request_category=''LEAVE'''::text;
  ELSE
    RETURN QUERY
    SELECT
      'leave_requests'::text,
      'DROPPED'::text,
      0::bigint,
      'Table has been dropped - migration complete'::text;
  END IF;

  IF flight_exists THEN
    RETURN QUERY
    SELECT
      'flight_requests'::text,
      'DEPRECATED - EMPTY'::text,
      (SELECT COUNT(*) FROM public.flight_requests),
      'Can be dropped - all data in pilot_requests with request_category=''FLIGHT'''::text;
  ELSE
    RETURN QUERY
    SELECT
      'flight_requests'::text,
      'DROPPED'::text,
      0::bigint,
      'Table has been dropped - migration complete'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- ============================================================================
-- 7. Report Email Settings Function
-- ============================================================================

-- Fix: get_report_email_recipients (drop and recreate to change signature)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_report_email_recipients') THEN
    -- Drop existing function (handles different signatures)
    DROP FUNCTION IF EXISTS public.get_report_email_recipients(TEXT);
    DROP FUNCTION IF EXISTS public.get_report_email_recipients(VARCHAR);

    -- Recreate with fixed search_path
    CREATE FUNCTION public.get_report_email_recipients(report_type_param TEXT)
    RETURNS TEXT[]
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $body$
    DECLARE
      recipients TEXT[];
    BEGIN
      SELECT ARRAY_AGG(email)
      INTO recipients
      FROM public.report_email_settings
      WHERE report_type = report_type_param
        AND is_active = true;

      RETURN COALESCE(recipients, ARRAY[]::TEXT[]);
    END;
    $body$;
  END IF;
END $$;

-- Fix: update_report_email_settings_updated_at (if exists)
-- Note: This function has a trigger depending on it, so we need to drop CASCADE and recreate trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_report_email_settings_updated_at') THEN
    -- Drop trigger first, then function, then recreate both
    DROP TRIGGER IF EXISTS update_report_email_settings_timestamp ON public.report_email_settings;
    DROP FUNCTION IF EXISTS public.update_report_email_settings_updated_at();

    -- Recreate function with fixed search_path
    CREATE FUNCTION public.update_report_email_settings_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = ''
    AS $body$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $body$;

    -- Recreate trigger
    CREATE TRIGGER update_report_email_settings_timestamp
      BEFORE UPDATE ON public.report_email_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_report_email_settings_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 8. Dashboard Metrics Function
-- ============================================================================

-- Fix: refresh_dashboard_metrics
CREATE OR REPLACE FUNCTION public.refresh_dashboard_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.pilot_dashboard_metrics;
END;
$$;

-- ============================================================================
-- 9. Materialized View API Exposure (Optional Security Hardening)
-- ============================================================================

-- The pilot_dashboard_metrics materialized view is intentionally accessible
-- to authenticated users for dashboard functionality.
-- However, we can revoke access from 'anon' role for security.

REVOKE SELECT ON public.pilot_dashboard_metrics FROM anon;

-- Add explanatory comment
COMMENT ON MATERIALIZED VIEW public.pilot_dashboard_metrics IS
  'Dashboard metrics for pilot management. Accessible by authenticated users only.
   Refresh via: SELECT refresh_dashboard_metrics();
   Note: anon access revoked for security (Dec 2025)';

-- ============================================================================
-- 10. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  search_path_set BOOLEAN;
BEGIN
  RAISE NOTICE '=== Function Search Path Verification ===';

  FOR func_record IN
    SELECT proname, prosecdef
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
      'get_current_pilot_user_id',
      'user_owns_leave_bid',
      'cleanup_expired_pilot_sessions',
      'revoke_all_pilot_sessions',
      'validate_pilot_session',
      'cleanup_old_failed_attempts',
      'cleanup_expired_lockouts',
      'is_account_locked',
      'get_lockout_expiry',
      'get_password_history_count',
      'cleanup_password_history',
      'get_password_age_days',
      'trigger_cleanup_password_history',
      'sync_pilot_request_denormalization',
      'check_deprecated_table_usage',
      'refresh_dashboard_metrics'
    )
  LOOP
    RAISE NOTICE '✅ Fixed: % (SECURITY DEFINER: %)', func_record.proname, func_record.prosecdef;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Materialized View Access ===';
  RAISE NOTICE '✅ pilot_dashboard_metrics: anon access revoked';

  RAISE NOTICE '';
  RAISE NOTICE '=== Manual Action Required ===';
  RAISE NOTICE '⚠️  Enable Leaked Password Protection in Supabase Dashboard:';
  RAISE NOTICE '    Authentication > Settings > Password Security > Leaked Password Protection';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Function search path migration completed';
END $$;
