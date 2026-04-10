-- RLS Policies - REFERENCE TABLES
-- Part 5 of 5: Read-only reference data (check types, contract types)
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
-- REFERENCE TABLES:
-- These tables contain read-only reference data that all users need access to.
-- Only Admin can modify these tables.
--
-- ============================================================================
-- TABLE: check_types (Check Type Definitions)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "check_types_admin_full_access" ON check_types;
DROP POLICY IF EXISTS "check_types_authenticated_read" ON check_types;

-- Policy 1: Admin full access (only admin can manage check types)
CREATE POLICY "check_types_admin_full_access" ON check_types
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  );

-- Policy 2: All authenticated users can read check types
-- (needed for certification forms, validation, dashboards)
CREATE POLICY "check_types_authenticated_read" ON check_types
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: contract_types (Contract Type Definitions)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "contract_types_admin_full_access" ON contract_types;
DROP POLICY IF EXISTS "contract_types_authenticated_read" ON contract_types;

-- Policy 1: Admin full access (only admin can manage contract types)
CREATE POLICY "contract_types_admin_full_access" ON contract_types
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  )
  WITH CHECK (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  );

-- Policy 2: All authenticated users can read contract types
-- (needed for pilot management, HR functions)
CREATE POLICY "contract_types_authenticated_read" ON contract_types
  FOR SELECT
  TO authenticated
  USING (true);

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
    AND tablename IN ('check_types', 'contract_types')
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- You should see:
-- - check_types: 2 policies (admin_full_access, authenticated_read)
-- - contract_types: 2 policies (admin_full_access, authenticated_read)
--
-- Total: 4 policies created
--
-- Reference tables are now protected:
-- - Only Admin can INSERT/UPDATE/DELETE
-- - All authenticated users can SELECT (read-only access)
