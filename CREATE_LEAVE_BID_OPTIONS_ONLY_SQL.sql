-- ================================================
-- CREATE LEAVE BID OPTIONS TABLE - SQL ONLY
-- Copy and paste this entire file into Supabase SQL Editor
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

-- Create indexes
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

-- ================================================
-- VERIFICATION - Run this after to confirm success
-- ================================================
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'leave_bid_options';
