-- RLS Policies - AUDIT LOGS (Immutable Audit Trail)
-- Part 3 of 5: Audit logging and compliance
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
-- CRITICAL SECURITY REQUIREMENT:
-- Audit logs must be IMMUTABLE (INSERT-only, no UPDATE or DELETE)
--
-- ============================================================================
-- TABLE: audit_logs (Immutable Audit Trail)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "audit_logs_admin_read_all" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_authenticated_create" ON audit_logs;

-- Policy 1: Admin can read all audit logs
CREATE POLICY "audit_logs_admin_read_all" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM an_users WHERE id = auth.uid()) = 'Admin'
  );

-- Policy 2: All authenticated users can INSERT audit logs
-- (needed for automatic audit trail from services)
CREATE POLICY "audit_logs_authenticated_create" ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ⚠️ IMPORTANT: NO UPDATE POLICY
-- ⚠️ IMPORTANT: NO DELETE POLICY
--
-- By not creating UPDATE or DELETE policies, we ensure:
-- - Audit logs cannot be modified after creation
-- - Audit logs cannot be deleted
-- - This maintains audit trail integrity

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
    AND tablename = 'audit_logs'
ORDER BY policyname;

-- ============================================================================
-- VERIFY IMMUTABILITY: Test that UPDATE and DELETE are blocked
-- ============================================================================

-- This query should show that ONLY SELECT and INSERT policies exist
-- UPDATE and DELETE should have NO policies (which means DENIED)
SELECT
    tablename,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'audit_logs'
GROUP BY tablename, cmd
ORDER BY cmd;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- You should see:
-- - audit_logs: 2 policies total
--   - 1 SELECT policy (admin_read_all)
--   - 1 INSERT policy (authenticated_create)
--   - 0 UPDATE policies ✅ (audit logs are immutable)
--   - 0 DELETE policies ✅ (audit logs are immutable)
--
-- This ensures complete audit trail integrity.
