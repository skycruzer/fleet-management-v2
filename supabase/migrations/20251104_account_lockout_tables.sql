/**
 * Account Lockout Protection - Database Migration
 *
 * Creates tables for tracking failed login attempts and account lockouts.
 *
 * @version 1.0.0
 * @date 2025-11-04
 * @author Maurice Rondeau
 *
 * Security Features:
 * - Failed login attempt tracking
 * - Automatic account lockout after 5 failed attempts
 * - 30-minute lockout duration
 * - Admin unlock capability
 * - Email notifications
 *
 * To apply this migration:
 * 1. Copy this entire file content
 * 2. Go to Supabase Dashboard → SQL Editor
 * 3. Paste and execute
 */

-- ============================================================================
-- FAILED LOGIN ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45), -- Supports IPv4 and IPv6
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_failed_attempts_email
  ON failed_login_attempts(email);

CREATE INDEX IF NOT EXISTS idx_failed_attempts_timestamp
  ON failed_login_attempts(attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_attempts_email_timestamp
  ON failed_login_attempts(email, attempted_at DESC);

-- Comment
COMMENT ON TABLE failed_login_attempts IS
  'Tracks failed login attempts for brute force protection';

COMMENT ON COLUMN failed_login_attempts.email IS
  'Email address that attempted login (lowercase)';

COMMENT ON COLUMN failed_login_attempts.attempted_at IS
  'Timestamp of failed attempt';

COMMENT ON COLUMN failed_login_attempts.ip_address IS
  'IP address of failed attempt (for security tracking)';

-- ============================================================================
-- ACCOUNT LOCKOUTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT 'Too many failed login attempts',
  unlocked_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lockouts_email
  ON account_lockouts(email);

CREATE INDEX IF NOT EXISTS idx_lockouts_locked_until
  ON account_lockouts(locked_until DESC);

-- Note: Removed WHERE clause with NOW() as it's not IMMUTABLE
-- Instead, queries should filter by locked_until > NOW() at runtime
CREATE INDEX IF NOT EXISTS idx_lockouts_active
  ON account_lockouts(email, locked_until);

-- Comments
COMMENT ON TABLE account_lockouts IS
  'Records of account lockouts due to failed login attempts';

COMMENT ON COLUMN account_lockouts.email IS
  'Email address of locked account';

COMMENT ON COLUMN account_lockouts.locked_at IS
  'When the account was locked';

COMMENT ON COLUMN account_lockouts.locked_until IS
  'When the lockout expires (30 minutes from lock)';

COMMENT ON COLUMN account_lockouts.failed_attempts IS
  'Number of failed attempts that triggered lockout';

COMMENT ON COLUMN account_lockouts.unlocked_by IS
  'Admin user ID who manually unlocked (if applicable)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can view failed attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Admins can insert failed attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Admins can delete failed attempts" ON failed_login_attempts;

DROP POLICY IF EXISTS "Admins can view lockouts" ON account_lockouts;
DROP POLICY IF EXISTS "Admins can insert lockouts" ON account_lockouts;
DROP POLICY IF EXISTS "Admins can update lockouts" ON account_lockouts;
DROP POLICY IF EXISTS "Admins can delete lockouts" ON account_lockouts;

-- Failed login attempts policies (Admin-only)
CREATE POLICY "Admins can view failed attempts"
  ON failed_login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can insert failed attempts"
  ON failed_login_attempts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete failed attempts"
  ON failed_login_attempts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

-- Account lockouts policies (Admin-only)
CREATE POLICY "Admins can view lockouts"
  ON account_lockouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can insert lockouts"
  ON account_lockouts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can update lockouts"
  ON account_lockouts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete lockouts"
  ON account_lockouts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

-- ============================================================================
-- AUTOMATIC CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up old failed attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_failed_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

COMMENT ON FUNCTION cleanup_old_failed_attempts IS
  'Removes failed login attempts older than 24 hours';

-- Function to clean up expired lockouts
CREATE OR REPLACE FUNCTION cleanup_expired_lockouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM account_lockouts
  WHERE locked_until < NOW() - INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION cleanup_expired_lockouts IS
  'Removes expired lockouts older than 7 days (for audit trail)';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if account is currently locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lock_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lock_count
  FROM account_lockouts
  WHERE email = LOWER(user_email)
    AND locked_until > NOW();

  RETURN lock_count > 0;
END;
$$;

COMMENT ON FUNCTION is_account_locked IS
  'Check if an account is currently locked';

-- Function to get lockout expiry time
CREATE OR REPLACE FUNCTION get_lockout_expiry(user_email VARCHAR)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT locked_until INTO expiry_time
  FROM account_lockouts
  WHERE email = LOWER(user_email)
    AND locked_until > NOW()
  ORDER BY locked_at DESC
  LIMIT 1;

  RETURN expiry_time;
END;
$$;

COMMENT ON FUNCTION get_lockout_expiry IS
  'Get when the current lockout expires for an account';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'failed_login_attempts') THEN
    RAISE NOTICE '✅ Table "failed_login_attempts" created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create "failed_login_attempts" table';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'account_lockouts') THEN
    RAISE NOTICE '✅ Table "account_lockouts" created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create "account_lockouts" table';
  END IF;

  RAISE NOTICE '✅ Account lockout protection migration completed successfully';
  RAISE NOTICE 'ℹ️  Configuration: 5 failed attempts → 30 minute lockout';
END $$;
