-- Fix unique constraint on leave_requests
-- The constraint name already exists but might be just an index
-- Drop existing and recreate properly

-- Drop if exists (might be index)
DROP INDEX IF EXISTS leave_requests_pilot_dates_unique CASCADE;

-- Create UNIQUE INDEX (functions as constraint)
CREATE UNIQUE INDEX IF NOT EXISTS leave_requests_pilot_dates_uniq_idx
ON leave_requests(pilot_id, start_date, end_date);

-- Also create regular index for query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_dates
ON leave_requests(pilot_id, start_date, end_date);

-- Add comment
COMMENT ON INDEX leave_requests_pilot_dates_uniq_idx IS
'Ensures no duplicate leave requests for the same pilot and date range';
