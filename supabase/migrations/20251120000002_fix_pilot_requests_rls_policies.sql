-- Migration: Fix RLS Policies for pilot_requests table
-- Description: Add proper INSERT policies for both admin and pilot submissions
-- Author: Maurice Rondeau
-- Created: 2025-11-20

-- Drop the overly restrictive existing policy
DROP POLICY IF EXISTS "Admins full access" ON pilot_requests;

-- Policy 1: Authenticated users (admins via Supabase Auth) have full access
CREATE POLICY "Authenticated users full access" ON pilot_requests
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Service role (for pilot portal submissions) has full access
CREATE POLICY "Service role full access" ON pilot_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON POLICY "Authenticated users full access" ON pilot_requests IS
  'Allows authenticated Supabase users (admins) full access to all pilot requests';

COMMENT ON POLICY "Service role full access" ON pilot_requests IS
  'Allows service role (used by pilot portal API) full access for pilot submissions';
