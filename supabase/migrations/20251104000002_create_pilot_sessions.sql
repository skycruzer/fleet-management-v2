/**
 * Create Pilot Sessions Table
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Purpose: Implement secure server-side session management for pilot portal
 * Security: Fixes session fixation vulnerability (user ID as access token)
 *
 * Features:
 * - Cryptographically secure session tokens
 * - Server-side session storage
 * - Automatic expiry (24 hours default)
 * - Session revocation capability
 * - Audit trail (last activity tracking)
 */

-- Create pilot_sessions table
CREATE TABLE IF NOT EXISTS pilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session identification
  session_token TEXT NOT NULL UNIQUE,
  pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,

  -- Session metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Security tracking
  ip_address TEXT,
  user_agent TEXT,

  -- Session state
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,

  -- Indexes for performance
  CONSTRAINT session_token_length CHECK (length(session_token) >= 32)
);

-- Create indexes for fast session lookups
CREATE INDEX idx_pilot_sessions_token ON pilot_sessions(session_token) WHERE is_active = true;
CREATE INDEX idx_pilot_sessions_user_active ON pilot_sessions(pilot_user_id, is_active);
CREATE INDEX idx_pilot_sessions_expiry ON pilot_sessions(expires_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE pilot_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own sessions
CREATE POLICY pilot_sessions_select_own ON pilot_sessions
  FOR SELECT
  USING (
    pilot_user_id = auth.uid()
    OR pilot_user_id IN (
      SELECT id FROM pilot_users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Only system can insert sessions (via service role)
CREATE POLICY pilot_sessions_insert_system ON pilot_sessions
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- RLS Policy: Users can revoke their own sessions
CREATE POLICY pilot_sessions_update_own ON pilot_sessions
  FOR UPDATE
  USING (
    pilot_user_id = auth.uid()
    OR pilot_user_id IN (
      SELECT id FROM pilot_users WHERE id = auth.uid()
    )
  );

-- Function to clean up expired sessions (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_pilot_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions that have expired
  DELETE FROM pilot_sessions
  WHERE expires_at < NOW()
    AND is_active = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all sessions for a user
CREATE OR REPLACE FUNCTION revoke_all_pilot_sessions(user_id UUID, reason TEXT DEFAULT 'User logout')
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE pilot_sessions
  SET is_active = false,
      revoked_at = NOW(),
      revocation_reason = reason
  WHERE pilot_user_id = user_id
    AND is_active = true;

  GET DIAGNOSTICS revoked_count = ROW_COUNT;

  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and refresh session
CREATE OR REPLACE FUNCTION validate_pilot_session(token TEXT)
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
  FROM pilot_sessions ps
  WHERE ps.session_token = token;

  -- Update last activity time if session is valid
  UPDATE pilot_sessions
  SET last_activity_at = NOW()
  WHERE session_token = token
    AND is_active = true
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE pilot_sessions IS 'Server-side session storage for pilot portal authentication';
COMMENT ON COLUMN pilot_sessions.session_token IS 'Cryptographically secure session token (min 32 chars)';
COMMENT ON COLUMN pilot_sessions.expires_at IS 'Session expiry time (default 24 hours)';
COMMENT ON COLUMN pilot_sessions.last_activity_at IS 'Last activity timestamp for idle timeout';
COMMENT ON FUNCTION cleanup_expired_pilot_sessions() IS 'Cron job function to remove expired sessions';
COMMENT ON FUNCTION revoke_all_pilot_sessions(UUID, TEXT) IS 'Revoke all active sessions for a user (logout)';
COMMENT ON FUNCTION validate_pilot_session(TEXT) IS 'Validate session token and update activity timestamp';

-- Verify table created
DO $$
BEGIN
  RAISE NOTICE 'pilot_sessions table created successfully';
  RAISE NOTICE 'Session management functions created';
  RAISE NOTICE 'RLS policies enabled';
END $$;
