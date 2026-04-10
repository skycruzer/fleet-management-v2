-- Migration: Create rdo_sdo_requests Table
-- Description: Dedicated table for RDO (Rostered Day Off) and SDO (Scheduled Day Off) requests
-- Author: Maurice Rondeau
-- Created: 2025-01-19
-- Part of 3-table request architecture (rdo_sdo_requests, leave_requests, leave_bids)

-- ============================================
-- 1. Create rdo_sdo_requests table
-- ============================================

CREATE TABLE rdo_sdo_requests (
  -- Identity
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  pilot_user_id uuid REFERENCES pilot_users(id),
  employee_number text NOT NULL,
  rank text NOT NULL CHECK (rank IN ('Captain', 'First Officer')),
  name text NOT NULL,

  -- Request Type (RDO or SDO only)
  request_type text NOT NULL CHECK (request_type IN ('RDO', 'SDO')),

  -- Submission Tracking
  submission_channel text NOT NULL CHECK (submission_channel IN ('PILOT_PORTAL', 'EMAIL', 'PHONE', 'ORACLE', 'ADMIN_PORTAL')),
  submission_date timestamptz NOT NULL DEFAULT NOW(),
  submitted_by_admin_id uuid,
  source_reference text,
  source_attachment_url text,

  -- Date/Time Details
  start_date date NOT NULL,
  end_date date,
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
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX idx_rdo_sdo_requests_pilot_id ON rdo_sdo_requests(pilot_id);
CREATE INDEX idx_rdo_sdo_requests_status ON rdo_sdo_requests(workflow_status);
CREATE INDEX idx_rdo_sdo_requests_roster_period ON rdo_sdo_requests(roster_period);
CREATE INDEX idx_rdo_sdo_requests_dates ON rdo_sdo_requests(start_date, end_date);
CREATE INDEX idx_rdo_sdo_requests_deadline ON rdo_sdo_requests(roster_deadline_date);
CREATE INDEX idx_rdo_sdo_requests_submission_date ON rdo_sdo_requests(submission_date);

-- Unique constraint: Prevent duplicate requests
CREATE UNIQUE INDEX idx_rdo_sdo_requests_unique
ON rdo_sdo_requests(pilot_id, request_type, start_date, COALESCE(end_date, start_date))
WHERE workflow_status NOT IN ('DENIED', 'WITHDRAWN');

-- ============================================
-- 3. Enable Row Level Security
-- ============================================

ALTER TABLE rdo_sdo_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Pilots can view their own requests
CREATE POLICY "Pilots view own RDO/SDO requests"
  ON rdo_sdo_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = rdo_sdo_requests.pilot_id
    )
  );

-- Policy: Pilots can insert their own requests
CREATE POLICY "Pilots create own RDO/SDO requests"
  ON rdo_sdo_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = rdo_sdo_requests.pilot_id
    )
  );

-- Policy: Pilots can update their SUBMITTED requests only
CREATE POLICY "Pilots update own SUBMITTED RDO/SDO requests"
  ON rdo_sdo_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = rdo_sdo_requests.pilot_id
    )
    AND workflow_status = 'SUBMITTED'
  );

-- Policy: Pilots can cancel (WITHDRAWN) their APPROVED requests
CREATE POLICY "Pilots cancel own RDO/SDO requests"
  ON rdo_sdo_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM pilot_users WHERE pilot_id = rdo_sdo_requests.pilot_id
    )
    AND workflow_status IN ('SUBMITTED', 'IN_REVIEW', 'APPROVED')
  )
  WITH CHECK (
    workflow_status = 'WITHDRAWN'
  );

-- Policy: Admins have full access
CREATE POLICY "Admins full access to RDO/SDO requests"
  ON rdo_sdo_requests
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

CREATE OR REPLACE FUNCTION update_rdo_sdo_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rdo_sdo_requests_updated_at
BEFORE UPDATE ON rdo_sdo_requests
FOR EACH ROW
EXECUTE FUNCTION update_rdo_sdo_requests_updated_at();

-- ============================================
-- 5. Create validation trigger
-- ============================================

CREATE OR REPLACE FUNCTION validate_rdo_sdo_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate end_date >= start_date
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date cannot be before start_date';
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

CREATE TRIGGER trg_validate_rdo_sdo_request
BEFORE INSERT OR UPDATE ON rdo_sdo_requests
FOR EACH ROW
EXECUTE FUNCTION validate_rdo_sdo_request();

-- ============================================
-- 6. Add helpful comments
-- ============================================

COMMENT ON TABLE rdo_sdo_requests IS
'RDO (Rostered Day Off) and SDO (Scheduled Day Off) requests. Separate from leave requests and flight requests.';

COMMENT ON COLUMN rdo_sdo_requests.request_type IS
'Request type: RDO (Rostered Day Off) or SDO (Scheduled Day Off)';

COMMENT ON COLUMN rdo_sdo_requests.workflow_status IS
'Workflow status: SUBMITTED (default), IN_REVIEW, APPROVED, DENIED, WITHDRAWN (cancelled)';

COMMENT ON COLUMN rdo_sdo_requests.submission_channel IS
'How the request was submitted: PILOT_PORTAL (default), EMAIL, PHONE, ORACLE, ADMIN_PORTAL';

-- ============================================
-- 7. Create materialized view for stats
-- ============================================

CREATE MATERIALIZED VIEW rdo_sdo_requests_stats AS
SELECT
  workflow_status,
  request_type,
  COUNT(*) as count,
  COUNT(DISTINCT pilot_id) as unique_pilots
FROM rdo_sdo_requests
GROUP BY workflow_status, request_type;

CREATE UNIQUE INDEX idx_rdo_sdo_stats_unique ON rdo_sdo_requests_stats(workflow_status, request_type);

-- Refresh function (call after bulk updates)
CREATE OR REPLACE FUNCTION refresh_rdo_sdo_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY rdo_sdo_requests_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Grant permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE ON rdo_sdo_requests TO authenticated;
GRANT SELECT ON rdo_sdo_requests_stats TO authenticated;
