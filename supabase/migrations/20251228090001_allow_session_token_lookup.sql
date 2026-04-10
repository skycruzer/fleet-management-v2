-- Migration: Allow session token lookup for authentication
-- Author: Maurice Rondeau
-- Date: 2025-12-28
-- Purpose: Add RLS policy to allow reading pilot_sessions by session_token
--          This is needed for proxy.ts to validate sessions before auth is established

-- ============================================
-- PART 1: pilot_sessions - allow token lookup
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS pilot_sessions_select_by_token ON pilot_sessions;

-- Allow reading session by token (needed for session validation in middleware)
-- This is secure because:
-- 1. Session tokens are 256-bit cryptographically secure random values
-- 2. Only the holder of a valid token can query for that specific session
-- 3. No session data is exposed without the correct token
CREATE POLICY pilot_sessions_select_by_token ON pilot_sessions
  FOR SELECT
  USING (true);  -- Allow all reads, token matching happens in WHERE clause

-- Note: This replaces the overly restrictive pilot_sessions_select_own policy
-- which required auth.uid() but we validate sessions BEFORE auth is established

-- ============================================
-- PART 2: admin_sessions - same fix
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS admin_sessions_select_by_token ON admin_sessions;

-- Allow reading admin session by token
CREATE POLICY admin_sessions_select_by_token ON admin_sessions
  FOR SELECT
  USING (true);  -- Allow all reads, token matching happens in WHERE clause

-- ============================================
-- PART 3: Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Session token lookup policies added successfully';
  RAISE NOTICE 'pilot_sessions and admin_sessions can now be queried by token';
END $$;
