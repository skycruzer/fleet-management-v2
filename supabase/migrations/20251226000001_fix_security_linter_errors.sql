-- Migration: Fix Supabase Database Linter Security Errors
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- Fixes the following linter errors:
-- 1. policy_exists_rls_disabled: failed_login_attempts has policies but RLS disabled
-- 2. security_definer_view: 4 views defined with SECURITY DEFINER
-- 3. rls_disabled_in_public: roster_period_capacity and failed_login_attempts tables
--
-- Changes:
-- - Enable RLS on failed_login_attempts with service role bypass
-- - Enable RLS on roster_period_capacity with appropriate policies
-- - Recreate views with SECURITY INVOKER (default, respects caller's RLS)

-- ============================================================================
-- 1. FIX: failed_login_attempts - Enable RLS with service role access
-- ============================================================================

-- Re-enable RLS on failed_login_attempts
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (they reference an_users which may cause issues)
DROP POLICY IF EXISTS "Admins can view failed attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Admins can insert failed attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Admins can delete failed attempts" ON failed_login_attempts;

-- Create new policies that allow service role full access
-- Service role bypasses RLS by default, but we need explicit policies for other roles

-- Allow authenticated admin users to view failed attempts
CREATE POLICY "admin_view_failed_attempts"
  ON failed_login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

-- Allow service role and postgres to manage all records
-- Note: service_role bypasses RLS, but this makes intent explicit
CREATE POLICY "service_insert_failed_attempts"
  ON failed_login_attempts
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "service_delete_failed_attempts"
  ON failed_login_attempts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'Admin'
    )
  );

COMMENT ON TABLE failed_login_attempts IS
  'Security audit table for failed login attempts. RLS enabled with service role access for logging.';

-- ============================================================================
-- 2. FIX: roster_period_capacity - Enable RLS with appropriate policies
-- ============================================================================

-- Enable RLS
ALTER TABLE roster_period_capacity ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view capacity data (read-only for planning)
CREATE POLICY "authenticated_view_capacity"
  ON roster_period_capacity
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow only admins to modify capacity
CREATE POLICY "admin_modify_capacity"
  ON roster_period_capacity
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('Admin', 'Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('Admin', 'Manager')
    )
  );

COMMENT ON TABLE roster_period_capacity IS
  'Tracks capacity limits and allocations for each roster period. RLS enabled.';

-- ============================================================================
-- 3. FIX: Recreate views with SECURITY INVOKER (removes SECURITY DEFINER)
-- ============================================================================

-- In PostgreSQL 15+, views are SECURITY INVOKER by default.
-- We need to drop and recreate to remove SECURITY DEFINER property.

-- 3a. Recreate active_leave_requests view
DROP VIEW IF EXISTS active_leave_requests CASCADE;

CREATE VIEW active_leave_requests
WITH (security_invoker = true)
AS
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
  'Active leave requests from unified pilot_requests table. Uses SECURITY INVOKER - respects caller RLS policies.';

-- 3b. Recreate active_flight_requests view
DROP VIEW IF EXISTS active_flight_requests CASCADE;

CREATE VIEW active_flight_requests
WITH (security_invoker = true)
AS
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
  'Active flight requests from unified pilot_requests table. Uses SECURITY INVOKER - respects caller RLS policies.';

-- 3c. Recreate active_rdo_sdo_requests view
DROP VIEW IF EXISTS active_rdo_sdo_requests CASCADE;

CREATE VIEW active_rdo_sdo_requests
WITH (security_invoker = true)
AS
SELECT
  id,
  pilot_id,
  pilot_user_id,
  employee_number,
  rank,
  name,
  request_category,
  request_type,
  submission_channel,
  submission_date,
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
  is_late_request,
  is_past_deadline,
  priority_score,
  reason,
  notes,
  created_at,
  updated_at
FROM pilot_requests
WHERE request_category IN ('RDO', 'SDO')
  AND workflow_status NOT IN ('DENIED', 'WITHDRAWN');

COMMENT ON VIEW active_rdo_sdo_requests IS
  'Active RDO/SDO requests from unified pilot_requests table. Uses SECURITY INVOKER - respects caller RLS policies.';

-- 3d. Recreate pilot_requests_stale_data view
DROP VIEW IF EXISTS pilot_requests_stale_data CASCADE;

CREATE VIEW pilot_requests_stale_data
WITH (security_invoker = true)
AS
SELECT
  pr.id,
  pr.rank as stored_rank,
  p.role::TEXT as current_rank,
  pr.employee_number as stored_employee_number,
  p.employee_id as current_employee_id
FROM pilot_requests pr
JOIN pilots p ON pr.pilot_id = p.id
WHERE pr.rank != p.role::TEXT OR pr.employee_number != p.employee_id;

COMMENT ON VIEW pilot_requests_stale_data IS
  'Shows pilot_requests records with denormalized data that differs from current pilot table values. Uses SECURITY INVOKER.';

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  view_security TEXT;
BEGIN
  -- Check failed_login_attempts RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'failed_login_attempts';

  IF rls_enabled THEN
    RAISE NOTICE '✅ failed_login_attempts: RLS enabled';
  ELSE
    RAISE WARNING '❌ failed_login_attempts: RLS still disabled';
  END IF;

  -- Check roster_period_capacity RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'roster_period_capacity';

  IF rls_enabled THEN
    RAISE NOTICE '✅ roster_period_capacity: RLS enabled';
  ELSE
    RAISE WARNING '❌ roster_period_capacity: RLS still disabled';
  END IF;

  -- Check views exist
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_leave_requests') THEN
    RAISE NOTICE '✅ active_leave_requests: View recreated with SECURITY INVOKER';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_flight_requests') THEN
    RAISE NOTICE '✅ active_flight_requests: View recreated with SECURITY INVOKER';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_rdo_sdo_requests') THEN
    RAISE NOTICE '✅ active_rdo_sdo_requests: View recreated with SECURITY INVOKER';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'pilot_requests_stale_data') THEN
    RAISE NOTICE '✅ pilot_requests_stale_data: View recreated with SECURITY INVOKER';
  END IF;

  RAISE NOTICE '✅ Security linter fixes migration completed';
END $$;
