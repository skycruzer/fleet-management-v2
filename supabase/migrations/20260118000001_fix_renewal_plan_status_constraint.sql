-- Migration: Fix Renewal Plan Status Constraint Conflict
-- Author: Maurice Rondeau
-- Date: 2026-01-18
--
-- Problem: Two conflicting constraints exist on certification_renewal_plans.status:
-- 1. Original 'valid_status': allows lowercase ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')
-- 2. Added 'chk_certification_renewal_plans_status_valid': requires uppercase ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED')
--
-- Solution: Drop the conflicting uppercase constraint, keep the original lowercase constraint

-- Drop the conflicting constraint if it exists
ALTER TABLE certification_renewal_plans
DROP CONSTRAINT IF EXISTS chk_certification_renewal_plans_status_valid;

-- Verify the original constraint still exists (just a comment for documentation)
-- The original 'valid_status' constraint allows: 'planned', 'confirmed', 'in_progress', 'completed', 'cancelled'

COMMENT ON COLUMN certification_renewal_plans.status IS 'Plan status: planned, confirmed, in_progress, completed, cancelled';
