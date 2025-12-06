-- Migration: Recreate leave_requests Table
-- Description: Dedicated table for leave requests (ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
-- Author: Maurice Rondeau
-- Created: 2025-01-19
-- Part of 3-table request architecture (rdo_sdo_requests, leave_requests, leave_bids)

-- ============================================
-- 1. Drop deprecated leave_requests table and recreate
-- ============================================

-- Remove old RLS policies
DROP POLICY IF EXISTS "Allow read access to leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Prevent inserts to deprecated leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Prevent updates to deprecated leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Prevent deletes from deprecated leave_requests" ON leave_requests;

-- Drop old table (data will be migrated from pilot_requests)
DROP TABLE IF EXISTS leave_requests CASCADE;

-- Recreate leave_requests table
CREATE TABLE leave_requests (
  -- Identity
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  pilot_user_id uuid REFERENCES pilot_users(id),
  employee_number text NOT NULL,
  rank text NOT NULL CHECK (rank IN ('Captain', 'First Officer')),
  name text NOT NULL,

  -- Request Type (Leave types only)
  request_type text NOT NULL CHECK (
    request_type IN ('ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE')
  ),

  -- Submission Tracking
  submission_channel text NOT NULL CHECK (submission_channel IN ('PILOT_PORTAL', 'EMAIL', 'PHONE', 'ORACLE', 'ADMIN_PORTAL')),
  submission_date timestamptz NOT NULL DEFAULT NOW(),
  submitted_by_admin_id uuid,
  source_reference text,
  source_attachment_url text,

  -- Date/Time Details
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count integer,

  -- Roster Period Integration
  roster_period text NOT NULL,
  roster_period_start_date date NOT NULL,
  roster_publish_date date NOT NULL,
  roster_deadline_date date NOT NULL,

  -- Workflow Status
  workflow_status text NOT NULL DEFAULT 'SUBMITTED'
    CHECK (workflow_status IN ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_comments text,

  -- Conflict Detection
  conflict_flags jsonb DEFAULT '[]'::jsonb,
  availability_impact jsonb,

  -- Metadata
  is_late_request boolean DEFAULT false,
  is_past_deadline boolean DEFAULT false,
  priority_score integer DEFAULT 0,
  reason text,
  notes text,

  -- Audit Trail
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (end_date >= start_date)
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX idx_leave_requests_pilot_id ON leave_requests(pilot_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(workflow_status);
CREATE INDEX idx_leave_requests_roster_period ON leave_requests(roster_period);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_deadline ON leave_requests(roster_deadline_date);
CREATE INDEX idx_leave_requests_submission_date ON leave_requests(submission_date);
CREATE INDEX idx_leave_requests_type ON leave_requests(request_type);

-- Unique constraint: Prevent duplicate leave requests
CREATE UNIQUE INDEX idx_leave_requests_unique
ON leave_requests(pilot_id, request_type, start_date, end_date)
WHERE workflow_status NOT IN ('DENIED', 'WITHDRAWN');

-- ============================================
-- 3. Enable Row Level Security
-- ============================================

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Pilots can view their own requests
CREATE POLICY "Pilots view own leave requests"
  ON leave_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = leave_requests.pilot_id
    )
  );

-- Policy: Pilots can insert their own requests
CREATE POLICY "Pilots create own leave requests"
  ON leave_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = leave_requests.pilot_id
    )
  );

-- Policy: Pilots can update their SUBMITTED requests only
CREATE POLICY "Pilots update own SUBMITTED leave requests"
  ON leave_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = leave_requests.pilot_id
    )
    AND workflow_status = 'SUBMITTED'
  );

-- Policy: Pilots can cancel (WITHDRAWN) their APPROVED requests
CREATE POLICY "Pilots cancel own leave requests"
  ON leave_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = leave_requests.pilot_id
    )
    AND workflow_status IN ('SUBMITTED', 'IN_REVIEW', 'APPROVED')
  )
  WITH CHECK (
    workflow_status = 'WITHDRAWN'
  );

-- Policy: Admins have full access
CREATE POLICY "Admins full access to leave requests"
  ON leave_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()::text
      AND an_users.role IN ('Admin', 'Manager')
    )
  );

-- ============================================
-- 4. Create updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leave_requests_updated_at
BEFORE UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_leave_requests_updated_at();

-- ============================================
-- 5. Create validation trigger
-- ============================================

CREATE OR REPLACE FUNCTION validate_leave_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate end_date >= start_date
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date cannot be before start_date';
  END IF;

  -- Auto-calculate days_count if not provided
  IF NEW.days_count IS NULL THEN
    NEW.days_count = (NEW.end_date - NEW.start_date) + 1;
  END IF;

  -- Prevent edits to APPROVED/DENIED requests (except cancellation)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.workflow_status IN ('APPROVED', 'DENIED') AND NEW.workflow_status NOT IN ('WITHDRAWN', OLD.workflow_status) THEN
      RAISE EXCEPTION 'Cannot modify approved or denied requests. Cancel and resubmit instead.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_leave_request
BEFORE INSERT OR UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION validate_leave_request();

-- ============================================
-- 6. Add helpful comments
-- ============================================

COMMENT ON TABLE leave_requests IS
'Leave requests: ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE. Separate from RDO/SDO and flight requests.';

COMMENT ON COLUMN leave_requests.request_type IS
'Leave type: ANNUAL (annual leave), SICK (sick leave), LSL (long service leave), LWOP (leave without pay), MATERNITY (maternity leave), COMPASSIONATE (compassionate leave)';

COMMENT ON COLUMN leave_requests.workflow_status IS
'Workflow status: SUBMITTED (default), IN_REVIEW, APPROVED, DENIED, WITHDRAWN (cancelled)';

COMMENT ON COLUMN leave_requests.days_count IS
'Number of days requested (auto-calculated from start_date and end_date)';

-- ============================================
-- 7. Create materialized view for stats
-- ============================================

CREATE MATERIALIZED VIEW leave_requests_stats AS
SELECT
  workflow_status,
  request_type,
  COUNT(*) as count,
  SUM(days_count) as total_days,
  COUNT(DISTINCT pilot_id) as unique_pilots
FROM leave_requests
GROUP BY workflow_status, request_type;

CREATE UNIQUE INDEX idx_leave_stats_unique ON leave_requests_stats(workflow_status, request_type);

-- Refresh function (call after bulk updates)
CREATE OR REPLACE FUNCTION refresh_leave_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leave_requests_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Grant permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE ON leave_requests TO authenticated;
GRANT SELECT ON leave_requests_stats TO authenticated;
