-- ============================================================================
-- Migration: Full Redesign - Unified Authentication
-- Author: Maurice Rondeau
-- Date: 2026-01-28
--
-- Purpose: Merge an_users + pilot_users into a single `users` table,
--          merge admin_sessions + pilot_sessions into `sessions` table,
--          drop tasks/registration/password-reset tables.
--
-- This migration preserves existing UUIDs so FK references continue to work.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the unified `users` table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'pilot')),
  must_change_password BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  pilot_id UUID REFERENCES public.pilots(id) ON DELETE SET NULL,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users OWNER TO postgres;

COMMENT ON TABLE public.users IS 'Unified user accounts for admin, manager, and pilot users';
COMMENT ON COLUMN public.users.staff_id IS 'Unique login identifier (replaces email login)';
COMMENT ON COLUMN public.users.role IS 'User role: admin, manager, or pilot';
COMMENT ON COLUMN public.users.must_change_password IS 'Force password change on next login (true for new accounts)';
COMMENT ON COLUMN public.users.pilot_id IS 'Link to pilots table (NULL for admin/manager users)';
COMMENT ON COLUMN public.users.failed_login_attempts IS 'Counter for failed login attempts (replaces account_lockouts table)';
COMMENT ON COLUMN public.users.locked_until IS 'Account locked until this timestamp (replaces account_lockouts table)';

-- ============================================================================
-- STEP 2: Migrate admin users (an_users → users)
-- Preserve existing UUIDs so FK references remain valid
-- ============================================================================

INSERT INTO public.users (id, staff_id, email, name, password_hash, role, must_change_password, is_active, last_login_at, created_at, updated_at)
SELECT
  au.id,
  -- Use email as staff_id for existing admins (they can change it later)
  au.email AS staff_id,
  au.email,
  au.name,
  -- Use existing password_hash if set, otherwise default "niugini"
  COALESCE(au.password_hash, extensions.crypt('niugini', extensions.gen_salt('bf', 10))) AS password_hash,
  au.role,
  -- If they already have a password hash, no need to force change
  CASE WHEN au.password_hash IS NOT NULL THEN false ELSE true END AS must_change_password,
  true AS is_active,
  au.last_login_at,
  COALESCE(au.created_at, now()),
  COALESCE(au.updated_at, now())
FROM public.an_users au
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Migrate pilot users (pilot_users → users)
-- Preserve existing UUIDs so FK references remain valid
-- ============================================================================

INSERT INTO public.users (id, staff_id, email, name, password_hash, role, must_change_password, is_active, pilot_id, last_login_at, created_at, updated_at)
SELECT
  pu.id,
  -- Use employee_id as staff_id, fallback to 'PILOT-' + short UUID if null
  COALESCE(pu.employee_id, 'PILOT-' || LEFT(pu.id::text, 8)) AS staff_id,
  pu.email,
  TRIM(pu.first_name || ' ' || pu.last_name) AS name,
  -- Use existing password_hash if set, otherwise default "niugini"
  COALESCE(pu.password_hash, extensions.crypt('niugini', extensions.gen_salt('bf', 10))) AS password_hash,
  'pilot' AS role,
  -- If they already have a password hash, no need to force change
  CASE WHEN pu.password_hash IS NOT NULL THEN false ELSE true END AS must_change_password,
  COALESCE(pu.registration_approved, false) AS is_active,
  pu.pilot_id,
  pu.last_login_at,
  COALESCE(pu.created_at, now()),
  COALESCE(pu.updated_at, now())
FROM public.pilot_users pu
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 4: Create the unified `sessions` table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sessions OWNER TO postgres;

COMMENT ON TABLE public.sessions IS 'Unified server-side session storage for all user types';
COMMENT ON COLUMN public.sessions.session_token IS 'Cryptographically secure session token (min 32 chars)';
COMMENT ON COLUMN public.sessions.expires_at IS 'Session expiry time (default 24 hours)';
COMMENT ON COLUMN public.sessions.last_activity_at IS 'Last activity timestamp for idle timeout';

-- Create indexes for fast session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON public.sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON public.sessions(expires_at) WHERE is_active = true;

-- Create indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON public.users(staff_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_pilot_id ON public.users(pilot_id) WHERE pilot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = true;

-- ============================================================================
-- STEP 5: Update FK references on KEPT tables
-- Drop old constraints referencing an_users, add new ones referencing users
-- ============================================================================

-- certification_renewal_plans.created_by → users(id)
ALTER TABLE public.certification_renewal_plans
  DROP CONSTRAINT IF EXISTS certification_renewal_plans_created_by_fkey;
ALTER TABLE public.certification_renewal_plans
  ADD CONSTRAINT certification_renewal_plans_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- disciplinary_audit_log.user_id → users(id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disciplinary_audit_log' AND table_schema = 'public') THEN
    ALTER TABLE public.disciplinary_audit_log DROP CONSTRAINT IF EXISTS disciplinary_audit_log_user_id_fkey;
    ALTER TABLE public.disciplinary_audit_log
      ADD CONSTRAINT disciplinary_audit_log_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- disciplinary_matters FK updates
ALTER TABLE public.disciplinary_matters
  DROP CONSTRAINT IF EXISTS disciplinary_matters_assigned_to_fkey;
ALTER TABLE public.disciplinary_matters
  ADD CONSTRAINT disciplinary_matters_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.disciplinary_matters
  DROP CONSTRAINT IF EXISTS disciplinary_matters_reported_by_fkey;
ALTER TABLE public.disciplinary_matters
  ADD CONSTRAINT disciplinary_matters_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.disciplinary_matters
  DROP CONSTRAINT IF EXISTS disciplinary_matters_resolved_by_fkey;
ALTER TABLE public.disciplinary_matters
  ADD CONSTRAINT disciplinary_matters_resolved_by_fkey
  FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- leave_bids.reviewed_by → users(id)
ALTER TABLE public.leave_bids
  DROP CONSTRAINT IF EXISTS leave_bids_reviewed_by_fkey;
ALTER TABLE public.leave_bids
  ADD CONSTRAINT leave_bids_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- pilot_feedback.responded_by → users(id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pilot_feedback' AND table_schema = 'public') THEN
    ALTER TABLE public.pilot_feedback DROP CONSTRAINT IF EXISTS pilot_feedback_responded_by_fkey;
    ALTER TABLE public.pilot_feedback
      ADD CONSTRAINT pilot_feedback_responded_by_fkey
      FOREIGN KEY (responded_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- renewal_plan_history.changed_by → users(id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'renewal_plan_history' AND table_schema = 'public') THEN
    ALTER TABLE public.renewal_plan_history DROP CONSTRAINT IF EXISTS renewal_plan_history_changed_by_fkey;
    ALTER TABLE public.renewal_plan_history
      ADD CONSTRAINT renewal_plan_history_changed_by_fkey
      FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- feedback_categories.created_by → users(id) (was referencing pilot_users)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback_categories' AND table_schema = 'public') THEN
    ALTER TABLE public.feedback_categories DROP CONSTRAINT IF EXISTS feedback_categories_created_by_fkey;
    ALTER TABLE public.feedback_categories
      ADD CONSTRAINT feedback_categories_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- digital_forms.created_by → users(id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_forms' AND table_schema = 'public') THEN
    ALTER TABLE public.digital_forms DROP CONSTRAINT IF EXISTS digital_forms_created_by_fkey;
    ALTER TABLE public.digital_forms
      ADD CONSTRAINT digital_forms_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Drop deprecated views that reference old tables
-- ============================================================================

DROP VIEW IF EXISTS public.active_tasks_dashboard CASCADE;
DROP VIEW IF EXISTS public.pending_pilot_registrations CASCADE;

-- ============================================================================
-- STEP 7: Drop deprecated functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.cleanup_expired_pilot_sessions();
DROP FUNCTION IF EXISTS public.revoke_all_pilot_sessions(UUID, TEXT);
DROP FUNCTION IF EXISTS public.validate_pilot_session(TEXT);
DROP FUNCTION IF EXISTS public.cleanup_expired_admin_sessions();

-- ============================================================================
-- STEP 8: Drop deprecated tables
-- Use CASCADE to handle any remaining FK constraints
-- ============================================================================

-- Task-related tables (feature removed)
DROP TABLE IF EXISTS public.task_audit_log CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_categories CASCADE;

-- Password reset tokens (admin resets passwords now)
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;

-- Old session tables (merged into sessions)
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.pilot_sessions CASCADE;

-- Old user tables (merged into users) - must drop AFTER FK updates
-- Drop any remaining FK constraints first
DO $$ BEGIN
  -- Drop FK from pilot_users.approved_by → an_users (self-reference that would block drop)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pilot_users' AND table_schema = 'public') THEN
    ALTER TABLE public.pilot_users DROP CONSTRAINT IF EXISTS pilot_users_approved_by_fkey;
  END IF;
END $$;

-- Drop any FK constraints on deprecated tables that might still reference old user tables
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flight_requests' AND table_schema = 'public') THEN
    ALTER TABLE public.flight_requests DROP CONSTRAINT IF EXISTS flight_requests_pilot_user_id_fkey;
    ALTER TABLE public.flight_requests DROP CONSTRAINT IF EXISTS flight_requests_reviewed_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests' AND table_schema = 'public') THEN
    ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_pilot_user_id_fkey;
    ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_reviewed_by_fkey;
  END IF;
END $$;

-- Now drop old user tables
DROP TABLE IF EXISTS public.an_users CASCADE;
DROP TABLE IF EXISTS public.pilot_users CASCADE;

-- ============================================================================
-- STEP 9: Enable RLS on new tables
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users table RLS policies
CREATE POLICY "Service role full access to users"
  ON public.users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read users"
  ON public.users FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can read users for login"
  ON public.users FOR SELECT TO anon
  USING (true);

-- Sessions table RLS policies
CREATE POLICY "Service role full access to sessions"
  ON public.sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- STEP 10: Create helper functions for new session management
-- ============================================================================

-- Function to clean up expired sessions (run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sessions
  WHERE expires_at < NOW() AND is_active = true;

  UPDATE public.sessions
  SET is_active = false
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to revoke all sessions for a user
CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(target_user_id UUID, reason TEXT DEFAULT 'User logout')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE public.sessions
  SET is_active = false
  WHERE user_id = target_user_id
    AND is_active = true;

  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_users_updated_at();

-- ============================================================================
-- STEP 11: Verification
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
  admin_count INTEGER;
  pilot_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role IN ('admin', 'manager');
  SELECT COUNT(*) INTO pilot_count FROM public.users WHERE role = 'pilot';

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Total users: %', user_count;
  RAISE NOTICE '  Admin/Manager users: %', admin_count;
  RAISE NOTICE '  Pilot users: %', pilot_count;

  IF user_count = 0 THEN
    RAISE WARNING 'No users were migrated! Check an_users and pilot_users tables.';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Cron job function to clean up expired sessions';
COMMENT ON FUNCTION public.revoke_all_user_sessions(UUID, TEXT) IS 'Revoke all active sessions for a user';
