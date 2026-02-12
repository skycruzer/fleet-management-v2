-- Migration: Remove Non-renewal check types
-- Removes all 7 non-renewal check types (B767_PE_CNS, PBN, EFB_CBT, B767_PERF, LICENCES, OPT, B767_WB)
-- and their associated pilot_checks and certification_renewal_plans records.
-- FK constraints use ON DELETE CASCADE, so child rows are auto-deleted.

-- 1. Delete pilot_checks referencing Non-renewal check types (explicit for clarity, CASCADE would also handle this)
DELETE FROM pilot_checks
WHERE check_type_id IN (SELECT id FROM check_types WHERE category = 'Non-renewal');

-- 2. Delete certification_renewal_plans referencing Non-renewal check types (explicit for clarity)
DELETE FROM certification_renewal_plans
WHERE check_type_id IN (SELECT id FROM check_types WHERE category = 'Non-renewal');

-- 3. Delete Non-renewal check types
DELETE FROM check_types WHERE category = 'Non-renewal';

-- 4. Update roster_period_capacity default to remove "Non-renewal" key
ALTER TABLE roster_period_capacity
  ALTER COLUMN max_pilots_per_category
  SET DEFAULT '{"ID Cards": 2, "Flight Checks": 4, "Pilot Medical": 4, "Simulator Checks": 6, "Ground Courses Refresher": 8, "Foreign Pilot Work Permit": 2}'::jsonb;

-- 5. Remove "Non-renewal" key from existing roster_period_capacity rows
UPDATE roster_period_capacity
SET max_pilots_per_category = max_pilots_per_category - 'Non-renewal'
WHERE max_pilots_per_category ? 'Non-renewal';

UPDATE roster_period_capacity
SET current_allocations = current_allocations - 'Non-renewal'
WHERE current_allocations ? 'Non-renewal';
