-- RLS Policies - CRITICAL USER TABLES
-- Part 1 of 5: User accounts, pilots, and authentication
--
-- Developer: Maurice Rondeau
-- Date: October 27, 2025
-- Sprint: Sprint 1 Days 3-4 (Task 4)
--
-- INSTRUCTIONS:
-- 1. Ensure RLS is enabled first (run enable-rls-safe.sql)
-- 2. Copy this entire script
-- 3. Paste into Supabase SQL Editor
-- 4. Execute
--
-- ============================================================================
-- TABLE: an_users (User Accounts and Roles)
-- ============================================================================
-- CRITICAL: Protects user roles and prevents privilege escalation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "an_users_authenticated_read" ON an_users;
DROP POLICY IF EXISTS "an_users_admin_full_access" ON an_users;
DROP POLICY IF EXISTS "an_users_users_read_own" ON an_users;
DROP POLICY IF EXISTS "an_users_users_update_own_profile" ON an_users;

-- Policy 1: Admin full access (all operations)
CREATE POLICY "an_users_admin_full_access" ON an_users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  );

-- Policy 2: Users can read their own record
CREATE POLICY "an_users_users_read_own" ON an_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 3: Users can update their own profile (but NOT role)
CREATE POLICY "an_users_users_update_own_profile" ON an_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM an_users WHERE id = auth.uid())  -- Role cannot be changed
  );

-- ============================================================================
-- TABLE: pilots (Pilot Profiles)
-- ============================================================================
-- CRITICAL: Controls access to pilot information

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "pilots_admin_manager_full_access" ON pilots;
DROP POLICY IF EXISTS "pilots_authenticated_read" ON pilots;
DROP POLICY IF EXISTS "pilots_pilot_read_own" ON pilots;

-- Policy 1: Admin and Manager full access
CREATE POLICY "pilots_admin_manager_full_access" ON pilots
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

-- Policy 2: All authenticated users can read pilot information
-- (needed for dashboards, leave request approvals, etc.)
CREATE POLICY "pilots_authenticated_read" ON pilots
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: pilot_users (Pilot Portal Authentication)
-- ============================================================================
-- CRITICAL: Protects pilot portal user accounts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "pilot_users_admin_full_access" ON pilot_users;
DROP POLICY IF EXISTS "pilot_users_pilot_read_own" ON pilot_users;

-- Policy 1: Admin full access
CREATE POLICY "pilot_users_admin_full_access" ON pilot_users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  );

-- Policy 2: Pilots can read their own record
CREATE POLICY "pilot_users_pilot_read_own" ON pilot_users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

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
    AND tablename IN ('an_users', 'pilots', 'pilot_users')
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- You should see:
-- - an_users: 3 policies (admin_full_access, users_read_own, users_update_own_profile)
-- - pilots: 2 policies (admin_manager_full_access, authenticated_read)
-- - pilot_users: 2 policies (admin_full_access, pilot_read_own)
--
-- Total: 7 policies created
