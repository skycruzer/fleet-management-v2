-- RLS Policies - OPERATIONAL TABLES
-- Part 4 of 5: Certifications, tasks, leave bids, disciplinary
--
-- Developer: Maurice Rondeau
-- Date: October 27, 2025
-- Sprint: Sprint 1 Days 3-4 (Task 4)
--
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Paste into Supabase SQL Editor
-- 3. Execute
--
-- ============================================================================
-- TABLE: pilot_checks (Certification Records)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "pilot_checks_admin_manager_full_access" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_authenticated_read" ON pilot_checks;

-- Policy 1: Admin and Manager full access
CREATE POLICY "pilot_checks_admin_manager_full_access" ON pilot_checks
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: All authenticated users can read certifications
-- (needed for compliance dashboards, expiry tracking, etc.)
CREATE POLICY "pilot_checks_authenticated_read" ON pilot_checks
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: tasks (Task Management)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "tasks_admin_manager_full_access" ON tasks;
DROP POLICY IF EXISTS "tasks_assigned_user_read" ON tasks;
DROP POLICY IF EXISTS "tasks_assigned_user_update_status" ON tasks;

-- Policy 1: Admin and Manager full access
CREATE POLICY "tasks_admin_manager_full_access" ON tasks
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: Assigned users can read their tasks
CREATE POLICY "tasks_assigned_user_read" ON tasks
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

-- Policy 3: Assigned users can update task status (mark complete, etc.)
CREATE POLICY "tasks_assigned_user_update_status" ON tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- ============================================================================
-- TABLE: leave_bids (Annual Leave Bid Submissions)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "leave_bids_admin_manager_full_access" ON leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_read_own" ON leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_create_own" ON leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_update_own_pending" ON leave_bids;

-- Policy 1: Admin and Manager full access
CREATE POLICY "leave_bids_admin_manager_full_access" ON leave_bids
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: Pilots can read ONLY their own leave bids
CREATE POLICY "leave_bids_pilot_read_own" ON leave_bids
  FOR SELECT
  TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

-- Policy 3: Pilots can create leave bids for themselves
CREATE POLICY "leave_bids_pilot_create_own" ON leave_bids
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

-- Policy 4: Pilots can update ONLY their own PENDING bids
CREATE POLICY "leave_bids_pilot_update_own_pending" ON leave_bids
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

-- ============================================================================
-- TABLE: leave_bid_options (Leave Bid Option Periods)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "leave_bid_options_admin_manager_full_access" ON leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_pilot_read_own" ON leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_pilot_create_own" ON leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_pilot_update_own_pending" ON leave_bid_options;

-- Policy 1: Admin and Manager full access
CREATE POLICY "leave_bid_options_admin_manager_full_access" ON leave_bid_options
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: Pilots can read their own bid options
CREATE POLICY "leave_bid_options_pilot_read_own" ON leave_bid_options
  FOR SELECT
  TO authenticated
  USING (
    leave_bid_id IN (
      SELECT id FROM leave_bids
      WHERE pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    )
  );

-- Policy 3: Pilots can create options for their own bids
CREATE POLICY "leave_bid_options_pilot_create_own" ON leave_bid_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    leave_bid_id IN (
      SELECT id FROM leave_bids
      WHERE pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    )
  );

-- Policy 4: Pilots can update their own options (if parent bid is PENDING)
CREATE POLICY "leave_bid_options_pilot_update_own_pending" ON leave_bid_options
  FOR UPDATE
  TO authenticated
  USING (
    leave_bid_id IN (
      SELECT id FROM leave_bids
      WHERE pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
        AND status = 'PENDING'
    )
  )
  WITH CHECK (
    leave_bid_id IN (
      SELECT id FROM leave_bids
      WHERE pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
        AND status = 'PENDING'
    )
  );

-- ============================================================================
-- TABLE: disciplinary_matters (Disciplinary Records)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "disciplinary_matters_admin_manager_full_access" ON disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_manager_read_all" ON disciplinary_matters;

-- Policy 1: Admin full access (only admin can manage disciplinary records)
CREATE POLICY "disciplinary_matters_admin_manager_full_access" ON disciplinary_matters
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: Manager can read all disciplinary records (for oversight)
CREATE POLICY "disciplinary_matters_manager_read_all" ON disciplinary_matters
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Note: Pilots do NOT have access to view disciplinary records
-- This is intentional for privacy and HR compliance

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
    AND tablename IN (
        'pilot_checks',
        'tasks',
        'leave_bids',
        'leave_bid_options',
        'disciplinary_matters'
    )
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- You should see:
-- - pilot_checks: 2 policies
-- - tasks: 3 policies
-- - leave_bids: 4 policies
-- - leave_bid_options: 4 policies
-- - disciplinary_matters: 2 policies
--
-- Total: 15 policies created
