-- RLS COMPLETE SETUP GUIDE
-- Master script with execution order and verification
--
-- Developer: Maurice Rondeau
-- Date: October 27, 2025
-- Sprint: Sprint 1 Days 3-4 (Task 4)
--
-- ============================================================================
-- EXECUTION ORDER (IMPORTANT - Follow this sequence)
-- ============================================================================
--
-- Step 1: Enable RLS on all tables
--         File: scripts/enable-rls-safe.sql
--         Time: ~1 minute
--
-- Step 2: Create policies for critical user tables
--         File: scripts/create-rls-policies-critical.sql
--         Time: ~1 minute
--         Creates: 7 policies (an_users, pilots, pilot_users)
--
-- Step 3: Create policies for sensitive data tables
--         File: scripts/create-rls-policies-sensitive-data.sql
--         Time: ~1 minute
--         Creates: 14 policies (leave_requests, flight_requests, notifications)
--
-- Step 4: Create policies for audit logs
--         File: scripts/create-rls-policies-audit-logs.sql
--         Time: ~30 seconds
--         Creates: 2 policies (immutable audit trail)
--
-- Step 5: Create policies for operational tables
--         File: scripts/create-rls-policies-operational.sql
--         Time: ~1 minute
--         Creates: 15 policies (pilot_checks, tasks, leave_bids, etc.)
--
-- Step 6: Create policies for reference tables
--         File: scripts/create-rls-policies-reference.sql
--         Time: ~30 seconds
--         Creates: 4 policies (check_types, contract_types)
--
-- Step 7: Run this verification script (below)
--         Time: ~30 seconds
--
-- TOTAL TIME: ~5-6 minutes
-- TOTAL POLICIES: 42 policies across 14 tables
--
-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: RLS Status for All Tables
-- Expected: All tables should have rowsecurity = true

SELECT
    tablename,
    rowsecurity as rls_enabled,
    CASE
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'an_users', 'pilots', 'pilot_users',
        'leave_requests', 'flight_requests', 'notifications',
        'audit_logs', 'disciplinary_matters',
        'pilot_checks', 'tasks', 'leave_bids', 'leave_bid_options',
        'check_types', 'contract_types'
    )
ORDER BY tablename;

-- Expected Result: All 14 tables show '✅ Enabled'

-- ============================================================================

-- Query 2: Policy Count by Table
-- Expected: 42 total policies

SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'an_users', 'pilots', 'pilot_users',
        'leave_requests', 'flight_requests', 'notifications',
        'audit_logs', 'disciplinary_matters',
        'pilot_checks', 'tasks', 'leave_bids', 'leave_bid_options',
        'check_types', 'contract_types'
    )
GROUP BY tablename
ORDER BY tablename;

-- Expected Results:
-- an_users: 3 policies
-- audit_logs: 2 policies
-- check_types: 2 policies
-- contract_types: 2 policies
-- disciplinary_matters: 2 policies
-- flight_requests: 5 policies
-- leave_bid_options: 4 policies
-- leave_bids: 4 policies
-- leave_requests: 5 policies
-- notifications: 4 policies
-- pilot_checks: 2 policies
-- pilot_users: 2 policies
-- pilots: 2 policies
-- tasks: 3 policies
-- TOTAL: 42 policies

-- ============================================================================

-- Query 3: Policy Coverage Summary
-- Expected: All operations (SELECT, INSERT, UPDATE, DELETE) are covered

SELECT
    tablename,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'an_users', 'pilots', 'pilot_users',
        'leave_requests', 'flight_requests', 'notifications',
        'audit_logs', 'disciplinary_matters',
        'pilot_checks', 'tasks', 'leave_bids', 'leave_bid_options',
        'check_types', 'contract_types'
    )
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- ============================================================================

-- Query 4: Critical Security Checks
-- Verify critical policies exist

-- Check 1: Pilot data isolation (leave_requests)
SELECT
    policyname,
    cmd,
    CASE
        WHEN policyname LIKE '%pilot_read_own%' THEN '✅ Isolation policy exists'
        ELSE 'Policy: ' || policyname
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'leave_requests'
    AND cmd = 'SELECT';

-- Expected: Should see 'pilot_read_own' policy for SELECT

-- Check 2: Admin role protection (an_users)
SELECT
    policyname,
    cmd,
    CASE
        WHEN policyname LIKE '%admin%' THEN '✅ Admin policy exists'
        ELSE 'Policy: ' || policyname
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'an_users'
    AND cmd = 'ALL';

-- Expected: Should see admin full access policy

-- Check 3: Audit trail immutability (audit_logs)
SELECT
    cmd,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'audit_logs'
GROUP BY cmd;

-- Expected:
-- - SELECT: 1 policy (admin read)
-- - INSERT: 1 policy (authenticated create)
-- - UPDATE: 0 policies ✅ (immutable)
-- - DELETE: 0 policies ✅ (immutable)

-- ============================================================================

-- Query 5: Full Policy Listing (Detailed View)
-- Lists all policies with their operations

SELECT
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'an_users', 'pilots', 'pilot_users',
        'leave_requests', 'flight_requests', 'notifications',
        'audit_logs', 'disciplinary_matters',
        'pilot_checks', 'tasks', 'leave_bids', 'leave_bid_options',
        'check_types', 'contract_types'
    )
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
--
-- ✅ All 14 tables have RLS enabled
-- ✅ Total of 42 policies created
-- ✅ Critical policies exist:
--    - Pilot data isolation (leave_requests, flight_requests)
--    - Admin role protection (an_users)
--    - Audit trail immutability (audit_logs)
--    - Reference data read-only access (check_types, contract_types)
-- ✅ No security gaps (all CRUD operations covered appropriately)
--
-- ============================================================================
-- NEXT STEPS AFTER VERIFICATION
-- ============================================================================
--
-- 1. ✅ Review verification query results above
-- 2. ⏳ Run RLS testing suite (RLS-TESTING-GUIDE.md)
-- 3. ⏳ Test with different user roles (Admin, Manager, Pilot)
-- 4. ⏳ Verify application still works correctly
-- 5. ⏳ Document any issues found
-- 6. ⏳ Deploy to production (after successful testing)
--
-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- If verification fails:
--
-- Problem: RLS not enabled on some tables
-- Solution: Re-run enable-rls-safe.sql
--
-- Problem: Policy count is wrong
-- Solution: Check which policies are missing, re-run specific policy script
--
-- Problem: Application returns empty results
-- Solution: Policies may be too restrictive, review policy logic
--
-- Problem: Users can see data they shouldn't
-- Solution: RLS policies may be too permissive, tighten USING clauses
--
-- For detailed troubleshooting, see: RLS-POLICY-AUDIT.md
--
-- ============================================================================
