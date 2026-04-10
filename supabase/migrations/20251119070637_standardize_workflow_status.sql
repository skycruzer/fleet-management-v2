-- Standardize workflow_status values to match database constraint
-- Migration: Phase 2.1 of Unified Request System Overhaul
-- Author: Maurice Rondeau
-- Date: 2025-11-19

-- Step 1: Check current status distribution before migration
DO $$
DECLARE
  status_counts TEXT;
BEGIN
  SELECT string_agg(workflow_status || ': ' || count::TEXT, ', ')
  INTO status_counts
  FROM (
    SELECT workflow_status, COUNT(*) as count
    FROM pilot_requests
    GROUP BY workflow_status
    ORDER BY workflow_status
  ) status_summary;

  RAISE NOTICE 'BEFORE MIGRATION - Status distribution: %', status_counts;
END $$;

-- Step 2: Update non-compliant status values
-- PENDING → SUBMITTED (standardize initial submission status)
UPDATE pilot_requests
SET workflow_status = 'SUBMITTED'
WHERE workflow_status = 'PENDING';

-- UNDER_REVIEW → IN_REVIEW (match constraint name)
UPDATE pilot_requests
SET workflow_status = 'IN_REVIEW'
WHERE workflow_status = 'UNDER_REVIEW';

-- Step 3: Verify no invalid statuses remain
DO $$
DECLARE
  invalid_count INTEGER;
  invalid_statuses TEXT;
BEGIN
  SELECT COUNT(*), string_agg(DISTINCT workflow_status, ', ')
  INTO invalid_count, invalid_statuses
  FROM pilot_requests
  WHERE workflow_status NOT IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN');

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % records with invalid status values: %', invalid_count, invalid_statuses;
  ELSE
    RAISE NOTICE 'SUCCESS - All workflow_status values are now constraint-compliant';
  END IF;
END $$;

-- Step 4: Check current status distribution after migration
DO $$
DECLARE
  status_counts TEXT;
BEGIN
  SELECT string_agg(workflow_status || ': ' || count::TEXT, ', ')
  INTO status_counts
  FROM (
    SELECT workflow_status, COUNT(*) as count
    FROM pilot_requests
    GROUP BY workflow_status
    ORDER BY workflow_status
  ) status_summary;

  RAISE NOTICE 'AFTER MIGRATION - Status distribution: %', status_counts;
END $$;

-- Step 5: Add comment documenting the standardization
COMMENT ON COLUMN pilot_requests.workflow_status IS
'Request workflow status. Valid values: DRAFT, SUBMITTED, IN_REVIEW, APPROVED, DENIED, WITHDRAWN.
IMPORTANT: Do not use PENDING (use SUBMITTED) or UNDER_REVIEW (use IN_REVIEW).';

-- Migration complete
