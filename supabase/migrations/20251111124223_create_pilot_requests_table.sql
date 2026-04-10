-- Migration: Create pilot_requests table
-- Description: Unified pilot requests table consolidating leave, flight, and bid requests
-- Author: Maurice Rondeau
-- Created: 2025-11-11

-- Create pilot_requests table
CREATE TABLE pilot_requests (
  -- Identity
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid REFERENCES pilots(id) ON DELETE CASCADE,
  pilot_user_id uuid REFERENCES pilot_users(id),
  employee_number text NOT NULL,
  rank text NOT NULL,
  name text NOT NULL,

  -- Request Classification
  request_category text NOT NULL,
  request_type text NOT NULL,

  -- Submission Tracking
  submission_channel text NOT NULL,
  submission_date timestamptz NOT NULL DEFAULT NOW(),
  submitted_by_admin_id uuid,
  source_reference text,
  source_attachment_url text,

  -- Date/Time Details
  start_date date NOT NULL,
  end_date date,
  days_count integer,
  flight_date date,
  roster_period text NOT NULL,
  roster_period_start_date date NOT NULL,
  roster_publish_date date NOT NULL,
  roster_deadline_date date NOT NULL,

  -- Workflow Status
  workflow_status text NOT NULL DEFAULT 'SUBMITTED',
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

  -- Audit
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),

  -- Constraints
  CHECK (request_category IN ('LEAVE', 'FLIGHT', 'LEAVE_BID')),
  CHECK (workflow_status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN')),
  CHECK (submission_channel IN ('PILOT_PORTAL', 'EMAIL', 'PHONE', 'ORACLE', 'ADMIN_PORTAL'))
);

-- Indexes for performance
CREATE INDEX idx_pilot_requests_roster_period ON pilot_requests(roster_period);
CREATE INDEX idx_pilot_requests_status ON pilot_requests(workflow_status);
CREATE INDEX idx_pilot_requests_pilot_id ON pilot_requests(pilot_id);
CREATE INDEX idx_pilot_requests_deadline ON pilot_requests(roster_deadline_date);
CREATE INDEX idx_pilot_requests_dates ON pilot_requests(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE pilot_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins have full access
CREATE POLICY "Admins full access" ON pilot_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

-- Add helpful comment
COMMENT ON TABLE pilot_requests IS 'Unified pilot requests table consolidating leave, flight, and bid requests';
