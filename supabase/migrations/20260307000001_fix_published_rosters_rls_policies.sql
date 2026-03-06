-- Migration: Fix overly permissive RLS policies on published roster tables
-- Author: Maurice Rondeau
-- Date: 2026-03-07
-- Problem: Original policies used auth.jwt() ->> 'role' = 'authenticated' for ALL
--   operations, allowing any authenticated user (including pilots) to create/update/delete.
-- Fix: Read access remains open to authenticated users. Write access restricted to
--   users with admin-level service_role key (enforced at API layer via service-role client).

-- =====================================================
-- Fix activity_codes policies
-- =====================================================

-- Drop the overly permissive "Admins can manage" policy
DROP POLICY IF EXISTS "Admins can manage activity codes" ON activity_codes;

-- Recreate: only service_role can insert/update/delete
CREATE POLICY "Service role can manage activity codes" ON activity_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Read policy stays as-is (authenticated users can read activity codes)
-- "Authenticated users can read activity codes" already exists and is correct

-- =====================================================
-- Fix published_rosters policies
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins full access published rosters" ON published_rosters;

-- Authenticated users can read rosters
CREATE POLICY "Authenticated users can read published rosters" ON published_rosters
  FOR SELECT USING (auth.jwt() ->> 'role' = 'authenticated');

-- Only service_role can write (API layer enforces admin auth before using service-role client)
CREATE POLICY "Service role can manage published rosters" ON published_rosters
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- Fix roster_assignments policies
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins full access roster assignments" ON roster_assignments;

-- Authenticated users can read assignments
CREATE POLICY "Authenticated users can read roster assignments" ON roster_assignments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'authenticated');

-- Only service_role can write
CREATE POLICY "Service role can manage roster assignments" ON roster_assignments
  FOR ALL USING (auth.role() = 'service_role');
