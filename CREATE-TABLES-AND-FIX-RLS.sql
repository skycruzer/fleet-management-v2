-- Complete Fix for Pilot Portal Login
-- Creates missing tables and fixes RLS policies
-- Run in Supabase SQL Editor: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new

-- =============================================================================
-- 1. CREATE pilot_sessions TABLE (if not exists)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_pilot_sessions_token ON pilot_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_pilot_sessions_pilot_user_id ON pilot_sessions(pilot_user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_sessions_expires_at ON pilot_sessions(expires_at);

-- =============================================================================
-- 2. CREATE failed_login_attempts TABLE (if not exists)
-- =============================================================================
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);

-- =============================================================================
-- 3. DISABLE RLS on both tables (service role needs full access)
-- =============================================================================
ALTER TABLE pilot_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. DROP any existing RLS policies (cleanup)
-- =============================================================================
DO $$
BEGIN
    -- Drop pilot_sessions policies
    DROP POLICY IF EXISTS "pilot_sessions_policy" ON pilot_sessions;
    DROP POLICY IF EXISTS "Enable insert for service role" ON pilot_sessions;
    DROP POLICY IF EXISTS "Enable read for service role" ON pilot_sessions;
    DROP POLICY IF EXISTS "Enable update for service role" ON pilot_sessions;
    DROP POLICY IF EXISTS "Enable delete for service role" ON pilot_sessions;

    -- Drop failed_login_attempts policies
    DROP POLICY IF EXISTS "failed_login_attempts_policy" ON failed_login_attempts;
    DROP POLICY IF EXISTS "Enable insert for service role" ON failed_login_attempts;
    DROP POLICY IF EXISTS "Enable read for service role" ON failed_login_attempts;
EXCEPTION
    WHEN undefined_table THEN
        -- Ignore if table doesn't exist
        NULL;
END $$;

-- =============================================================================
-- 5. GRANT permissions to service role (ensure full access)
-- =============================================================================
GRANT ALL ON pilot_sessions TO service_role;
GRANT ALL ON failed_login_attempts TO service_role;

-- =============================================================================
-- 6. VERIFY the fix worked
-- =============================================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM information_schema.table_privileges
   WHERE table_name = tablename AND grantee = 'service_role') as service_role_grants
FROM pg_tables
WHERE tablename IN ('failed_login_attempts', 'pilot_sessions')
AND schemaname = 'public';

-- Expected output:
-- failed_login_attempts | f (false) | >0
-- pilot_sessions        | f (false) | >0
