-- Migration: Create roster_periods and roster_reports tables
-- Author: Maurice Rondeau
-- Description: Creates tables for roster period management and report generation tracking

-- =====================================================
-- Table: roster_periods
-- Purpose: Roster period definitions with calculated deadline dates
-- =====================================================

CREATE TABLE roster_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  period_number integer NOT NULL,
  year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  publish_date date NOT NULL,
  request_deadline_date date NOT NULL,
  status text DEFAULT 'OPEN',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),

  CHECK (status IN ('OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED')),
  UNIQUE(period_number, year)
);

-- Indexes for roster_periods
CREATE INDEX idx_roster_periods_deadline ON roster_periods(request_deadline_date);
CREATE INDEX idx_roster_periods_year ON roster_periods(year);
CREATE INDEX idx_roster_periods_code ON roster_periods(code);

-- Enable Row Level Security
ALTER TABLE roster_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins have full access
CREATE POLICY "Admins full access roster periods" ON roster_periods
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

-- Table comment
COMMENT ON TABLE roster_periods IS 'Roster period definitions with calculated deadline dates';

-- =====================================================
-- Table: roster_reports
-- Purpose: Audit trail of generated roster reports
-- =====================================================

CREATE TABLE roster_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_period_code text NOT NULL REFERENCES roster_periods(code),
  generated_at timestamptz DEFAULT NOW(),
  generated_by uuid,
  report_type text NOT NULL,
  approved_count integer DEFAULT 0,
  pending_count integer DEFAULT 0,
  denied_count integer DEFAULT 0,
  withdrawn_count integer DEFAULT 0,
  min_crew_captains integer,
  min_crew_fos integer,
  min_crew_date date,
  pdf_url text,
  email_recipients text[],
  sent_at timestamptz,

  CHECK (report_type IN ('PREVIEW', 'FINAL'))
);

-- Indexes for roster_reports
CREATE INDEX idx_roster_reports_period ON roster_reports(roster_period_code);
CREATE INDEX idx_roster_reports_sent ON roster_reports(sent_at);

-- Enable Row Level Security
ALTER TABLE roster_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins have full access
CREATE POLICY "Admins full access roster reports" ON roster_reports
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

-- Table comment
COMMENT ON TABLE roster_reports IS 'Audit trail of generated roster reports';
