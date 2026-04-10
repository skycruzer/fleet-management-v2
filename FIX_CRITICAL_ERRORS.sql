-- ============================================================================
-- CRITICAL ERRORS FIX - Run this in Supabase SQL Editor
-- ============================================================================
-- Date: October 28, 2025
-- Issues: RLS recursion + leave_bids foreign key relationship
-- ============================================================================

-- 1. DISABLE RLS ON AN_USERS (RECURSION ERROR IS BACK)
-- This error appeared again - RLS must have been re-enabled
ALTER TABLE an_users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'an_users';

-- ============================================================================
-- Expected Result: rowsecurity should be FALSE
-- ============================================================================

-- 2. CHECK LEAVE_BIDS FOREIGN KEY RELATIONSHIP
-- The error indicates no relationship between leave_bids and leave_bid_options
-- Let's verify if the foreign key exists

SELECT
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column,
    tc.constraint_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='leave_bids';

-- ============================================================================
-- If no results, we need to create the foreign key relationship
-- This will be done in a separate migration file
-- ============================================================================
