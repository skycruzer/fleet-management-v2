-- Drop Legacy Request Tables
-- Migration: Phase 2.3 of Unified Request System Overhaul
-- Author: Maurice Rondeau
-- Date: 2025-11-18

-- SAFETY CHECKS COMPLETED:
-- ✅ leave_requests: 29 records backed up
-- ✅ flight_requests: 5 records backed up
-- ✅ pilot_requests (LEAVE): 31 records verified
-- ✅ pilot_requests (FLIGHT): 8 records verified

-- Drop tables (CASCADE to remove dependent policies/indexes)
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS flight_requests CASCADE;

-- Verify tables are dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('leave_requests', 'flight_requests')
  ) THEN
    RAISE EXCEPTION 'Tables still exist after DROP command';
  ELSE
    RAISE NOTICE 'SUCCESS - Legacy tables dropped successfully';
  END IF;
END $$;

-- Add comment to pilot_requests table
COMMENT ON TABLE pilot_requests IS
'Unified request table for all pilot requests (leave, flight, leave bids).
Replaces deprecated leave_requests and flight_requests tables.
Migration completed: 2025-11-18';
