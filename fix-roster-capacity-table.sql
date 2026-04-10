-- ============================================
-- FIX ROSTER PERIOD CAPACITY TABLE
-- Author: Maurice Rondeau
-- Date: November 9, 2025
-- ============================================

-- Step 1: Drop the existing table if it has wrong structure
DROP TABLE IF EXISTS roster_period_capacity CASCADE;

-- Step 2: Create the correct table structure
CREATE TABLE roster_period_capacity (
  roster_period TEXT PRIMARY KEY,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  medical_capacity INTEGER DEFAULT 4,
  flight_capacity INTEGER DEFAULT 4,
  simulator_capacity INTEGER DEFAULT 6,
  ground_capacity INTEGER DEFAULT 8,
  notes TEXT
);

-- Step 3: Insert roster periods for 2025-2026
INSERT INTO roster_period_capacity (roster_period, period_start_date, period_end_date)
VALUES
  ('RP01/2025', '2025-02-01', '2025-02-28'),
  ('RP02/2025', '2025-03-01', '2025-03-28'),
  ('RP03/2025', '2025-03-29', '2025-04-25'),
  ('RP04/2025', '2025-04-26', '2025-05-23'),
  ('RP05/2025', '2025-05-24', '2025-06-20'),
  ('RP06/2025', '2025-06-21', '2025-07-18'),
  ('RP07/2025', '2025-07-19', '2025-08-15'),
  ('RP08/2025', '2025-08-16', '2025-09-12'),
  ('RP09/2025', '2025-09-13', '2025-10-10'),
  ('RP10/2025', '2025-10-11', '2025-11-07'),
  ('RP11/2025', '2025-11-08', '2025-12-05'),
  ('RP12/2025', '2025-12-06', '2026-01-02'),
  ('RP13/2025', '2026-01-03', '2026-01-30'),
  ('RP01/2026', '2026-01-31', '2026-02-27'),
  ('RP02/2026', '2026-02-28', '2026-03-27'),
  ('RP03/2026', '2026-03-28', '2026-04-24'),
  ('RP04/2026', '2026-04-25', '2026-05-22'),
  ('RP05/2026', '2026-05-23', '2026-06-19'),
  ('RP06/2026', '2026-06-20', '2026-07-17'),
  ('RP07/2026', '2026-07-18', '2026-08-14'),
  ('RP08/2026', '2026-08-15', '2026-09-11'),
  ('RP09/2026', '2026-09-12', '2026-10-09'),
  ('RP10/2026', '2026-10-10', '2026-11-06'),
  ('RP11/2026', '2026-11-07', '2026-12-04'),
  ('RP12/2026', '2026-12-05', '2027-01-01'),
  ('RP13/2026', '2027-01-02', '2027-01-29');

-- Step 4: Create certification_renewal_plans table (if not exists)
CREATE TABLE IF NOT EXISTS certification_renewal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  check_type_id UUID NOT NULL REFERENCES check_types(id) ON DELETE CASCADE,
  original_expiry_date DATE NOT NULL,
  planned_renewal_date DATE NOT NULL,
  planned_roster_period TEXT NOT NULL,
  renewal_window_start DATE NOT NULL,
  renewal_window_end DATE NOT NULL,
  status TEXT DEFAULT 'planned',
  priority TEXT DEFAULT 'normal',
  paired_pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create renewal_plan_history table (if not exists)
CREATE TABLE IF NOT EXISTS renewal_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_plan_id UUID NOT NULL REFERENCES certification_renewal_plans(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify the setup
SELECT COUNT(*) as roster_periods_count FROM roster_period_capacity;
