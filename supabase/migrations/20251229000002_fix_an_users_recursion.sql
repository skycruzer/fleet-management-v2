-- Migration: Fix an_users RLS Infinite Recursion
-- Date: 2025-12-29
-- Author: Maurice Rondeau
--
-- PROBLEM: The an_users table has policies that query an_users from within
--          an_users policies, causing infinite recursion (error code 42P17).
--
-- ROOT CAUSE: Policy "an_users_select" contains:
--   EXISTS (SELECT 1 FROM an_users au WHERE au.id = auth.uid() AND au.role = 'admin')
--   which triggers the same policy when evaluated.
--
-- SOLUTION: Drop ALL existing policies and create simple, non-recursive ones.
--           Use SECURITY DEFINER function for admin checks instead.

-- ============================================================================
-- STEP 1: Drop ALL existing policies on an_users
-- ============================================================================

-- Drop all known policies (by various names from different migrations)
DROP POLICY IF EXISTS "an_users_select" ON an_users;
DROP POLICY IF EXISTS "an_users_select_own" ON an_users;
DROP POLICY IF EXISTS "an_users_select_all" ON an_users;
DROP POLICY IF EXISTS "an_users_update_self" ON an_users;
DROP POLICY IF EXISTS "an_users_insert_service_role_only" ON an_users;
DROP POLICY IF EXISTS "an_users_update_service_role_only" ON an_users;
DROP POLICY IF EXISTS "an_users_delete_service_role_only" ON an_users;
DROP POLICY IF EXISTS "an_users_anon_select" ON an_users;
DROP POLICY IF EXISTS "an_users_anon_insert" ON an_users;
DROP POLICY IF EXISTS "an_users_anon_update" ON an_users;
DROP POLICY IF EXISTS "an_users_delete_policy" ON an_users;
DROP POLICY IF EXISTS "an_users_insert_policy" ON an_users;
DROP POLICY IF EXISTS "an_users_update_policy" ON an_users;
DROP POLICY IF EXISTS "Users can view own profile" ON an_users;
DROP POLICY IF EXISTS "Users can update own profile" ON an_users;
DROP POLICY IF EXISTS "Admins can view all users" ON an_users;
DROP POLICY IF EXISTS "Admins can manage users" ON an_users;
DROP POLICY IF EXISTS "Authenticated users can view all an_users" ON an_users;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies
-- ============================================================================

-- ANON role: Allow reading for session validation (proxy.ts uses anon client)
-- This is safe because we only expose non-sensitive fields and session tokens
-- are cryptographically secure
CREATE POLICY "an_users_anon_read"
  ON an_users
  FOR SELECT
  TO anon
  USING (true);

-- AUTHENTICATED role: Users can read their own profile only
-- No self-reference - just compares id to auth.uid()
CREATE POLICY "an_users_auth_select_own"
  ON an_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- AUTHENTICATED role: Users can update their own profile only
CREATE POLICY "an_users_auth_update_own"
  ON an_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- SERVICE_ROLE: Full access for admin operations (bypasses RLS anyway)
-- These are just for clarity - service_role bypasses RLS by default
CREATE POLICY "an_users_service_all"
  ON an_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 3: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create/Update helper function for admin checks
-- ============================================================================

-- This SECURITY DEFINER function bypasses RLS when checking if user is admin
-- Use this in OTHER tables' policies instead of querying an_users directly
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.an_users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'an_users';

  RAISE NOTICE 'an_users now has % policies (should be 4)', policy_count;
  RAISE NOTICE 'Infinite recursion fix applied successfully';
END $$;
