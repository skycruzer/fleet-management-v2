-- Migration: Mark Legacy Tables as Deprecated
-- Date: 2025-11-16
-- Purpose: Prevent writes to legacy tables and add deprecation notices

-- ============================================
-- 1. Add schema comments to deprecated tables
-- ============================================

COMMENT ON TABLE leave_requests IS
'⚠️ DEPRECATED: Use pilot_requests table instead.
This table is kept for historical reference only.
All new leave requests should use pilot_requests with request_category=''LEAVE''.
Created: v1.0.0
Deprecated: v2.0.0 (2025-11-16)
Will be removed: TBD';

COMMENT ON TABLE flight_requests IS
'⚠️ DEPRECATED: Use pilot_requests table instead.
This table is empty and should be dropped.
All new flight requests should use pilot_requests with request_category=''FLIGHT''.
Created: v1.0.0
Deprecated: v2.0.0 (2025-11-16)
Status: EMPTY (0 records) - Safe to drop';

-- ============================================
-- 2. Make leave_requests READ-ONLY via RLS
-- ============================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow read access to leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Prevent writes to deprecated leave_requests" ON leave_requests;

-- Enable RLS if not already enabled
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Allow SELECT (read-only access)
CREATE POLICY "Allow read access to leave_requests"
ON leave_requests
FOR SELECT
TO authenticated
USING (true);

-- Explicitly PREVENT INSERT/UPDATE/DELETE
CREATE POLICY "Prevent inserts to deprecated leave_requests"
ON leave_requests
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Prevent updates to deprecated leave_requests"
ON leave_requests
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent deletes from deprecated leave_requests"
ON leave_requests
FOR DELETE
TO authenticated
USING (false);

-- ============================================
-- 3. Make flight_requests READ-ONLY via RLS
-- ============================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow read access to flight_requests" ON flight_requests;
DROP POLICY IF EXISTS "Prevent writes to deprecated flight_requests" ON flight_requests;

-- Enable RLS if not already enabled
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

-- Allow SELECT (read-only access)
CREATE POLICY "Allow read access to flight_requests"
ON flight_requests
FOR SELECT
TO authenticated
USING (true);

-- Explicitly PREVENT INSERT/UPDATE/DELETE
CREATE POLICY "Prevent inserts to deprecated flight_requests"
ON flight_requests
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Prevent updates to deprecated flight_requests"
ON flight_requests
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent deletes from deprecated flight_requests"
ON flight_requests
FOR DELETE
TO authenticated
USING (false);

-- ============================================
-- 4. Add helpful function to check for deprecated table usage
-- ============================================

CREATE OR REPLACE FUNCTION check_deprecated_table_usage()
RETURNS TABLE (
  table_name text,
  status text,
  record_count bigint,
  recommendation text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'leave_requests'::text,
    'DEPRECATED - READ ONLY'::text,
    (SELECT COUNT(*) FROM leave_requests),
    'Migrate to pilot_requests with request_category=''LEAVE'''::text
  UNION ALL
  SELECT
    'flight_requests'::text,
    'DEPRECATED - EMPTY'::text,
    (SELECT COUNT(*) FROM flight_requests),
    'Can be dropped - all data in pilot_requests with request_category=''FLIGHT'''::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_deprecated_table_usage() TO authenticated;

-- ============================================
-- 5. Verification
-- ============================================

-- Check that policies are created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN cmd = 'SELECT' THEN '✅ Allowed'
    ELSE '🚫 Blocked'
  END as access_level
FROM pg_policies
WHERE tablename IN ('leave_requests', 'flight_requests')
ORDER BY tablename, cmd;

-- Check deprecated table status
SELECT * FROM check_deprecated_table_usage();
