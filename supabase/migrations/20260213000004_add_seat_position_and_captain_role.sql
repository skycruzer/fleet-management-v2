/**
 * Migration: Add Seat Position and Captain Role to Certification Renewal Plans
 * Author: Maurice Rondeau
 *
 * Adds seat_position column to track whether a captain performs their simulator
 * check from the right-hand seat (RHS). Training captains, examiners, and
 * RHS-qualified captains conduct their simulator checks from the right seat.
 *
 * Also adds captain_role to record the captain's qualification type at the
 * time of plan generation, enabling filtering and reporting.
 */

-- Add seat_position column to track left/right seat for simulator checks
ALTER TABLE certification_renewal_plans
  ADD COLUMN IF NOT EXISTS seat_position VARCHAR(20)
  DEFAULT NULL
  CHECK (seat_position IN (
    'left_seat',    -- Standard position (Captains normally, FOs always)
    'right_seat'    -- RHS/Training/Examiner captains during sim checks
  ));

COMMENT ON COLUMN certification_renewal_plans.seat_position IS
  'Seat position for simulator checks: right_seat for RHS/training/examiner captains, left_seat for standard, NULL for non-sim checks';

-- Add captain_role to record which qualification triggered RHS scheduling
ALTER TABLE certification_renewal_plans
  ADD COLUMN IF NOT EXISTS captain_role VARCHAR(30)
  DEFAULT NULL
  CHECK (captain_role IN (
    'line_captain',       -- Standard line captain
    'training_captain',   -- TRI - Type Rating Instructor
    'examiner',           -- TRE - Type Rating Examiner
    'rhs_captain'         -- RHS-qualified captain
  ));

COMMENT ON COLUMN certification_renewal_plans.captain_role IS
  'Captain qualification type at time of plan generation: training_captain (TRI), examiner (TRE), rhs_captain, or line_captain';

-- Index for filtering by seat position (useful for capacity planning)
CREATE INDEX IF NOT EXISTS idx_renewal_plans_seat_position
  ON certification_renewal_plans(seat_position)
  WHERE seat_position IS NOT NULL;

-- Composite index for RHS-specific queries
CREATE INDEX IF NOT EXISTS idx_renewal_plans_period_seat
  ON certification_renewal_plans(planned_roster_period, seat_position)
  WHERE seat_position = 'right_seat';
