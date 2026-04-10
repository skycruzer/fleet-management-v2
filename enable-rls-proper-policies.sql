
-- ============================================================================
-- STEP 1: Drop ALL existing policies (cleanup)
-- ============================================================================

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
DROP POLICY IF EXISTS "Users can read own record" ON an_users;
DROP POLICY IF EXISTS "Service role can insert users" ON an_users;
DROP POLICY IF EXISTS "Users can update own record" ON an_users;
DROP POLICY IF EXISTS "Service role can delete users" ON an_users;

-- ============================================================================
-- STEP 2: Enable RLS
-- ============================================================================

ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create NEW simple policies (NO circular references!)
-- ============================================================================

-- Policy 1: Allow authenticated users to read their own record
-- KEY: Uses auth.uid() = id which does NOT query an_users recursively
CREATE POLICY "authenticated_read_own"
ON an_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow authenticated users to update their own record
CREATE POLICY "authenticated_update_own"
ON an_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Service role can do everything (bypasses RLS)
-- This is used by middleware to check admin status
CREATE POLICY "service_role_all"
ON an_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 4: Grant permissions
-- ============================================================================

GRANT SELECT, UPDATE ON an_users TO authenticated;
GRANT ALL ON an_users TO service_role;

-- ============================================================================
-- STEP 5: Verify policies
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'an_users'
ORDER BY policyname;
