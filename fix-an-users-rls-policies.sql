-- Fix RLS Policies for an_users Table
-- Author: Maurice Rondeau
--
-- PROBLEM: Infinite recursion in RLS policies
-- SOLUTION: Simplify policies to avoid circular references

-- Step 1: Drop ALL existing policies on an_users
DROP POLICY IF EXISTS "Users can view their own data" ON an_users;
DROP POLICY IF EXISTS "Users can update their own data" ON an_users;
DROP POLICY IF EXISTS "Admins can view all users" ON an_users;
DROP POLICY IF EXISTS "Admins can insert users" ON an_users;
DROP POLICY IF EXISTS "Admins can update all users" ON an_users;
DROP POLICY IF EXISTS "Admins can delete users" ON an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON an_users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON an_users;
DROP POLICY IF EXISTS "Users can read their own data" ON an_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON an_users;

-- Step 2: Disable RLS temporarily to ensure clean slate
ALTER TABLE an_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW, simplified policies without circular references

-- SELECT: Allow authenticated users to read their own record
-- This avoids recursion by directly checking auth.uid() without querying an_users
CREATE POLICY "Users can read own record"
ON an_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT: Only service_role can insert (prevents self-registration issues)
CREATE POLICY "Service role can insert users"
ON an_users
FOR INSERT
TO service_role
WITH CHECK (true);

-- UPDATE: Users can update their own record
CREATE POLICY "Users can update own record"
ON an_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Only service_role can delete
CREATE POLICY "Service role can delete users"
ON an_users
FOR DELETE
TO service_role
USING (true);

-- Step 5: Grant necessary permissions
GRANT SELECT ON an_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON an_users TO service_role;

-- Step 6: Verify policies
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
