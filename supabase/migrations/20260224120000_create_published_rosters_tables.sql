-- Migration: Create published_rosters, roster_assignments, and activity_codes tables
-- Author: Maurice Rondeau
-- Date: 2026-02-24
-- Description: Supports the Published Rosters feature — upload, parse, and view
--   externally-produced B767 roster PDFs as interactive, searchable grids.
--   Three tables: published_rosters (uploaded files), roster_assignments (parsed
--   per-pilot per-day activity codes), activity_codes (legend/reference).

-- =====================================================
-- Table: activity_codes
-- Purpose: Reference table for roster activity code legend
-- =====================================================

CREATE TABLE activity_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  color text NOT NULL DEFAULT 'bg-yellow-100',
  description text,
  created_at timestamptz DEFAULT NOW(),

  CHECK (category IN (
    'FLIGHT', 'DAY_OFF', 'TRAINING', 'LEAVE', 'RESERVE',
    'TRANSPORT', 'ACCOMMODATION', 'OFFICE', 'MEDICAL', 'OTHER'
  ))
);

ALTER TABLE activity_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read activity codes" ON activity_codes
  FOR SELECT USING (auth.jwt() ->> 'role' = 'authenticated');

CREATE POLICY "Admins can manage activity codes" ON activity_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

COMMENT ON TABLE activity_codes IS 'Reference table for roster activity codes with categories and colors';

-- Seed known activity codes from existing B767 rosters
INSERT INTO activity_codes (code, name, category, color) VALUES
  -- Flights
  ('001', 'Flight 001', 'FLIGHT', 'bg-blue-100'),
  ('002', 'Flight 002', 'FLIGHT', 'bg-blue-100'),
  ('003/004', 'Flight 003/004', 'FLIGHT', 'bg-blue-100'),
  ('008', 'Flight 008', 'FLIGHT', 'bg-blue-100'),
  ('019', 'Flight 019', 'FLIGHT', 'bg-blue-100'),
  ('392', 'Flight 392', 'FLIGHT', 'bg-blue-100'),
  ('393', 'Flight 393', 'FLIGHT', 'bg-blue-100'),
  ('PX008', 'Passenger Flight 008', 'FLIGHT', 'bg-blue-100'),
  ('PX019', 'Passenger Flight 019', 'FLIGHT', 'bg-blue-100'),
  -- Day Off
  ('DO', 'Day Off', 'DAY_OFF', 'bg-gray-100'),
  ('RDO', 'Rostered Day Off', 'DAY_OFF', 'bg-gray-100'),
  ('SDO', 'Special Day Off', 'DAY_OFF', 'bg-gray-100'),
  -- Training
  ('SIM', 'Simulator', 'TRAINING', 'bg-green-100'),
  ('CRM', 'Crew Resource Management', 'TRAINING', 'bg-green-100'),
  ('B7_EP', 'B767 Emergency Procedures', 'TRAINING', 'bg-green-100'),
  ('PERFM', 'Performance Training', 'TRAINING', 'bg-green-100'),
  -- Leave
  ('A_L', 'Annual Leave', 'LEAVE', 'bg-amber-100'),
  ('LSL', 'Long Service Leave', 'LEAVE', 'bg-amber-100'),
  -- Reserve
  ('R0400', 'Reserve 0400', 'RESERVE', 'bg-purple-100'),
  ('R0600', 'Reserve 0600', 'RESERVE', 'bg-purple-100'),
  ('R1200', 'Reserve 1200', 'RESERVE', 'bg-purple-100'),
  ('RSL', 'Reserve Standby', 'RESERVE', 'bg-purple-100'),
  -- Transport
  ('CAR', 'Car Transport', 'TRANSPORT', 'bg-slate-200'),
  ('DH008', 'Deadhead Flight 008', 'TRANSPORT', 'bg-slate-200'),
  ('DH019', 'Deadhead Flight 019', 'TRANSPORT', 'bg-slate-200'),
  -- Accommodation
  ('HOTAC', 'Hotel Accommodation', 'ACCOMMODATION', 'bg-teal-100'),
  ('STOPOVER', 'Stopover', 'ACCOMMODATION', 'bg-teal-100'),
  -- Office
  ('OFC_P2', 'Office Phase 2', 'OFFICE', 'bg-indigo-100'),
  -- Medical
  ('DO_MEDF', 'Day Off - Medical Final', 'MEDICAL', 'bg-red-100'),
  ('DO_MEDI', 'Day Off - Medical Initial', 'MEDICAL', 'bg-red-100'),
  ('DO_MEDX', 'Day Off - Medical Extension', 'MEDICAL', 'bg-red-100'),
  -- Other
  ('SPD', 'Special Duty', 'OTHER', 'bg-yellow-100'),
  ('3/4', 'Flight 3/4', 'FLIGHT', 'bg-blue-100')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Table: published_rosters
-- Purpose: Stores uploaded roster PDFs and their parse metadata
-- =====================================================

CREATE TABLE published_rosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_period_code text UNIQUE NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT NOW(),
  parsed boolean DEFAULT false,
  parsed_at timestamptz,
  captain_count integer DEFAULT 0,
  fo_count integer DEFAULT 0,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX idx_published_rosters_period ON published_rosters(roster_period_code);
CREATE INDEX idx_published_rosters_year ON published_rosters(period_start_date);

ALTER TABLE published_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access published rosters" ON published_rosters
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

COMMENT ON TABLE published_rosters IS 'Uploaded B767 roster PDFs with parse metadata, one per roster period';

-- =====================================================
-- Table: roster_assignments
-- Purpose: Parsed per-pilot per-day activity codes from roster PDFs
-- =====================================================

CREATE TABLE roster_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  published_roster_id uuid NOT NULL REFERENCES published_rosters(id) ON DELETE CASCADE,
  roster_period_code text NOT NULL,
  pilot_id uuid REFERENCES pilots(id) ON DELETE SET NULL,
  pilot_name text NOT NULL,
  pilot_last_name text NOT NULL,
  pilot_first_name text NOT NULL,
  rank text NOT NULL,
  day_number integer NOT NULL,
  date date NOT NULL,
  activity_code text NOT NULL,
  created_at timestamptz DEFAULT NOW(),

  CHECK (rank IN ('CAPTAIN', 'FIRST_OFFICER')),
  CHECK (day_number >= 1 AND day_number <= 28)
);

CREATE INDEX idx_roster_assignments_roster ON roster_assignments(published_roster_id);
CREATE INDEX idx_roster_assignments_pilot ON roster_assignments(pilot_id);
CREATE INDEX idx_roster_assignments_period_rank_day ON roster_assignments(roster_period_code, rank, day_number);
CREATE INDEX idx_roster_assignments_activity ON roster_assignments(activity_code);

ALTER TABLE roster_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access roster assignments" ON roster_assignments
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

COMMENT ON TABLE roster_assignments IS 'Parsed roster assignments: one row per pilot per day with activity code';
