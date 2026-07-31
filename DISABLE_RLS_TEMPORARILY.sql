-- ============================================================================
-- ⚠  DANGER: THIS SCRIPT DISABLES ROW LEVEL SECURITY. DO NOT RUN AS-IS.  ⚠
-- ============================================================================
-- Kept for historical reference only. Running it against production would
-- re-open the exposure closed by supabase/migrations/20260731090000 and
-- 20260731090100: credential and PII tables (pilot_users holds bcrypt
-- password_hash; an_users likewise) becoming readable with the public anon key
-- that ships in every browser bundle.
--
-- `fix-all-rls-policies.sql` disabling RLS on pilot_users is the most plausible
-- origin of that exposure in the first place.
--
-- supabase/migrations/ is the single source of truth for schema and RLS. Add a
-- migration instead of pasting any of these into the SQL editor.
-- ============================================================================

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
