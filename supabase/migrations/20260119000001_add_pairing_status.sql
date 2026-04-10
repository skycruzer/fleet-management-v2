/**
 * Migration: Add Pairing Status for Certification Renewal Plans
 * Author: Maurice Rondeau
 *
 * This migration adds the pairing_status column to track Captain/FO pairing
 * for Flight Checks and Simulator Checks (90-day renewal window).
 * Medical checks (28-day window) remain individual scheduling.
 */

-- Add pairing_status column to track pairing outcome
ALTER TABLE certification_renewal_plans
  ADD COLUMN IF NOT EXISTS pairing_status VARCHAR(20)
  DEFAULT 'not_applicable'
  CHECK (pairing_status IN (
    'paired',           -- Successfully paired with another pilot
    'unpaired_solo',    -- Could not find pair, scheduled solo
    'not_applicable'    -- Category doesn't require pairing (Medical, Ground)
  ));

-- Add comment for clarity
COMMENT ON COLUMN certification_renewal_plans.pairing_status IS
  'Tracks pairing outcome: paired (matched with crew), unpaired_solo (urgent solo schedule), not_applicable (Medical/Ground)';

-- Add index for efficient pair lookups by pair_group_id
CREATE INDEX IF NOT EXISTS idx_renewal_plans_pair_group
  ON certification_renewal_plans(pair_group_id)
  WHERE pair_group_id IS NOT NULL;

-- Add index for filtering by pairing status
CREATE INDEX IF NOT EXISTS idx_renewal_plans_pairing_status
  ON certification_renewal_plans(pairing_status);

-- Add composite index for common queries: category + period + pairing
CREATE INDEX IF NOT EXISTS idx_renewal_plans_period_category_pairing
  ON certification_renewal_plans(planned_roster_period, pairing_status)
  INCLUDE (pilot_id, paired_pilot_id, pair_group_id);

-- Backfill existing records: Set pairing_status based on category
-- Flight Checks and Simulator Checks that have no pair = 'unpaired_solo'
-- All others = 'not_applicable'
UPDATE certification_renewal_plans crp
SET pairing_status = CASE
  WHEN ct.category IN ('Flight Checks', 'Simulator Checks') AND crp.paired_pilot_id IS NOT NULL THEN 'paired'
  WHEN ct.category IN ('Flight Checks', 'Simulator Checks') AND crp.paired_pilot_id IS NULL THEN 'unpaired_solo'
  ELSE 'not_applicable'
END
FROM check_types ct
WHERE crp.check_type_id = ct.id
  AND crp.pairing_status IS NULL;
