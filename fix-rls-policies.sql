-- Fix infinite recursion in an_users RLS policies
-- Run this in Supabase SQL Editor

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON an_users;
DROP POLICY IF EXISTS "Users can update own data" ON an_users;
DROP POLICY IF EXISTS "Admins can read all users" ON an_users;
DROP POLICY IF EXISTS "Admins can update all users" ON an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON an_users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own data"
ON an_users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON an_users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admin policies without recursion
CREATE POLICY "Service role has full access"
ON an_users FOR ALL
TO service_role
USING (true);
