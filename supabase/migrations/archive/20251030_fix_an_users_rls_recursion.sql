/**
 * Fix RLS Infinite Recursion on an_users Table
 *
 * PROBLEM: Existing policies query an_users FROM within an_users policies,
 *          causing infinite recursion when PostgreSQL tries to evaluate them.
 *
 * SOLUTION: Drop problematic policies and create simpler ones that don't
 *           create circular dependencies.
 *
 * Author: Maurice Rondeau
 * Date: 2025-10-30
 */

-- Drop existing problematic policies on an_users
DROP POLICY IF EXISTS "an_users_delete_policy" ON "public"."an_users";
DROP POLICY IF EXISTS "an_users_insert_policy" ON "public"."an_users";
DROP POLICY IF EXISTS "an_users_update_policy" ON "public"."an_users";
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."an_users";
DROP POLICY IF EXISTS "Authenticated users can view all an_users" ON "public"."an_users";

-- Create new, safe policies for an_users
-- These policies DO NOT query an_users, avoiding infinite recursion

-- 1. Allow users to view their own profile
CREATE POLICY "an_users_select_own"
ON "public"."an_users"
FOR SELECT
TO authenticated
USING ("id" = auth.uid());

-- 2. Allow authenticated users to view all user records (for admin checks in other tables)
-- This is safe because it doesn't query an_users within the policy
CREATE POLICY "an_users_select_all"
ON "public"."an_users"
FOR SELECT
TO authenticated
USING (true);

-- 3. Only service role can insert/update/delete
-- This avoids the recursion problem by not checking roles at all
CREATE POLICY "an_users_insert_service_role_only"
ON "public"."an_users"
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "an_users_update_service_role_only"
ON "public"."an_users"
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "an_users_delete_service_role_only"
ON "public"."an_users"
FOR DELETE
TO service_role
USING (true);

-- ALTERNATIVE: If you need authenticated users to modify an_users,
-- use a SECURITY DEFINER function instead to bypass RLS

-- Create a helper function to check if current user is admin
-- This function uses SECURITY DEFINER to bypass RLS when checking roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM an_users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN user_role = 'admin';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Alternative policies using the SECURITY DEFINER function
-- Uncomment these if you want authenticated admins to have full access

-- CREATE POLICY "an_users_insert_admin"
-- ON "public"."an_users"
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (is_admin());

-- CREATE POLICY "an_users_update_admin"
-- ON "public"."an_users"
-- FOR UPDATE
-- TO authenticated
-- USING (is_admin());

-- CREATE POLICY "an_users_delete_admin"
-- ON "public"."an_users"
-- FOR DELETE
-- TO authenticated
-- USING (is_admin());

-- Verify RLS is still enabled
ALTER TABLE "public"."an_users" ENABLE ROW LEVEL SECURITY;

-- Add comment explaining the fix
COMMENT ON TABLE "public"."an_users" IS
'RLS policies updated 2025-10-30 to fix infinite recursion.
Policies no longer query an_users from within an_users policies.
Use is_admin() SECURITY DEFINER function for role checks instead.';
