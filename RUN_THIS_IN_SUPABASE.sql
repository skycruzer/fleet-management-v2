-- ============================================================================
-- FIX ADMIN LOGIN: Remove RLS Infinite Recursion on an_users Table
-- ============================================================================
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new
--
-- After running this, admin login will work with: skycruzer@icloud.com
-- ============================================================================

-- Step 1: Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON an_users;
DROP POLICY IF EXISTS "Users can update own data" ON an_users;
DROP POLICY IF EXISTS "Admins can read all users" ON an_users;
DROP POLICY IF EXISTS "Admins can update all users" ON an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON an_users;

-- Step 2: Create simple, non-recursive policies
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON an_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON an_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role full access"
  ON an_users
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- Done! Test admin login at: http://localhost:3000/auth/login
-- Credentials: skycruzer@icloud.com / mron2393
-- ============================================================================
