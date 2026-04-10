-- Enable RLS on All Tables - Safe Script
-- This script checks for table existence before enabling RLS
--
-- Developer: Maurice Rondeau
-- Date: October 27, 2025
-- Sprint: Sprint 1 Days 3-4 (Task 4)
--
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Open Supabase SQL Editor: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
-- 3. Paste and execute
--
-- This script uses DO blocks to safely enable RLS only on existing tables

-- ============================================================================
-- PART 1: CRITICAL USER TABLES (Enable RLS Immediately)
-- ============================================================================

DO $$
BEGIN
    -- an_users - User accounts and roles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'an_users') THEN
        ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: an_users';
    ELSE
        RAISE NOTICE '⚠️  Table not found: an_users';
    END IF;

    -- pilots - Pilot profiles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pilots') THEN
        ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: pilots';
    ELSE
        RAISE NOTICE '⚠️  Table not found: pilots';
    END IF;

    -- pilot_users - Pilot portal authentication
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pilot_users') THEN
        ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: pilot_users';
    ELSE
        RAISE NOTICE '⚠️  Table not found: pilot_users';
    END IF;
END $$;

-- ============================================================================
-- PART 2: SENSITIVE DATA TABLES (Personal/Private Data)
-- ============================================================================

DO $$
BEGIN
    -- leave_requests - Leave request submissions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_requests') THEN
        ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: leave_requests';
    ELSE
        RAISE NOTICE '⚠️  Table not found: leave_requests';
    END IF;

    -- flight_requests - Flight request submissions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'flight_requests') THEN
        ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: flight_requests';
    ELSE
        RAISE NOTICE '⚠️  Table not found: flight_requests';
    END IF;

    -- notifications - User notifications
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: notifications';
    ELSE
        RAISE NOTICE '⚠️  Table not found: notifications';
    END IF;

    -- audit_logs - Audit trail
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: audit_logs';
    ELSE
        RAISE NOTICE '⚠️  Table not found: audit_logs';
    END IF;

    -- disciplinary_matters - Disciplinary records (new name)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'disciplinary_matters') THEN
        ALTER TABLE disciplinary_matters ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: disciplinary_matters';
    ELSE
        RAISE NOTICE '⚠️  Table not found: disciplinary_matters';
    END IF;
END $$;

-- ============================================================================
-- PART 3: OPERATIONAL TABLES
-- ============================================================================

DO $$
BEGIN
    -- pilot_checks - Certification records
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pilot_checks') THEN
        ALTER TABLE pilot_checks ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: pilot_checks';
    ELSE
        RAISE NOTICE '⚠️  Table not found: pilot_checks';
    END IF;

    -- tasks - Task management
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: tasks';
    ELSE
        RAISE NOTICE '⚠️  Table not found: tasks';
    END IF;

    -- leave_bids - Annual leave bid submissions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_bids') THEN
        ALTER TABLE leave_bids ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: leave_bids';
    ELSE
        RAISE NOTICE '⚠️  Table not found: leave_bids';
    END IF;

    -- leave_bid_options - Leave bid option periods
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_bid_options') THEN
        ALTER TABLE leave_bid_options ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: leave_bid_options';
    ELSE
        RAISE NOTICE '⚠️  Table not found: leave_bid_options';
    END IF;
END $$;

-- ============================================================================
-- PART 4: REFERENCE TABLES (Read-only data)
-- ============================================================================

DO $$
BEGIN
    -- check_types - Check type definitions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'check_types') THEN
        ALTER TABLE check_types ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: check_types';
    ELSE
        RAISE NOTICE '⚠️  Table not found: check_types';
    END IF;

    -- contract_types - Contract type definitions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contract_types') THEN
        ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on: contract_types';
    ELSE
        RAISE NOTICE '⚠️  Table not found: contract_types';
    END IF;
END $$;

-- ============================================================================
-- PART 5: VERIFY RLS IS ENABLED
-- ============================================================================

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
        'leave_requests', 'flight_requests', 'notifications', 'audit_logs',
        'disciplinary_matters',
        'pilot_checks', 'tasks', 'leave_bids', 'leave_bid_options',
        'check_types', 'contract_types'
    )
ORDER BY tablename;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

-- ⚠️  WARNING: RLS is now ENABLED but NO POLICIES exist yet!
--
-- This means:
-- - All SELECT/INSERT/UPDATE/DELETE operations will be DENIED by default
-- - You MUST create policies to allow access
-- - See RLS-POLICY-AUDIT.md for required policies
--
-- Next Steps:
-- 1. Review the verification table above
-- 2. Create RLS policies (follow RLS-POLICY-AUDIT.md)
-- 3. Test with RLS-TESTING-GUIDE.md
--
-- If you need to temporarily disable RLS for testing:
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
--
-- To re-enable:
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
