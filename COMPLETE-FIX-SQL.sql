-- ============================================================================
-- ⚠  DANGER: THIS SCRIPT DISABLES ROW LEVEL SECURITY. DO NOT RUN AS-IS.  ⚠
-- ============================================================================
-- Kept for historical reference only. Running it against production would
-- re-open the exposure closed by supabase/migrations/20260731090000 and
-- 20260731090100: credential and PII tables (pilot_users holds bcrypt
-- password_hash; an_users likewise) becoming readable with the public anon key
-- that ships in every browser bundle.
--
-- `fix-all-rls-policies.sql` disabling RLS on pilot_users is the most plausible
-- origin of that exposure in the first place.
--
-- supabase/migrations/ is the single source of truth for schema and RLS. Add a
-- migration instead of pasting any of these into the SQL editor.
-- ============================================================================

-- Complete Fix for Pilot Portal Login
-- Run ALL these commands in Supabase SQL Editor
-- https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new

-- 1. Disable RLS on failed_login_attempts
ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies on failed_login_attempts
DROP POLICY IF EXISTS "failed_login_attempts_policy" ON failed_login_attempts;
DROP POLICY IF EXISTS "Enable insert for service role" ON failed_login_attempts;
DROP POLICY IF EXISTS "Enable read for service role" ON failed_login_attempts;

-- 3. Disable RLS on pilot_sessions (if enabled)
ALTER TABLE pilot_sessions DISABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies on pilot_sessions
DROP POLICY IF EXISTS "pilot_sessions_policy" ON pilot_sessions;
DROP POLICY IF EXISTS "Enable insert for service role" ON pilot_sessions;
DROP POLICY IF EXISTS "Enable read for service role" ON pilot_sessions;

-- 5. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 6. Verify RLS is disabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('failed_login_attempts', 'pilot_sessions')
AND schemaname = 'public';

-- Expected output:
-- failed_login_attempts | false
-- pilot_sessions        | false
