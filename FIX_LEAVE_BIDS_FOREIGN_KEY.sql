-- ============================================================================
-- FIX LEAVE_BIDS FOREIGN KEY RELATIONSHIP
-- ============================================================================
-- Date: October 28, 2025
-- Issue: PostgREST cannot find FK relationship between leave_bids and leave_bid_options
-- Error: PGRST200 - No foreign key relationship found
-- ============================================================================

-- STEP 1: Check if tables exist
-- ============================================================================
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('leave_bids', 'leave_bid_options')
ORDER BY table_name;

-- Expected: Both tables should exist
-- ============================================================================

-- STEP 2: Check current schema of both tables
-- ============================================================================

-- Check leave_bids columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leave_bids'
ORDER BY ordinal_position;

-- Check leave_bid_options columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leave_bid_options'
ORDER BY ordinal_position;

-- ============================================================================
-- Expected: leave_bid_options should have a column like:
-- - leave_bid_id (UUID, NOT NULL, references leave_bids.id)
-- or
-- - bid_id (UUID, NOT NULL, references leave_bids.id)
-- ============================================================================

-- STEP 3: Check existing foreign keys
-- ============================================================================
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
  AND (tc.table_name='leave_bids' OR tc.table_name='leave_bid_options');

-- ============================================================================
-- If no foreign key exists from leave_bid_options -> leave_bids,
-- we need to create it
-- ============================================================================

-- STEP 4: Check if leave_bid_id column exists in leave_bid_options
-- ============================================================================
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'leave_bid_options'
    AND column_name = 'leave_bid_id'
) as leave_bid_id_exists;

-- If FALSE, we need to add the column

-- STEP 5: Check for existing data
-- ============================================================================
SELECT COUNT(*) as total_bids FROM leave_bids;
SELECT COUNT(*) as total_options FROM leave_bid_options;

-- ============================================================================
-- FIX IMPLEMENTATION
-- ============================================================================

-- OPTION A: If leave_bid_id column doesn't exist, add it
-- ============================================================================
-- WARNING: Only run this if STEP 4 showed leave_bid_id_exists = FALSE
-- ============================================================================

-- Add leave_bid_id column to leave_bid_options
-- ALTER TABLE leave_bid_options
-- ADD COLUMN leave_bid_id UUID REFERENCES leave_bids(id) ON DELETE CASCADE;

-- If there's existing data, you may need to populate it first
-- This is a placeholder - actual data migration would need custom logic
-- UPDATE leave_bid_options SET leave_bid_id = ...

-- ============================================================================

-- OPTION B: If leave_bid_id exists but FK constraint is missing
-- ============================================================================

-- Create the foreign key constraint
-- ALTER TABLE leave_bid_options
-- ADD CONSTRAINT fk_leave_bid_options_leave_bid
-- FOREIGN KEY (leave_bid_id)
-- REFERENCES leave_bids(id)
-- ON DELETE CASCADE;

-- ============================================================================

-- OPTION C: If using different column name (e.g., 'bid_id')
-- ============================================================================

-- Rename column if needed
-- ALTER TABLE leave_bid_options
-- RENAME COLUMN bid_id TO leave_bid_id;

-- Then add FK constraint as in OPTION B

-- ============================================================================

-- STEP 6: Verify the fix
-- ============================================================================

-- After running the appropriate fix above, verify:

-- 1. Check FK exists
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'leave_bid_options'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Test the relationship with a sample query
-- This should work without errors after the fix:
SELECT
  lb.id,
  lb.roster_period_code,
  lb.status,
  lbo.priority,
  lbo.start_date,
  lbo.end_date
FROM leave_bids lb
LEFT JOIN leave_bid_options lbo ON lb.id = lbo.leave_bid_id
LIMIT 5;

-- ============================================================================
-- INSTRUCTIONS FOR RUNNING THIS FILE
-- ============================================================================
-- 1. Copy this entire file
-- 2. Go to Supabase SQL Editor: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
-- 3. Paste and run STEPS 1-5 to diagnose the issue
-- 4. Based on results, uncomment and run the appropriate OPTION (A, B, or C)
-- 5. Run STEP 6 to verify the fix
-- 6. Report back the results
-- ============================================================================

-- ============================================================================
-- EXPECTED FINAL SCHEMA
-- ============================================================================
-- Table: leave_bids
-- Columns:
--   - id (UUID, PRIMARY KEY)
--   - pilot_id (UUID, FK to pilots.id)
--   - roster_period_code (TEXT)
--   - status (TEXT - 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED')
--   - created_at (TIMESTAMP)
--   - updated_at (TIMESTAMP)

-- Table: leave_bid_options
-- Columns:
--   - id (UUID, PRIMARY KEY)
--   - leave_bid_id (UUID, FK to leave_bids.id) <-- THIS IS CRITICAL
--   - priority (INTEGER - 1 to 10)
--   - start_date (DATE)
--   - end_date (DATE)
--   - created_at (TIMESTAMP)
-- ============================================================================
