-- Fix infinite recursion in an_users RLS policies
-- Maurice Rondeau - Admin Login Fix

BEGIN;

-- Drop all existing RLS policies on an_users
DROP POLICY IF EXISTS "an_users select policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users insert policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users update policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users delete policy" ON public.an_users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.an_users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.an_users;

-- Create simple, non-recursive RLS policies

-- SELECT: Authenticated users can see all users
CREATE POLICY "an_users_select_policy"
ON public.an_users
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Only service role can insert
CREATE POLICY "an_users_insert_policy"
ON public.an_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own record
CREATE POLICY "an_users_update_policy"
ON public.an_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Only service role can delete (no policy = service_role only)

-- Ensure RLS is enabled
ALTER TABLE public.an_users ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'an_users'
ORDER BY policyname;
