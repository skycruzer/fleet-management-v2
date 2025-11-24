-- Migration: Mark Legacy Request Tables as Read-Only
-- Description: Deprecate leave_requests and flight_requests tables, make them read-only via RLS
-- Author: Maurice Rondeau (Sprint 1.1 - Unified Table Migration)
-- Created: 2025-11-20
--
-- Context: All services have been migrated to use the unified pilot_requests table.
-- These legacy tables are kept for backward compatibility and audit purposes only.
-- New data should ONLY be written to pilot_requests table.

-- =============================================================================
-- STEP 1: Add deprecation comments to legacy tables
-- =============================================================================

COMMENT ON TABLE leave_requests IS
  '⚠️  DEPRECATED (Nov 2025): Migrated to pilot_requests table with request_category=''LEAVE''.
   This table is READ-ONLY for backward compatibility.
   DO NOT INSERT/UPDATE/DELETE - use pilot_requests instead.';

COMMENT ON TABLE flight_requests IS
  '⚠️  DEPRECATED (Nov 2025): Migrated to pilot_requests table with request_category=''FLIGHT''.
   This table is READ-ONLY for backward compatibility.
   DO NOT INSERT/UPDATE/DELETE - use pilot_requests instead.';

-- =============================================================================
-- STEP 2: Remove existing RLS policies on legacy tables
-- =============================================================================

-- Drop all existing policies on leave_requests
DO $$
BEGIN
  -- Get all policy names for leave_requests
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'leave_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON leave_requests', r.policyname);
  END LOOP;
END $$;

-- Drop all existing policies on flight_requests
DO $$
BEGIN
  -- Get all policy names for flight_requests
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'flight_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON flight_requests', r.policyname);
  END LOOP;
END $$;

-- =============================================================================
-- STEP 3: Create read-only RLS policies on legacy tables
-- =============================================================================

-- Leave Requests: Allow SELECT only, block all writes
CREATE POLICY "legacy_leave_requests_select_only"
  ON leave_requests
  FOR SELECT
  USING (true);

CREATE POLICY "legacy_leave_requests_block_insert"
  ON leave_requests
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "legacy_leave_requests_block_update"
  ON leave_requests
  FOR UPDATE
  USING (false);

CREATE POLICY "legacy_leave_requests_block_delete"
  ON leave_requests
  FOR DELETE
  USING (false);

-- Flight Requests: Allow SELECT only, block all writes
CREATE POLICY "legacy_flight_requests_select_only"
  ON flight_requests
  FOR SELECT
  USING (true);

CREATE POLICY "legacy_flight_requests_block_insert"
  ON flight_requests
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "legacy_flight_requests_block_update"
  ON flight_requests
  FOR UPDATE
  USING (false);

CREATE POLICY "legacy_flight_requests_block_delete"
  ON flight_requests
  FOR DELETE
  USING (false);

-- =============================================================================
-- STEP 4: Create helper views for easy querying (optional)
-- =============================================================================

-- View: All leave requests (from unified table)
CREATE OR REPLACE VIEW active_leave_requests AS
SELECT
  id,
  pilot_id,
  request_type,
  start_date,
  end_date,
  days_count,
  workflow_status,
  reason,
  submission_date,
  submission_channel,
  is_late_request,
  created_at,
  reviewed_by,
  reviewed_at,
  review_comments,
  -- Additional unified table fields
  name as pilot_name,
  rank,
  employee_number,
  roster_period,
  roster_period_start_date,
  roster_deadline_date,
  roster_publish_date
FROM pilot_requests
WHERE request_category = 'LEAVE';

COMMENT ON VIEW active_leave_requests IS
  'Active leave requests from unified pilot_requests table. Use this view instead of deprecated leave_requests table.';

-- View: All flight requests (from unified table)
CREATE OR REPLACE VIEW active_flight_requests AS
SELECT
  id,
  pilot_id,
  request_type,
  start_date,
  workflow_status,
  reason,
  submission_date,
  submission_channel,
  created_at,
  reviewed_by,
  reviewed_at,
  review_comments,
  -- Additional unified table fields
  name as pilot_name,
  rank,
  employee_number,
  roster_period,
  roster_period_start_date,
  roster_deadline_date,
  roster_publish_date
FROM pilot_requests
WHERE request_category = 'FLIGHT';

COMMENT ON VIEW active_flight_requests IS
  'Active flight requests from unified pilot_requests table. Use this view instead of deprecated flight_requests table.';

-- =============================================================================
-- VERIFICATION QUERIES (for testing)
-- =============================================================================

-- Verify leave_requests is read-only
DO $$
BEGIN
  BEGIN
    INSERT INTO leave_requests (pilot_id, request_type, start_date, end_date, days_count, workflow_status)
    VALUES (null, 'ANNUAL', '2025-01-01', '2025-01-02', 2, 'SUBMITTED');
    RAISE EXCEPTION 'ERROR: leave_requests should be read-only but INSERT succeeded!';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE '✅ leave_requests is correctly read-only (INSERT blocked)';
  END;
END $$;

-- Verify flight_requests is read-only
DO $$
BEGIN
  BEGIN
    INSERT INTO flight_requests (pilot_id, request_type, start_date, workflow_status)
    VALUES (null, 'SIMULATOR', '2025-01-01', 'SUBMITTED');
    RAISE EXCEPTION 'ERROR: flight_requests should be read-only but INSERT succeeded!';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE '✅ flight_requests is correctly read-only (INSERT blocked)';
  END;
END $$;
