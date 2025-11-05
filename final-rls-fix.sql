-- ============================================================================
-- FINAL RLS FIX - Complete Reset and Proper Configuration
-- Author: Maurice Rondeau
-- ============================================================================

-- STEP 1: Drop ALL policies on an_users (belt and suspenders)
-- ============================================================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'an_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON an_users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- STEP 2: Completely disable RLS
-- ============================================================================
ALTER TABLE an_users DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'an_users';

-- This should show: rowsecurity = false

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- 1. Check no policies exist
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'an_users';

-- Should return: policy_count = 0

-- 2. Test query as service role (should work)
SELECT id, email, role
FROM an_users
LIMIT 3;

-- Should return: 3 users

-- ============================================================================
-- IF YOU WANT TO RE-ENABLE RLS LATER, USE THIS:
-- ============================================================================
-- UNCOMMENT THE LINES BELOW ONLY AFTER CONFIRMING LOGIN WORKS

/*
-- Enable RLS
ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;

-- Create simple policy: service role can do everything
CREATE POLICY "service_role_all"
ON an_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create simple policy: authenticated users can read own record
-- This uses auth.uid() which does NOT query an_users
CREATE POLICY "authenticated_read_own"
ON an_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT ON an_users TO authenticated;
GRANT ALL ON an_users TO service_role;

-- Verify policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'an_users';
*/
