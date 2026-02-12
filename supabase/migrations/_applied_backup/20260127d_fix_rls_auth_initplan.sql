-- Migration: Fix RLS Auth InitPlan Issues
-- Author: Maurice Rondeau
-- Date: 2026-01-27
-- Resolves: 58 auth_rls_initplan WARN issues
-- Pattern: Replace auth.<function>() with (select auth.<function>())

-- ============================================================================
-- Helper: Create a reusable function for role checking (optimized)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.an_users WHERE id = (select auth.uid()) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.an_users
    WHERE id = (select auth.uid())
      AND role::text = ANY(ARRAY['Admin', 'Manager', 'admin', 'manager'])
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.an_users
    WHERE id = (select auth.uid())
      AND role::text = ANY(ARRAY['Admin', 'admin'])
  );
$$;

-- ============================================================================
-- Fix policies on an_users
-- ============================================================================

DROP POLICY IF EXISTS "an_users_auth_select_own_v2" ON public.an_users;
DROP POLICY IF EXISTS "an_users_auth_update_own_v2" ON public.an_users;

CREATE POLICY "an_users_auth_select_own_v2" ON public.an_users
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "an_users_auth_update_own_v2" ON public.an_users
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- Fix policies on check_types
-- ============================================================================

DROP POLICY IF EXISTS "check_types_admin_full_access" ON public.check_types;

CREATE POLICY "check_types_admin_full_access" ON public.check_types
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- Fix policies on contract_types
-- ============================================================================

DROP POLICY IF EXISTS "contract_types_admin_full_access" ON public.contract_types;

CREATE POLICY "contract_types_admin_full_access" ON public.contract_types
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- Fix policies on disciplinary_matters
-- ============================================================================

DROP POLICY IF EXISTS "disciplinary_matters_admin_manager_full_access" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_manager_read_all" ON public.disciplinary_matters;

CREATE POLICY "disciplinary_matters_admin_manager_full_access" ON public.disciplinary_matters
  FOR ALL TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

-- ============================================================================
-- Fix policies on leave_bids
-- ============================================================================

DROP POLICY IF EXISTS "leave_bids_admin_manager_full_access" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_read_own" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_create_own" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_pilot_update_own_pending" ON public.leave_bids;

CREATE POLICY "leave_bids_admin_manager_full_access" ON public.leave_bids
  FOR ALL TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "leave_bids_pilot_read_own" ON public.leave_bids
  FOR SELECT TO authenticated
  USING (pilot_id IN (SELECT id FROM pilots WHERE user_id = (select auth.uid())));

CREATE POLICY "leave_bids_pilot_create_own" ON public.leave_bids
  FOR INSERT TO authenticated
  WITH CHECK (pilot_id IN (SELECT id FROM pilots WHERE user_id = (select auth.uid())));

CREATE POLICY "leave_bids_pilot_update_own_pending" ON public.leave_bids
  FOR UPDATE TO authenticated
  USING (pilot_id IN (SELECT id FROM pilots WHERE user_id = (select auth.uid())) AND status::text = 'PENDING')
  WITH CHECK (pilot_id IN (SELECT id FROM pilots WHERE user_id = (select auth.uid())) AND status::text IN ('PENDING', 'WITHDRAWN'));

-- ============================================================================
-- Fix policies on leave_bid_options
-- ============================================================================

DROP POLICY IF EXISTS "Service role full access to bid options" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can view their own bid options" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can insert their own bid options" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can update their own bid options" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can delete their own bid options" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can insert options for their own bids" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can update options for pending bids" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can delete options for pending bids" ON public.leave_bid_options;

CREATE POLICY "Service role full access to bid options" ON public.leave_bid_options
  FOR ALL TO public
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Pilots can view their own bid options" ON public.leave_bid_options
  FOR SELECT TO public
  USING (user_owns_leave_bid(bid_id) OR (select auth.role()) = 'service_role');

CREATE POLICY "Pilots can insert their own bid options" ON public.leave_bid_options
  FOR INSERT TO public
  WITH CHECK (user_owns_leave_bid(bid_id) OR (select auth.role()) = 'service_role');

CREATE POLICY "Pilots can update their own bid options" ON public.leave_bid_options
  FOR UPDATE TO public
  USING (user_owns_leave_bid(bid_id) OR (select auth.role()) = 'service_role')
  WITH CHECK (user_owns_leave_bid(bid_id) OR (select auth.role()) = 'service_role');

CREATE POLICY "Pilots can delete their own bid options" ON public.leave_bid_options
  FOR DELETE TO public
  USING (user_owns_leave_bid(bid_id) OR (select auth.role()) = 'service_role');

-- ============================================================================
-- Fix policies on pilot_requests
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users full access" ON public.pilot_requests;
DROP POLICY IF EXISTS "Service role full access" ON public.pilot_requests;

CREATE POLICY "Authenticated users full access" ON public.pilot_requests
  FOR ALL TO public
  USING ((select auth.role()) = 'authenticated')
  WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "Service role full access" ON public.pilot_requests
  FOR ALL TO public
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

-- ============================================================================
-- Fix policies on pilot_sessions
-- ============================================================================

DROP POLICY IF EXISTS "pilot_sessions_select_own" ON public.pilot_sessions;
DROP POLICY IF EXISTS "pilot_sessions_update_own" ON public.pilot_sessions;

CREATE POLICY "pilot_sessions_select_own" ON public.pilot_sessions
  FOR SELECT TO authenticated
  USING (pilot_user_id = (select auth.uid()));

CREATE POLICY "pilot_sessions_update_own" ON public.pilot_sessions
  FOR UPDATE TO authenticated
  USING (pilot_user_id = (select auth.uid()))
  WITH CHECK (pilot_user_id = (select auth.uid()));

-- ============================================================================
-- Fix policies on notifications
-- ============================================================================

DROP POLICY IF EXISTS "notifications_admin_full_access" ON public.notifications;
DROP POLICY IF EXISTS "notifications_user_read_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_user_update_own" ON public.notifications;
DROP POLICY IF EXISTS "authenticated_read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "notifications_admin_full_access" ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "notifications_user_read_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = (select auth.uid()));

CREATE POLICY "notifications_user_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = (select auth.uid()))
  WITH CHECK (recipient_id = (select auth.uid()));

-- ============================================================================
-- Fix policies on pilot_users
-- ============================================================================

DROP POLICY IF EXISTS "pilot_users_admin_full_access" ON public.pilot_users;
DROP POLICY IF EXISTS "pilot_users_pilot_read_own" ON public.pilot_users;
DROP POLICY IF EXISTS "authenticated_read_own_pilot_user" ON public.pilot_users;

CREATE POLICY "pilot_users_admin_full_access" ON public.pilot_users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pilot_users_pilot_read_own" ON public.pilot_users
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

-- ============================================================================
-- Fix policies on pilots
-- ============================================================================

DROP POLICY IF EXISTS "pilots_admin_manager_full_access" ON public.pilots;

CREATE POLICY "pilots_admin_manager_full_access" ON public.pilots
  FOR ALL TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

-- ============================================================================
-- Fix policies on pilot_checks
-- ============================================================================

DROP POLICY IF EXISTS "pilot_checks_admin_manager_full_access" ON public.pilot_checks;

CREATE POLICY "pilot_checks_admin_manager_full_access" ON public.pilot_checks
  FOR ALL TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

-- ============================================================================
-- Fix policies on tasks
-- ============================================================================

DROP POLICY IF EXISTS "tasks_admin_manager_full_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assigned_user_read" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assigned_user_update_status" ON public.tasks;

CREATE POLICY "tasks_admin_manager_full_access" ON public.tasks
  FOR ALL TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "tasks_assigned_user_read" ON public.tasks
  FOR SELECT TO authenticated
  USING (assigned_to = (select auth.uid()));

CREATE POLICY "tasks_assigned_user_update_status" ON public.tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = (select auth.uid()))
  WITH CHECK (assigned_to = (select auth.uid()));

-- ============================================================================
-- Fix policies on audit_logs
-- ============================================================================

DROP POLICY IF EXISTS "audit_logs_admin_read_all" ON public.audit_logs;

CREATE POLICY "audit_logs_admin_read_all" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- Fix policies on report_email_settings
-- ============================================================================

DROP POLICY IF EXISTS "Admin users can view email settings" ON public.report_email_settings;
DROP POLICY IF EXISTS "Admin users can insert email settings" ON public.report_email_settings;
DROP POLICY IF EXISTS "Admin users can update email settings" ON public.report_email_settings;
DROP POLICY IF EXISTS "Admin users can delete email settings" ON public.report_email_settings;

CREATE POLICY "Admin users can view email settings" ON public.report_email_settings
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin users can insert email settings" ON public.report_email_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can update email settings" ON public.report_email_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can delete email settings" ON public.report_email_settings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- Fix policies on password_history
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all password history" ON public.password_history;

CREATE POLICY "Admins can view all password history" ON public.password_history
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- Fix policies on password_policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage password policies" ON public.password_policies;

CREATE POLICY "Admins can manage password policies" ON public.password_policies
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- Fix policies on account_lockouts
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert lockouts" ON public.account_lockouts;
DROP POLICY IF EXISTS "Admins can update lockouts" ON public.account_lockouts;
DROP POLICY IF EXISTS "Admins can delete lockouts" ON public.account_lockouts;

CREATE POLICY "Admins can insert lockouts" ON public.account_lockouts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update lockouts" ON public.account_lockouts
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete lockouts" ON public.account_lockouts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- Fix policies on feedback_posts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own feedback posts" ON public.feedback_posts;
DROP POLICY IF EXISTS "Users can create feedback posts" ON public.feedback_posts;
DROP POLICY IF EXISTS "Users can update own pending feedback posts" ON public.feedback_posts;

CREATE POLICY "Users can view own feedback posts" ON public.feedback_posts
  FOR SELECT TO authenticated
  USING (pilot_user_id = (select auth.uid()));

CREATE POLICY "Users can create feedback posts" ON public.feedback_posts
  FOR INSERT TO authenticated
  WITH CHECK (pilot_user_id = (select auth.uid()));

CREATE POLICY "Users can update own pending feedback posts" ON public.feedback_posts
  FOR UPDATE TO authenticated
  USING (pilot_user_id = (select auth.uid()) AND status::text = 'PENDING')
  WITH CHECK (pilot_user_id = (select auth.uid()));

-- ============================================================================
-- Fix policies on feedback_likes
-- ============================================================================

DROP POLICY IF EXISTS "Users can create likes" ON public.feedback_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.feedback_likes;

CREATE POLICY "Users can create likes" ON public.feedback_likes
  FOR INSERT TO authenticated
  WITH CHECK (pilot_user_id = (select auth.uid()));

CREATE POLICY "Users can delete own likes" ON public.feedback_likes
  FOR DELETE TO authenticated
  USING (pilot_user_id = (select auth.uid()));

-- ============================================================================
-- Fix policies on feedback_comments
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own comments" ON public.feedback_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.feedback_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.feedback_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.feedback_comments;

CREATE POLICY "Users can view own comments" ON public.feedback_comments
  FOR SELECT TO authenticated
  USING (pilot_user_id = (select auth.uid()));

CREATE POLICY "Users can create comments" ON public.feedback_comments
  FOR INSERT TO authenticated
  WITH CHECK (pilot_user_id = (select auth.uid()));

CREATE POLICY "Users can update own comments" ON public.feedback_comments
  FOR UPDATE TO authenticated
  USING (pilot_user_id = (select auth.uid()))
  WITH CHECK (pilot_user_id = (select auth.uid()));

CREATE POLICY "Users can delete own comments" ON public.feedback_comments
  FOR DELETE TO authenticated
  USING (pilot_user_id = (select auth.uid()));
