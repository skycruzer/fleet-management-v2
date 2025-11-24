-- Add unique constraint to prevent duplicate leave requests
-- Migration: Add unique constraint on leave_requests (pilot_id, start_date, end_date)
-- Date: 2025-11-19
-- Author: Maurice Rondeau

-- Add unique constraint to ensure no duplicate leave requests for same pilot and dates
ALTER TABLE leave_requests
ADD CONSTRAINT leave_requests_pilot_dates_unique
UNIQUE (pilot_id, start_date, end_date);

-- Add index to improve query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_dates
ON leave_requests(pilot_id, start_date, end_date);

-- Add comment
COMMENT ON CONSTRAINT leave_requests_pilot_dates_unique ON leave_requests IS
'Ensures no duplicate leave requests for the same pilot and date range';
