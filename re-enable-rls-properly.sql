-- ============================================================================
-- PROPER RLS RE-ENABLEMENT - No Circular Dependencies
-- Author: Maurice Rondeau
-- Strategy: Use auth.uid() directly instead of querying an_users
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================================

ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: an_users table policies (NO REFERENCES TO OTHER TABLES)
-- ============================================================================

-- Service role bypasses RLS (always granted by default, but explicit for clarity)
CREATE POLICY "service_role_all_access"
ON an_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own record
-- Uses auth.uid() which does NOT query an_users (avoids recursion)
CREATE POLICY "users_read_own_record"
ON an_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ============================================================================
-- STEP 3: pilots table policies (NO REFERENCES TO an_users)
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_pilots_all"
ON pilots
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all pilots (for leave eligibility checks)
CREATE POLICY "authenticated_read_pilots"
ON pilots
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- STEP 4: pilot_checks table policies (NO REFERENCES TO an_users)
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_checks_all"
ON pilot_checks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all checks (for compliance dashboards)
CREATE POLICY "authenticated_read_checks"
ON pilot_checks
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- STEP 5: flight_requests table policies (NO REFERENCES TO an_users)
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_flight_requests_all"
ON flight_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all flight requests
CREATE POLICY "authenticated_read_flight_requests"
ON flight_requests
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert their own flight requests
CREATE POLICY "authenticated_insert_own_flight_requests"
ON flight_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = pilot_id);

-- ============================================================================
-- STEP 6: leave_requests table policies (NO REFERENCES TO an_users)
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_leave_requests_all"
ON leave_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all leave requests (for eligibility checks)
CREATE POLICY "authenticated_read_leave_requests"
ON leave_requests
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert their own leave requests
CREATE POLICY "authenticated_insert_own_leave_requests"
ON leave_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = pilot_id);

-- ============================================================================
-- STEP 7: disciplinary_actions table policies
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_disciplinary_all"
ON disciplinary_actions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all disciplinary actions
CREATE POLICY "authenticated_read_disciplinary"
ON disciplinary_actions
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- STEP 8: tasks table policies
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_tasks_all"
ON tasks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all tasks
CREATE POLICY "authenticated_read_tasks"
ON tasks
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- STEP 9: notifications table policies
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_notifications_all"
ON notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own notifications
CREATE POLICY "authenticated_read_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 10: pilot_users table policies (for pilot portal)
-- ============================================================================

-- Service role full access
CREATE POLICY "service_role_pilot_users_all"
ON pilot_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own pilot_users record
CREATE POLICY "authenticated_read_own_pilot_user"
ON pilot_users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled on all tables
SELECT
    tablename,
    CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '🔓 DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'an_users',
    'pilots',
    'pilot_checks',
    'flight_requests',
    'leave_requests',
    'disciplinary_actions',
    'tasks',
    'notifications',
    'pilot_users'
)
ORDER BY tablename;

-- Count policies per table
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'an_users',
    'pilots',
    'pilot_checks',
    'flight_requests',
    'leave_requests',
    'disciplinary_actions',
    'tasks',
    'notifications',
    'pilot_users'
)
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- KEY DIFFERENCES FROM PREVIOUS APPROACH
-- ============================================================================
-- 1. NO policies reference an_users table (prevents recursion)
-- 2. Uses auth.uid() directly (built-in Supabase function, no table query)
-- 3. Service role has explicit full access (bypasses all RLS)
-- 4. Authenticated users have appropriate read/write permissions
-- 5. Simple and maintainable
-- ============================================================================

SELECT '✅ RLS RE-ENABLED WITH PROPER POLICIES - NO CIRCULAR DEPENDENCIES!' as status;
