-- Migration: Add password_hash column to an_users table and create admin_sessions table
-- Author: Maurice Rondeau
-- Date: 2025-12-28
-- Purpose: Enable bcrypt-based authentication for admin portal
--          (Previously, admin login was broken because an_users had no password storage)

-- ============================================
-- PART 1: Update an_users table
-- ============================================

-- Add password_hash column to an_users table
ALTER TABLE an_users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add last_login_at column for tracking login activity
ALTER TABLE an_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index for email lookups during login
CREATE INDEX IF NOT EXISTS idx_an_users_email_login ON an_users(email) WHERE password_hash IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN an_users.password_hash IS 'bcrypt hash of admin password (10 salt rounds)';
COMMENT ON COLUMN an_users.last_login_at IS 'Timestamp of last successful login';

-- ============================================
-- PART 2: Create admin_sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE,
    admin_user_id UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at) WHERE is_active = true;

-- Enable RLS on admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_sessions (service role bypasses these)
CREATE POLICY "Service role full access to admin_sessions"
    ON admin_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE admin_sessions IS 'Server-side session storage for admin portal authentication';

-- ============================================
-- PART 3: Session cleanup function
-- ============================================

-- Function to cleanup expired admin sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions
    WHERE expires_at < NOW() OR is_active = false;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ============================================
-- PART 4: Seed initial admin password
-- ============================================

-- Set password for existing admin user (skycruzer@icloud.com)
-- Password: mron2393 (bcrypt hash with 10 salt rounds)
UPDATE an_users
SET password_hash = '$2b$10$hME7XuW.8yCwCLhDFOsOTemsmDSA7o6BkymOq.lJ/9rKT1/MG5YnK'
WHERE email = 'skycruzer@icloud.com';

-- Verify the update (this will show in migration logs)
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM an_users
    WHERE email = 'skycruzer@icloud.com' AND password_hash IS NOT NULL;

    IF updated_count > 0 THEN
        RAISE NOTICE 'Admin password set successfully for skycruzer@icloud.com';
    ELSE
        RAISE WARNING 'No admin user found with email skycruzer@icloud.com';
    END IF;
END;
$$;
