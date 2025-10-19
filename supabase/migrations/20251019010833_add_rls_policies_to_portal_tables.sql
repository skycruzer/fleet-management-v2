-- Migration: Add RLS Policies to Portal Tables
-- Purpose: Implement Row Level Security on feedback_posts, leave_requests, and flight_requests
-- Security: P1 CRITICAL - Prevents unauthorized data access/modification
-- Created: 2025-10-19
-- TODO: #032

-- =======================
-- FEEDBACK POSTS
-- =======================

-- Policy: Anyone can view all feedback (public forum)
CREATE POLICY "feedback_posts_select_all"
  ON feedback_posts
  FOR SELECT
  USING (true);

-- Policy: Users can only insert their own posts
CREATE POLICY "feedback_posts_insert_own"
  ON feedback_posts
  FOR INSERT
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only update their own posts
CREATE POLICY "feedback_posts_update_own"
  ON feedback_posts
  FOR UPDATE
  USING (pilot_user_id = auth.uid())
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only delete their own posts
CREATE POLICY "feedback_posts_delete_own"
  ON feedback_posts
  FOR DELETE
  USING (pilot_user_id = auth.uid());

-- =======================
-- LEAVE REQUESTS
-- =======================

-- Policy: Users can view their own leave requests
CREATE POLICY "leave_requests_select_own"
  ON leave_requests
  FOR SELECT
  USING (pilot_user_id = auth.uid());

-- Policy: Fleet managers can view all leave requests
CREATE POLICY "leave_requests_select_managers"
  ON leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Policy: Users can only insert their own leave requests
CREATE POLICY "leave_requests_insert_own"
  ON leave_requests
  FOR INSERT
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only update their own pending requests
CREATE POLICY "leave_requests_update_own"
  ON leave_requests
  FOR UPDATE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  )
  WITH CHECK (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- Policy: Fleet managers can update any leave request
CREATE POLICY "leave_requests_update_managers"
  ON leave_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Policy: Users can delete their own pending requests
CREATE POLICY "leave_requests_delete_own"
  ON leave_requests
  FOR DELETE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- =======================
-- FLIGHT REQUESTS
-- =======================

-- Policy: Users can view their own flight requests
CREATE POLICY "flight_requests_select_own"
  ON flight_requests
  FOR SELECT
  USING (pilot_user_id = auth.uid());

-- Policy: Fleet managers can view all flight requests
CREATE POLICY "flight_requests_select_managers"
  ON flight_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Policy: Users can only insert their own flight requests
CREATE POLICY "flight_requests_insert_own"
  ON flight_requests
  FOR INSERT
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only update their own pending requests
CREATE POLICY "flight_requests_update_own"
  ON flight_requests
  FOR UPDATE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  )
  WITH CHECK (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- Policy: Fleet managers can update any flight request
CREATE POLICY "flight_requests_update_managers"
  ON flight_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Policy: Users can delete their own pending requests
CREATE POLICY "flight_requests_delete_own"
  ON flight_requests
  FOR DELETE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- =======================
-- VERIFICATION QUERIES
-- =======================

-- Verify RLS is enabled (should return true for all)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('feedback_posts', 'leave_requests', 'flight_requests');

-- List all policies created
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('feedback_posts', 'leave_requests', 'flight_requests')
-- ORDER BY tablename, policyname;
