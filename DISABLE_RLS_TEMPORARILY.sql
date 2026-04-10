-- ============================================================================
-- EMERGENCY FIX: Disable RLS on an_users table temporarily
-- ============================================================================
-- This will allow admin login to work immediately
-- You can re-enable RLS later after fixing the recursive policies properly
-- ============================================================================

-- Step 1: Disable RLS on an_users table
ALTER TABLE an_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'an_users';

-- ============================================================================
-- After running this:
-- 1. Admin login will work immediately
-- 2. The infinite recursion error will be gone
-- 3. You can re-enable RLS later with proper policies
-- ============================================================================

-- To re-enable RLS later (after fixing policies):
-- ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;
