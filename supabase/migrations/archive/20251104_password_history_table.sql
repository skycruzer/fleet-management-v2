/**
 * Password History - Database Migration
 *
 * Creates table for tracking password history to prevent reuse.
 *
 * @version 1.0.0
 * @date 2025-11-04
 * @author Maurice Rondeau
 *
 * Security Features:
 * - Password history tracking (last 5 passwords)
 * - Prevents password reuse
 * - Automatic cleanup of old history
 * - Row-level security policies
 *
 * To apply this migration:
 * 1. Copy this entire file content
 * 2. Go to Supabase Dashboard → SQL Editor
 * 3. Paste and execute
 */

-- ============================================================================
-- PASSWORD HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_history_user_id
  ON password_history(user_id);

CREATE INDEX IF NOT EXISTS idx_password_history_created_at
  ON password_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_history_user_created
  ON password_history(user_id, created_at DESC);

-- Comment
COMMENT ON TABLE password_history IS
  'Tracks password history to prevent password reuse (last 5 passwords)';

COMMENT ON COLUMN password_history.user_id IS
  'Reference to user in an_users table';

COMMENT ON COLUMN password_history.password_hash IS
  'Bcrypt hash of password (never store plaintext)';

COMMENT ON COLUMN password_history.created_at IS
  'When this password was set';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own password history" ON password_history;
DROP POLICY IF EXISTS "Admins can view all password history" ON password_history;
DROP POLICY IF EXISTS "System can insert password history" ON password_history;
DROP POLICY IF EXISTS "System can delete password history" ON password_history;

-- Users can view their own password history
CREATE POLICY "Users can view own password history"
  ON password_history
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all password history
CREATE POLICY "Admins can view all password history"
  ON password_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

-- System can insert password history (service role)
CREATE POLICY "System can insert password history"
  ON password_history
  FOR INSERT
  WITH CHECK (true);

-- System can delete old password history (service role)
CREATE POLICY "System can delete password history"
  ON password_history
  FOR DELETE
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get password history count for user
CREATE OR REPLACE FUNCTION get_password_history_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  history_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO history_count
  FROM password_history
  WHERE user_id = user_uuid;

  RETURN history_count;
END;
$$;

COMMENT ON FUNCTION get_password_history_count IS
  'Get number of stored password history entries for a user';

-- Function to cleanup old password history (keep last 5)
CREATE OR REPLACE FUNCTION cleanup_password_history(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_history
  WHERE id IN (
    SELECT id
    FROM password_history
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    OFFSET 5
  );
END;
$$;

COMMENT ON FUNCTION cleanup_password_history IS
  'Cleanup old password history, keeping only the last 5 passwords';

-- Function to get oldest password age in days
CREATE OR REPLACE FUNCTION get_password_age_days(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  days_old INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER
  INTO days_old
  FROM password_history
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(days_old, 0);
END;
$$;

COMMENT ON FUNCTION get_password_age_days IS
  'Get age in days of the most recent password';

-- ============================================================================
-- AUTOMATIC CLEANUP TRIGGER
-- ============================================================================

-- Trigger function to automatically cleanup after insert
CREATE OR REPLACE FUNCTION trigger_cleanup_password_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only keep last 5 passwords
  DELETE FROM password_history
  WHERE id IN (
    SELECT id
    FROM password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 5
  );

  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS auto_cleanup_password_history ON password_history;

CREATE TRIGGER auto_cleanup_password_history
  AFTER INSERT ON password_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_password_history();

COMMENT ON TRIGGER auto_cleanup_password_history ON password_history IS
  'Automatically cleanup old password history after each insert';

-- ============================================================================
-- PASSWORD POLICY TABLE (OPTIONAL - FOR FUTURE USE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_length INTEGER DEFAULT 12,
  require_uppercase BOOLEAN DEFAULT true,
  require_lowercase BOOLEAN DEFAULT true,
  require_number BOOLEAN DEFAULT true,
  require_special BOOLEAN DEFAULT true,
  max_age_days INTEGER DEFAULT 90, -- Force password change after 90 days
  prevent_reuse_count INTEGER DEFAULT 5, -- Prevent reusing last 5 passwords
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default policy
INSERT INTO password_policies (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE password_policies IS
  'Password policy configuration (single row, global settings)';

-- Enable RLS on password policies
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;

-- Only admins can view/update password policies
CREATE POLICY "Admins can manage password policies"
  ON password_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'password_history') THEN
    RAISE NOTICE '✅ Table "password_history" created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create "password_history" table';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'password_policies') THEN
    RAISE NOTICE '✅ Table "password_policies" created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create "password_policies" table';
  END IF;

  RAISE NOTICE '✅ Password history migration completed successfully';
  RAISE NOTICE 'ℹ️  Configuration: Last 5 passwords tracked, 90-day expiry (optional)';
END $$;
