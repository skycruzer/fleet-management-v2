-- Fix Pilot Portal Login - Disable RLS on failed_login_attempts
-- Author: Maurice Rondeau
-- Date: 2025-11-16
-- Issue: RLS policy blocking login security logging

-- Disable RLS on failed_login_attempts table
-- This table only contains login attempt metadata (IP, timestamps)
-- Safe to disable RLS for service role operations
ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;

-- Add comment explaining why RLS is disabled
COMMENT ON TABLE failed_login_attempts IS 'Security audit table for failed login attempts. RLS disabled to allow service role logging.';
