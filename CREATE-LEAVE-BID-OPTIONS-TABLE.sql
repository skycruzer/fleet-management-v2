-- ================================================
-- CREATE LEAVE BID OPTIONS TABLE
-- ================================================
-- This table is required by the leave bid system but was missing
-- from the database, causing 500 errors when pilots try to submit leave bids.
--
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run this script
--
-- ================================================

-- Create leave_bid_options table
CREATE TABLE IF NOT EXISTS leave_bid_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES leave_bids(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leave_bid_options_bid_id
  ON leave_bid_options(bid_id);

CREATE INDEX IF NOT EXISTS idx_leave_bid_options_dates
  ON leave_bid_options(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE leave_bid_options ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Pilots can view their own bid options
CREATE POLICY "Pilots can view their own bid options"
  ON leave_bid_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policy: Pilots can insert options for their own bids
CREATE POLICY "Pilots can insert options for their own bids"
  ON leave_bid_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policy: Pilots can update options for pending bids only
CREATE POLICY "Pilots can update options for pending bids"
  ON leave_bid_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
      AND lb.status = 'PENDING'
    )
  );

-- RLS Policy: Pilots can delete options for pending bids only
CREATE POLICY "Pilots can delete options for pending bids"
  ON leave_bid_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
      AND lb.status = 'PENDING'
    )
  );

-- RLS Policy: Admins can do everything
CREATE POLICY "Admins can manage all bid options"
  ON leave_bid_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Add comment to the table
COMMENT ON TABLE leave_bid_options IS 'Leave bid options for annual leave bidding system. Each bid can have 1-5 options ordered by priority.';

-- Add comments to columns
COMMENT ON COLUMN leave_bid_options.bid_id IS 'Foreign key to leave_bids table';
COMMENT ON COLUMN leave_bid_options.priority IS 'Priority ranking from 1 (highest) to 5 (lowest)';
COMMENT ON COLUMN leave_bid_options.start_date IS 'Start date of the leave period';
COMMENT ON COLUMN leave_bid_options.end_date IS 'End date of the leave period';

-- ================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ================================================

-- Check that the table was created
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'leave_bid_options';

-- Check table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leave_bid_options'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'leave_bid_options';

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- The leave_bid_options table is now ready for use.
-- The 500 error should be resolved.
