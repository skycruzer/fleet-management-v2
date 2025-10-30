-- CREATE ALL RLS POLICIES - COMPLETE ALL-IN-ONE SCRIPT
-- Creates all 42 RLS policies across 14 tables
--
-- Developer: Maurice Rondeau
-- Date: October 27, 2025
-- Sprint: Sprint 1 Days 3-4 (Task 4)
--
-- IMPORTANT: Run enable-rls-safe.sql FIRST before running this script!
--
-- This script consolidates all policy creation into one execution:
-- - Part 1: Critical user tables (7 policies)
-- - Part 2: Sensitive data tables (14 policies)
-- - Part 3: Audit logs (2 policies)
-- - Part 4: Operational tables (15 policies)
-- - Part 5: Reference tables (4 policies)
--
-- TOTAL: 42 policies
--
-- ============================================================================
-- PART 1: CRITICAL USER TABLES
-- ============================================================================

-- TABLE: an_users
DROP POLICY IF EXISTS "an_users_admin_full_access" ON public.an_users;
DROP POLICY IF EXISTS "an_users_users_read_own" ON public.an_users;
DROP POLICY IF EXISTS "an_users_users_update_own_profile" ON public.an_users;

CREATE POLICY "an_users_admin_full_access" ON public.an_users
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "an_users_users_read_own" ON public.an_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "an_users_users_update_own_profile" ON public.an_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.an_users WHERE id = auth.uid()));

-- TABLE: pilots
DROP POLICY IF EXISTS "pilots_admin_manager_full_access" ON public.pilots;
DROP POLICY IF EXISTS "pilots_authenticated_read" ON public.pilots;

CREATE POLICY "pilots_admin_manager_full_access" ON public.pilots
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'))
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'));

CREATE POLICY "pilots_authenticated_read" ON public.pilots
  FOR SELECT TO authenticated
  USING (true);

-- TABLE: pilot_users
DROP POLICY IF EXISTS "pilot_users_admin_full_access" ON public.pilot_users;
DROP POLICY IF EXISTS "pilot_users_pilot_read_own" ON public.pilot_users;

CREATE POLICY "pilot_users_admin_full_access" ON public.pilot_users
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "pilot_users_pilot_read_own" ON public.pilot_users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()));

RAISE NOTICE '✅ Part 1 Complete: 7 policies created (an_users, pilots, pilot_users)';

-- ============================================================================
-- PART 2: SENSITIVE DATA TABLES
-- ============================================================================

-- TABLE: leave_requests
DROP POLICY IF EXISTS "leave_requests_admin_manager_full_access" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_read_own" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_create_own" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_update_own_pending" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_pilot_delete_own_pending" ON public.leave_requests;

CREATE POLICY "leave_requests_admin_manager_full_access" ON public.leave_requests
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'))
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'));

CREATE POLICY "leave_requests_pilot_read_own" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (pilot_user_id = auth.uid() OR pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()));

CREATE POLICY "leave_requests_pilot_create_own" ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (pilot_user_id = auth.uid() OR pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()));

CREATE POLICY "leave_requests_pilot_update_own_pending" ON public.leave_requests
  FOR UPDATE TO authenticated
  USING ((pilot_user_id = auth.uid() OR pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid())) AND status = 'PENDING')
  WITH CHECK ((pilot_user_id = auth.uid() OR pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid())) AND status IN ('PENDING', 'WITHDRAWN'));

CREATE POLICY "leave_requests_pilot_delete_own_pending" ON public.leave_requests
  FOR DELETE TO authenticated
  USING ((pilot_user_id = auth.uid() OR pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid())) AND status = 'PENDING');

-- TABLE: flight_requests
DROP POLICY IF EXISTS "flight_requests_admin_manager_full_access" ON public.flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_read_own" ON public.flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_create_own" ON public.flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_update_own_pending" ON public.flight_requests;
DROP POLICY IF EXISTS "flight_requests_pilot_delete_own_pending" ON public.flight_requests;

CREATE POLICY "flight_requests_admin_manager_full_access" ON public.flight_requests
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'))
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'));

CREATE POLICY "flight_requests_pilot_read_own" ON public.flight_requests
  FOR SELECT TO authenticated
  USING (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()));

CREATE POLICY "flight_requests_pilot_create_own" ON public.flight_requests
  FOR INSERT TO authenticated
  WITH CHECK (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()));

CREATE POLICY "flight_requests_pilot_update_own_pending" ON public.flight_requests
  FOR UPDATE TO authenticated
  USING (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()) AND status = 'PENDING')
  WITH CHECK (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()) AND status IN ('PENDING', 'WITHDRAWN'));

CREATE POLICY "flight_requests_pilot_delete_own_pending" ON public.flight_requests
  FOR DELETE TO authenticated
  USING (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()) AND status = 'PENDING');

-- TABLE: notifications
DROP POLICY IF EXISTS "notifications_admin_full_access" ON public.notifications;
DROP POLICY IF EXISTS "notifications_user_read_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_user_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_system_create" ON public.notifications;

CREATE POLICY "notifications_admin_full_access" ON public.notifications
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "notifications_user_read_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_user_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "notifications_system_create" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

RAISE NOTICE '✅ Part 2 Complete: 14 policies created (leave_requests, flight_requests, notifications)';

-- ============================================================================
-- PART 3: AUDIT LOGS (IMMUTABLE)
-- ============================================================================

DROP POLICY IF EXISTS "audit_logs_admin_read_all" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_authenticated_create" ON public.audit_logs;

CREATE POLICY "audit_logs_admin_read_all" ON public.audit_logs
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "audit_logs_authenticated_create" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

RAISE NOTICE '✅ Part 3 Complete: 2 policies created (audit_logs - immutable)';

-- ============================================================================
-- PART 4: OPERATIONAL TABLES
-- ============================================================================

-- TABLE: pilot_checks
DROP POLICY IF EXISTS "pilot_checks_admin_manager_full_access" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_authenticated_read" ON public.pilot_checks;

CREATE POLICY "pilot_checks_admin_manager_full_access" ON public.pilot_checks
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'))
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'));

CREATE POLICY "pilot_checks_authenticated_read" ON public.pilot_checks
  FOR SELECT TO authenticated
  USING (true);

-- TABLE: tasks
DROP POLICY IF EXISTS "tasks_admin_manager_full_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assigned_user_read" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assigned_user_update_status" ON public.tasks;

CREATE POLICY "tasks_admin_manager_full_access" ON public.tasks
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'))
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'));

CREATE POLICY "tasks_assigned_user_read" ON public.tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "tasks_assigned_user_update_status" ON public.tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- TABLE: leave_bids
DROP POLICY IF EXISTS "leave_bids_admin_manager_full_access" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_read_own" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_create_own" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_update_own_pending" ON public.leave_bids;

CREATE POLICY "leave_bids_admin_manager_full_access" ON public.leave_bids
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'))
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'));

CREATE POLICY "leave_bids_pilot_read_own" ON public.leave_bids
  FOR SELECT TO authenticated
  USING (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()));

CREATE POLICY "leave_bids_pilot_create_own" ON public.leave_bids
  FOR INSERT TO authenticated
  WITH CHECK (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()));

CREATE POLICY "leave_bids_pilot_update_own_pending" ON public.leave_bids
  FOR UPDATE TO authenticated
  USING (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()) AND status = 'PENDING')
  WITH CHECK (pilot_id IN (SELECT id FROM public.pilots WHERE user_id = auth.uid()) AND status IN ('PENDING', 'WITHDRAWN'));

-- TABLE: disciplinary_matters
DROP POLICY IF EXISTS "disciplinary_matters_admin_manager_full_access" ON public.disciplinary_matters;

CREATE POLICY "disciplinary_matters_admin_manager_full_access" ON public.disciplinary_matters
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'))
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) IN ('Admin', 'Manager'));

RAISE NOTICE '✅ Part 4 Complete: 11 policies created (pilot_checks, tasks, leave_bids, disciplinary_matters)';
RAISE NOTICE '⚠️  Note: leave_bid_options skipped - create separately if table exists';

-- ============================================================================
-- PART 5: REFERENCE TABLES
-- ============================================================================

-- TABLE: check_types
DROP POLICY IF EXISTS "check_types_admin_full_access" ON public.check_types;
DROP POLICY IF EXISTS "check_types_authenticated_read" ON public.check_types;

CREATE POLICY "check_types_admin_full_access" ON public.check_types
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "check_types_authenticated_read" ON public.check_types
  FOR SELECT TO authenticated
  USING (true);

-- TABLE: contract_types
DROP POLICY IF EXISTS "contract_types_admin_full_access" ON public.contract_types;
DROP POLICY IF EXISTS "contract_types_authenticated_read" ON public.contract_types;

CREATE POLICY "contract_types_admin_full_access" ON public.contract_types
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.an_users WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "contract_types_authenticated_read" ON public.contract_types
  FOR SELECT TO authenticated
  USING (true);

RAISE NOTICE '✅ Part 5 Complete: 4 policies created (check_types, contract_types)';

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

RAISE NOTICE '========================================';
RAISE NOTICE '✅ RLS POLICY CREATION COMPLETE';
RAISE NOTICE '========================================';
RAISE NOTICE 'Total policies created: 38 (42 if leave_bid_options added separately)';
RAISE NOTICE '';
RAISE NOTICE 'Breakdown:';
RAISE NOTICE '  - Part 1 (Critical): 7 policies';
RAISE NOTICE '  - Part 2 (Sensitive): 14 policies';
RAISE NOTICE '  - Part 3 (Audit): 2 policies';
RAISE NOTICE '  - Part 4 (Operational): 11 policies';
RAISE NOTICE '  - Part 5 (Reference): 4 policies';
RAISE NOTICE '';
RAISE NOTICE 'Run verification query below to confirm...';

-- Verification Query
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
