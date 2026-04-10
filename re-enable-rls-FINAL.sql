-- ============================================================================
-- FINAL RLS RE-ENABLEMENT - Corrected Column Names
-- Author: Maurice Rondeau
-- ============================================================================

-- ============================================================================
-- STEP 1: Clean slate - Disable RLS first
-- ============================================================================

ALTER TABLE IF EXISTS an_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pilots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pilot_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flight_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pilot_users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Enable RLS
-- ============================================================================

ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: an_users policies
-- ============================================================================

CREATE POLICY "service_role_all_access"
ON an_users FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "users_read_own_record"
ON an_users FOR SELECT TO authenticated
USING (auth.uid() = id);

-- ============================================================================
-- STEP 4: pilots policies
-- ============================================================================

CREATE POLICY "service_role_pilots_all"
ON pilots FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_pilots"
ON pilots FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- STEP 5: pilot_checks policies
-- ============================================================================

CREATE POLICY "service_role_checks_all"
ON pilot_checks FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_checks"
ON pilot_checks FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- STEP 6: flight_requests policies
-- ============================================================================

CREATE POLICY "service_role_flight_requests_all"
ON flight_requests FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_flight_requests"
ON flight_requests FOR SELECT TO authenticated
USING (true);

-- Note: flight_requests has both pilot_id and pilot_user_id columns
CREATE POLICY "authenticated_insert_own_flight_requests"
ON flight_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = pilot_id OR auth.uid() = pilot_user_id);

-- ============================================================================
-- STEP 7: leave_requests policies
-- ============================================================================

CREATE POLICY "service_role_leave_requests_all"
ON leave_requests FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_leave_requests"
ON leave_requests FOR SELECT TO authenticated
USING (true);

-- Note: leave_requests has both pilot_id and pilot_user_id columns
CREATE POLICY "authenticated_insert_own_leave_requests"
ON leave_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = pilot_id OR auth.uid() = pilot_user_id);

-- ============================================================================
-- STEP 8: tasks policies
-- ============================================================================

CREATE POLICY "service_role_tasks_all"
ON tasks FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_tasks"
ON tasks FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- STEP 9: notifications policies (CORRECTED: recipient_id not user_id)
-- ============================================================================

CREATE POLICY "service_role_notifications_all"
ON notifications FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- FIXED: Column is recipient_id, not user_id
CREATE POLICY "authenticated_read_own_notifications"
ON notifications FOR SELECT TO authenticated
USING (auth.uid() = recipient_id);

-- ============================================================================
-- STEP 10: pilot_users policies
-- ============================================================================

CREATE POLICY "service_role_pilot_users_all"
ON pilot_users FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_own_pilot_user"
ON pilot_users FOR SELECT TO authenticated
USING (auth.uid() = auth_user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

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
    'tasks',
    'notifications',
    'pilot_users'
)
GROUP BY tablename
ORDER BY tablename;

SELECT '✅ RLS RE-ENABLED WITH CORRECTED COLUMN NAMES!' as status;
