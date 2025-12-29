-- Migration: FORCE Fix an_users RLS - Drop ALL policies dynamically
-- Date: 2025-12-29
-- Author: Maurice Rondeau
--
-- PROBLEM: Previous migration didn't drop all policies because names didn't match.
--          Still getting infinite recursion error (42P17).
--
-- SOLUTION: Use dynamic SQL to drop ALL policies on an_users, then recreate minimal ones.

-- ============================================================================
-- STEP 1: Dynamically drop ALL existing policies on an_users
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Loop through all policies on an_users and drop them
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'an_users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.an_users', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Verify all policies are dropped
-- ============================================================================

DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM pg_policies
  WHERE tablename = 'an_users' AND schemaname = 'public';

  IF remaining_count > 0 THEN
    RAISE EXCEPTION 'Failed to drop all policies. % remaining.', remaining_count;
  END IF;

  RAISE NOTICE 'All policies on an_users successfully dropped';
END $$;

-- ============================================================================
-- STEP 3: Create ONLY simple, non-recursive policies
-- ============================================================================

-- ANON role: Allow reading for session validation (proxy.ts uses anon client)
-- This is the critical one for login to work!
CREATE POLICY "an_users_anon_select_v2"
  ON public.an_users
  FOR SELECT
  TO anon
  USING (true);

-- AUTHENTICATED role: Users can read their own profile only
-- Simple comparison, no subquery to an_users
CREATE POLICY "an_users_auth_select_own_v2"
  ON public.an_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- AUTHENTICATED role: Users can update their own profile
CREATE POLICY "an_users_auth_update_own_v2"
  ON public.an_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- SERVICE_ROLE: Full access (for admin operations via service role client)
CREATE POLICY "an_users_service_full_v2"
  ON public.an_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 4: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE public.an_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Final verification
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  policy_names TEXT;
BEGIN
  SELECT COUNT(*), string_agg(policyname, ', ')
  INTO policy_count, policy_names
  FROM pg_policies
  WHERE tablename = 'an_users' AND schemaname = 'public';

  RAISE NOTICE 'an_users now has % policies: %', policy_count, policy_names;

  IF policy_count != 4 THEN
    RAISE WARNING 'Expected 4 policies, got %. This may indicate an issue.', policy_count;
  ELSE
    RAISE NOTICE 'SUCCESS: an_users RLS policies fixed!';
  END IF;
END $$;
