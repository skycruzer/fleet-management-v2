-- RLS Policies - SENSITIVE DATA TABLES
-- Part 2 of 5: Leave requests, flight requests, notifications
--
-- Developer: Maurice Rondeau
-- Date: October 27, 2025
-- Sprint: Sprint 1 Days 3-4 (Task 4)
--
-- INSTRUCTIONS:
-- 1. Ensure Part 1 (critical tables) is completed first
-- 2. Copy this entire script
-- 3. Paste into Supabase SQL Editor
-- 4. Execute
--
-- ============================================================================
-- TABLE: leave_requests (Leave Request Submissions)
-- ============================================================================
-- CRITICAL: Pilots must ONLY see their own leave requests

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "leave_requests_admin_manager_full_access" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_read_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_create_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_update_own_pending" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_delete_own_pending" ON leave_requests;

-- Policy 1: Admin and Manager full access
CREATE POLICY "leave_requests_admin_manager_full_access" ON leave_requests
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: Pilots can read ONLY their own leave requests
CREATE POLICY "leave_requests_pilot_read_own" ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

-- Policy 3: Pilots can create leave requests for themselves
CREATE POLICY "leave_requests_pilot_create_own" ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

-- Policy 4: Pilots can update ONLY their own PENDING requests
CREATE POLICY "leave_requests_pilot_update_own_pending" ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status = 'PENDING'
  )
  WITH CHECK (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status IN ('PENDING', 'WITHDRAWN')  -- Can only set to PENDING or WITHDRAWN
  );

-- Policy 5: Pilots can delete ONLY their own PENDING requests
CREATE POLICY "leave_requests_pilot_delete_own_pending" ON leave_requests
  FOR DELETE
  TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status = 'PENDING'
  );

-- ============================================================================
-- TABLE: flight_requests (Flight Request Submissions)
-- ============================================================================
-- CRITICAL: Pilots must ONLY see their own flight requests

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "flight_requests_admin_manager_full_access" ON flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_read_own" ON flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_create_own" ON flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_update_own_pending" ON flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_delete_own_pending" ON flight_requests;

-- Policy 1: Admin and Manager full access
CREATE POLICY "flight_requests_admin_manager_full_access" ON flight_requests
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: Pilots can read ONLY their own flight requests
CREATE POLICY "flight_requests_pilot_read_own" ON flight_requests
  FOR SELECT
  TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

-- Policy 3: Pilots can create flight requests for themselves
CREATE POLICY "flight_requests_pilot_create_own" ON flight_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

-- Policy 4: Pilots can update ONLY their own PENDING requests
CREATE POLICY "flight_requests_pilot_update_own_pending" ON flight_requests
  FOR UPDATE
  TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status = 'PENDING'
  )
  WITH CHECK (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status IN ('PENDING', 'WITHDRAWN')
  );

-- Policy 5: Pilots can delete ONLY their own PENDING requests
CREATE POLICY "flight_requests_pilot_delete_own_pending" ON flight_requests
  FOR DELETE
  TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status = 'PENDING'
  );

-- ============================================================================
-- TABLE: notifications (User Notifications)
-- ============================================================================
-- CRITICAL: Users must ONLY see their own notifications

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "notifications_admin_full_access" ON notifications;
DROP POLICY IF EXISTS "notifications_user_read_own" ON notifications;
DROP POLICY IF EXISTS "notifications_user_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_system_create" ON notifications;

-- Policy 1: Admin full access (for system management)
CREATE POLICY "notifications_admin_full_access" ON notifications
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  );

-- Policy 2: Users can read ONLY their own notifications
CREATE POLICY "notifications_user_read_own" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Users can update ONLY their own notifications (mark as read)
CREATE POLICY "notifications_user_update_own" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: System can create notifications for any user
CREATE POLICY "notifications_system_create" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Any authenticated user can create notifications

-- ============================================================================
-- VERIFICATION: Check that policies were created
-- ============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('leave_requests', 'flight_requests', 'notifications')
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- You should see:
-- - leave_requests: 5 policies
-- - flight_requests: 5 policies
-- - notifications: 4 policies
--
-- Total: 14 policies created
