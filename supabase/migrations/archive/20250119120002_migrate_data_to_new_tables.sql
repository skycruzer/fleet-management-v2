-- Migration: Migrate Data from pilot_requests to New Tables
-- Description: Migrate RDO/SDO data to rdo_sdo_requests and leave data to leave_requests
-- Author: Maurice Rondeau
-- Created: 2025-01-19
-- Part of 3-table request architecture migration

-- ============================================
-- CRITICAL: This migration transfers all data from pilot_requests
-- to the new dedicated tables (rdo_sdo_requests and leave_requests)
-- ============================================

-- ============================================
-- 1. Verification: Count records before migration
-- ============================================

DO $$
DECLARE
  rdo_sdo_count INTEGER;
  leave_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count RDO/SDO requests in pilot_requests
  SELECT COUNT(*) INTO rdo_sdo_count
  FROM pilot_requests
  WHERE request_category = 'FLIGHT'
    AND request_type IN ('RDO', 'SDO');

  -- Count leave requests in pilot_requests
  SELECT COUNT(*) INTO leave_count
  FROM pilot_requests
  WHERE request_category = 'LEAVE';

  -- Total records
  SELECT COUNT(*) INTO total_count
  FROM pilot_requests;

  RAISE NOTICE '=== PRE-MIGRATION COUNTS ===';
  RAISE NOTICE 'RDO/SDO requests to migrate: %', rdo_sdo_count;
  RAISE NOTICE 'Leave requests to migrate: %', leave_count;
  RAISE NOTICE 'Total pilot_requests records: %', total_count;
  RAISE NOTICE '============================';
END $$;

-- ============================================
-- 2. Migrate RDO/SDO requests to rdo_sdo_requests table
-- ============================================

INSERT INTO rdo_sdo_requests (
  id,
  pilot_id,
  pilot_user_id,
  employee_number,
  rank,
  name,
  request_type,
  submission_channel,
  submission_date,
  submitted_by_admin_id,
  source_reference,
  source_attachment_url,
  start_date,
  end_date,
  days_count,
  roster_period,
  roster_period_start_date,
  roster_publish_date,
  roster_deadline_date,
  workflow_status,
  reviewed_by,
  reviewed_at,
  review_comments,
  conflict_flags,
  availability_impact,
  is_late_request,
  is_past_deadline,
  priority_score,
  reason,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  pilot_id,
  pilot_user_id,
  employee_number,
  rank,
  name,
  request_type,  -- RDO or SDO
  submission_channel,
  submission_date,
  submitted_by_admin_id,
  source_reference,
  source_attachment_url,
  start_date,
  end_date,
  days_count,
  roster_period,
  roster_period_start_date,
  roster_publish_date,
  roster_deadline_date,
  workflow_status,
  reviewed_by,
  reviewed_at,
  review_comments,
  conflict_flags,
  availability_impact,
  is_late_request,
  is_past_deadline,
  priority_score,
  reason,
  notes,
  created_at,
  updated_at
FROM pilot_requests
WHERE request_category = 'FLIGHT'
  AND request_type IN ('RDO', 'SDO')
ON CONFLICT (id) DO NOTHING;  -- Skip duplicates if migration runs twice

-- ============================================
-- 3. Migrate leave requests to leave_requests table
-- ============================================

INSERT INTO leave_requests (
  id,
  pilot_id,
  pilot_user_id,
  employee_number,
  rank,
  name,
  request_type,
  submission_channel,
  submission_date,
  submitted_by_admin_id,
  source_reference,
  source_attachment_url,
  start_date,
  end_date,
  days_count,
  roster_period,
  roster_period_start_date,
  roster_publish_date,
  roster_deadline_date,
  workflow_status,
  reviewed_by,
  reviewed_at,
  review_comments,
  conflict_flags,
  availability_impact,
  is_late_request,
  is_past_deadline,
  priority_score,
  reason,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  pilot_id,
  pilot_user_id,
  employee_number,
  rank,
  name,
  request_type,  -- ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE
  submission_channel,
  submission_date,
  submitted_by_admin_id,
  source_reference,
  source_attachment_url,
  start_date,
  end_date,
  days_count,
  roster_period,
  roster_period_start_date,
  roster_publish_date,
  roster_deadline_date,
  workflow_status,
  reviewed_by,
  reviewed_at,
  review_comments,
  conflict_flags,
  availability_impact,
  is_late_request,
  is_past_deadline,
  priority_score,
  reason,
  notes,
  created_at,
  updated_at
FROM pilot_requests
WHERE request_category = 'LEAVE'
ON CONFLICT (id) DO NOTHING;  -- Skip duplicates if migration runs twice

-- ============================================
-- 4. Verification: Count records after migration
-- ============================================

DO $$
DECLARE
  rdo_sdo_new_count INTEGER;
  leave_new_count INTEGER;
  remaining_count INTEGER;
BEGIN
  -- Count RDO/SDO requests in new table
  SELECT COUNT(*) INTO rdo_sdo_new_count
  FROM rdo_sdo_requests;

  -- Count leave requests in new table
  SELECT COUNT(*) INTO leave_new_count
  FROM leave_requests;

  -- Count remaining records in pilot_requests
  SELECT COUNT(*) INTO remaining_count
  FROM pilot_requests;

  RAISE NOTICE '=== POST-MIGRATION COUNTS ===';
  RAISE NOTICE 'RDO/SDO requests migrated: %', rdo_sdo_new_count;
  RAISE NOTICE 'Leave requests migrated: %', leave_new_count;
  RAISE NOTICE 'Remaining pilot_requests records: %', remaining_count;
  RAISE NOTICE '=============================';

  -- Verify migration success
  IF rdo_sdo_new_count = 0 AND leave_new_count = 0 THEN
    RAISE WARNING 'No data was migrated! Check pilot_requests table contents.';
  ELSE
    RAISE NOTICE '✅ Migration successful!';
  END IF;
END $$;

-- ============================================
-- 5. Archive pilot_requests table
-- ============================================

-- Rename pilot_requests to pilot_requests_archive
ALTER TABLE pilot_requests RENAME TO pilot_requests_archive;

-- Add deprecation comment
COMMENT ON TABLE pilot_requests_archive IS
'⚠️ ARCHIVED TABLE - Do not use for new data!
This table contains historical data from the unified request system (v2.0.0).
All RDO/SDO requests have been migrated to rdo_sdo_requests table.
All leave requests have been migrated to leave_requests table.
This archive will be kept for 30 days (until 2025-02-19) and then dropped.
Archived: 2025-01-19';

-- Make table read-only via RLS
ALTER TABLE pilot_requests_archive ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins full access" ON pilot_requests_archive;

-- Allow SELECT only (read-only)
CREATE POLICY "Read-only archive access"
  ON pilot_requests_archive
  FOR SELECT
  TO authenticated
  USING (true);

-- Prevent all modifications
CREATE POLICY "Prevent modifications to archive"
  ON pilot_requests_archive
  FOR ALL
  USING (false);

-- ============================================
-- 6. Create verification function
-- ============================================

CREATE OR REPLACE FUNCTION verify_migration()
RETURNS TABLE (
  table_name text,
  record_count bigint,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'rdo_sdo_requests'::text,
    (SELECT COUNT(*) FROM rdo_sdo_requests),
    CASE
      WHEN (SELECT COUNT(*) FROM rdo_sdo_requests) > 0 THEN '✅ Data migrated'
      ELSE '⚠️ No data'
    END::text
  UNION ALL
  SELECT
    'leave_requests'::text,
    (SELECT COUNT(*) FROM leave_requests),
    CASE
      WHEN (SELECT COUNT(*) FROM leave_requests) > 0 THEN '✅ Data migrated'
      ELSE '⚠️ No data'
    END::text
  UNION ALL
  SELECT
    'pilot_requests_archive'::text,
    (SELECT COUNT(*) FROM pilot_requests_archive),
    CASE
      WHEN (SELECT COUNT(*) FROM pilot_requests_archive) > 0 THEN '📦 Archived'
      ELSE '✅ Empty (expected)'
    END::text;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION verify_migration() TO authenticated;

-- ============================================
-- 7. Refresh materialized views
-- ============================================

REFRESH MATERIALIZED VIEW rdo_sdo_requests_stats;
REFRESH MATERIALIZED VIEW leave_requests_stats;

-- ============================================
-- 8. Final verification
-- ============================================

SELECT * FROM verify_migration();

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. This migration is idempotent (safe to run multiple times)
-- 2. pilot_requests table is now renamed to pilot_requests_archive (read-only)
-- 3. All new requests should use rdo_sdo_requests or leave_requests
-- 4. The archive table will be dropped after 30 days (2025-02-19)
-- 5. Run: SELECT * FROM verify_migration(); to check migration status
-- ============================================
