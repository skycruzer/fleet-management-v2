-- Fix RLS policy for pilot_users table to allow registration
-- This allows unauthenticated users to insert their own registration
-- Admin approval is still required before they can login

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public registration" ON pilot_users;
DROP POLICY IF EXISTS "Allow registration inserts" ON pilot_users;

-- Create policy to allow INSERT for new registrations
-- Anyone can insert (register), but they can't read others' data
CREATE POLICY "Allow registration inserts"
ON pilot_users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep existing SELECT policy for authenticated users to see their own data
-- (assuming this already exists, if not, we'll need to create it)
-- Users can only read their own pilot_user record
DROP POLICY IF EXISTS "Users can read own data" ON pilot_users;
CREATE POLICY "Users can read own data"
ON pilot_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admin/managers can read all pilot_users
DROP POLICY IF EXISTS "Admins can read all pilot_users" ON pilot_users;
CREATE POLICY "Admins can read all pilot_users"
ON pilot_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'manager'
    )
  )
);

-- Admin/managers can update pilot_users (for approval)
DROP POLICY IF EXISTS "Admins can update pilot_users" ON pilot_users;
CREATE POLICY "Admins can update pilot_users"
ON pilot_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'manager'
    )
  )
);

COMMENT ON POLICY "Allow registration inserts" ON pilot_users IS
'Allows anyone to submit a registration. Admin approval required before user can login.';
