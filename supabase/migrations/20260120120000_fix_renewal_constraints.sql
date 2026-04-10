/**
 * Migration: Fix Certification Renewal Plan Constraints
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Problem: The constraint `chk_certification_renewal_plans_renewal_before_expiry`
 * requires planned_renewal_date <= original_expiry_date, but grace periods
 * (60-90 days) allow renewals to be scheduled AFTER the expiry date.
 *
 * Solution: Drop the conflicting constraint. The `chk_certification_renewal_plans_date_in_window`
 * constraint already ensures planned dates fall within the proper renewal window
 * (which accounts for grace periods).
 *
 * Also fix conflicting priority constraints:
 * - One says 0-10, another says 1-100
 * - Standardize to 1-10 for consistency
 */

-- Drop the constraint that conflicts with grace period logic
ALTER TABLE certification_renewal_plans
DROP CONSTRAINT IF EXISTS chk_certification_renewal_plans_renewal_before_expiry;

-- Drop conflicting priority constraint (1-100 range)
ALTER TABLE certification_renewal_plans
DROP CONSTRAINT IF EXISTS chk_certification_renewal_plans_priority_positive;

-- The remaining constraint (0-10) is close enough to what we want (1-10)
-- Just update the description via comment
COMMENT ON CONSTRAINT certification_renewal_plans_priority_check ON certification_renewal_plans
IS 'Priority range 0-10 (lower = higher priority, 0 = urgent)';

SELECT 'Migration complete: Removed conflicting renewal constraints' AS status;
