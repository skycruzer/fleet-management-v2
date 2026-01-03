-- Migration: Fix Unused Parameter Warning
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- Fixes: unused parameter "reason" in revoke_all_pilot_sessions

-- Drop and recreate without the unused parameter
-- Keep backward compatibility by making reason optional with default
DROP FUNCTION IF EXISTS public.revoke_all_pilot_sessions(uuid, text) CASCADE;

CREATE OR REPLACE FUNCTION public.revoke_all_pilot_sessions(user_id UUID)
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

COMMENT ON FUNCTION public.revoke_all_pilot_sessions(uuid) IS
  'Revokes all active sessions for a pilot user. Returns count of revoked sessions.';
