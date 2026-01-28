-- Migration: Consolidate Duplicate RLS Policies
-- Author: Maurice Rondeau
-- Date: 2026-01-27
-- Resolves: ~160 multiple_permissive_policies WARN issues
-- Strategy: Keep optimized policies, drop legacy duplicates

-- ============================================================================
-- leave_bids - Keep: admin_manager_full_access, pilot_read/create/update_own
-- ============================================================================

DROP POLICY IF EXISTS "Admins and managers can update leave bids" ON public.leave_bids;
DROP POLICY IF EXISTS "Admins can delete leave bids" ON public.leave_bids;
DROP POLICY IF EXISTS "Authenticated users can insert leave bids" ON public.leave_bids;
DROP POLICY IF EXISTS "Authenticated users can view leave bids" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_admin_delete" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_anon_delete" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_anon_insert" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_anon_select" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_anon_update" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_insert" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_select" ON public.leave_bids;
DROP POLICY IF EXISTS "leave_bids_update" ON public.leave_bids;

-- ============================================================================
-- leave_bid_options - Keep: Service role, Admins can manage, Pilots own
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all bid options" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can insert options for their own bids" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can update options for pending bids" ON public.leave_bid_options;
DROP POLICY IF EXISTS "Pilots can delete options for pending bids" ON public.leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_admin" ON public.leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_anon_insert" ON public.leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_anon_select" ON public.leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_anon_update" ON public.leave_bid_options;
DROP POLICY IF EXISTS "leave_bid_options_select" ON public.leave_bid_options;

-- ============================================================================
-- pilots - Keep: admin_manager_full_access, authenticated_read
-- ============================================================================

DROP POLICY IF EXISTS "pilots_admin_all" ON public.pilots;
DROP POLICY IF EXISTS "pilots_anon_delete" ON public.pilots;
DROP POLICY IF EXISTS "pilots_anon_insert" ON public.pilots;
DROP POLICY IF EXISTS "pilots_anon_update" ON public.pilots;
DROP POLICY IF EXISTS "pilots_delete_policy" ON public.pilots;
DROP POLICY IF EXISTS "pilots_insert_policy" ON public.pilots;
DROP POLICY IF EXISTS "pilots_update_policy" ON public.pilots;
DROP POLICY IF EXISTS "pilots_select" ON public.pilots;
DROP POLICY IF EXISTS "pilots_select_policy" ON public.pilots;
DROP POLICY IF EXISTS "authenticated_read_pilots" ON public.pilots;
DROP POLICY IF EXISTS "pilots_authenticated_read" ON public.pilots;

-- ============================================================================
-- pilot_checks - Keep: admin_manager_full_access, authenticated_read
-- ============================================================================

DROP POLICY IF EXISTS "pilot_checks_admin_all" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_anon_delete" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_anon_insert" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_anon_select" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_anon_update" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_delete_policy" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_insert_policy" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_update_policy" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_select" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_select_policy" ON public.pilot_checks;
DROP POLICY IF EXISTS "authenticated_read_checks" ON public.pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_authenticated_read" ON public.pilot_checks;

-- ============================================================================
-- check_types - Keep: admin_full_access, authenticated_read
-- ============================================================================

DROP POLICY IF EXISTS "check_types_admin_all" ON public.check_types;
DROP POLICY IF EXISTS "check_types_anon_insert" ON public.check_types;
DROP POLICY IF EXISTS "check_types_anon_select" ON public.check_types;
DROP POLICY IF EXISTS "check_types_anon_update" ON public.check_types;
DROP POLICY IF EXISTS "check_types_delete_policy" ON public.check_types;
DROP POLICY IF EXISTS "check_types_insert_policy" ON public.check_types;
DROP POLICY IF EXISTS "check_types_update_policy" ON public.check_types;
DROP POLICY IF EXISTS "check_types_select" ON public.check_types;
DROP POLICY IF EXISTS "check_types_select_policy" ON public.check_types;

-- ============================================================================
-- contract_types - Keep: admin_full_access, authenticated_read
-- ============================================================================

DROP POLICY IF EXISTS "contract_types_admin_all" ON public.contract_types;
DROP POLICY IF EXISTS "contract_types_delete_policy" ON public.contract_types;
DROP POLICY IF EXISTS "contract_types_insert_policy" ON public.contract_types;
DROP POLICY IF EXISTS "contract_types_update_policy" ON public.contract_types;
DROP POLICY IF EXISTS "contract_types_select" ON public.contract_types;
DROP POLICY IF EXISTS "contract_types_select_policy" ON public.contract_types;

-- ============================================================================
-- pilot_requests - Keep: one full access per role
-- ============================================================================

DROP POLICY IF EXISTS "pilot_requests_admin_delete" ON public.pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_anon_delete" ON public.pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_anon_insert" ON public.pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_anon_select" ON public.pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_anon_update" ON public.pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_insert" ON public.pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_select" ON public.pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_update" ON public.pilot_requests;

-- ============================================================================
-- notifications - Keep: admin_full_access, user_read/update_own
-- ============================================================================

DROP POLICY IF EXISTS "notifications_anon_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_modify" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_system_create" ON public.notifications;
DROP POLICY IF EXISTS "authenticated_read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- ============================================================================
-- tasks - Keep: admin_manager_full_access, assigned_user_read/update
-- ============================================================================

DROP POLICY IF EXISTS "tasks_anon_delete" ON public.tasks;
DROP POLICY IF EXISTS "tasks_anon_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_anon_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_modify" ON public.tasks;
DROP POLICY IF EXISTS "authenticated_read_tasks" ON public.tasks;

-- ============================================================================
-- disciplinary_matters - Keep: admin_manager_full_access
-- ============================================================================

DROP POLICY IF EXISTS "disciplinary_matters_admin_all" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_anon_insert" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_anon_select" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_anon_update" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_delete" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_insert" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_update" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_select" ON public.disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_select" ON public.disciplinary_matters;

-- ============================================================================
-- pilot_users - Keep: admin_full_access, pilot_read_own
-- ============================================================================

DROP POLICY IF EXISTS "pilot_users_delete_admin" ON public.pilot_users;
DROP POLICY IF EXISTS "pilot_users_insert_admin" ON public.pilot_users;
DROP POLICY IF EXISTS "pilot_users_update" ON public.pilot_users;
DROP POLICY IF EXISTS "pilot_users_select" ON public.pilot_users;
DROP POLICY IF EXISTS "Allow public login authentication" ON public.pilot_users;
DROP POLICY IF EXISTS "authenticated_read_own_pilot_user" ON public.pilot_users;

-- ============================================================================
-- account_lockouts - Keep: admin policies, system policies
-- ============================================================================

DROP POLICY IF EXISTS "account_lockouts_admin" ON public.account_lockouts;

-- ============================================================================
-- pilot_sessions - Keep: select_by_token, select_own, update_own
-- ============================================================================

DROP POLICY IF EXISTS "pilot_sessions_anon_insert" ON public.pilot_sessions;
DROP POLICY IF EXISTS "pilot_sessions_anon_select" ON public.pilot_sessions;
DROP POLICY IF EXISTS "pilot_sessions_anon_update" ON public.pilot_sessions;
DROP POLICY IF EXISTS "pilot_sessions_insert_system" ON public.pilot_sessions;

-- ============================================================================
-- admin_sessions - Keep one select policy
-- ============================================================================

DROP POLICY IF EXISTS "admin_sessions_anon_select" ON public.admin_sessions;

-- ============================================================================
-- feedback_posts - Keep: admin_all, user_view/create/update_own
-- ============================================================================

DROP POLICY IF EXISTS "feedback_posts_admin_all" ON public.feedback_posts;
DROP POLICY IF EXISTS "feedback_posts_insert" ON public.feedback_posts;
DROP POLICY IF EXISTS "feedback_posts_select" ON public.feedback_posts;
DROP POLICY IF EXISTS "Users can view approved feedback posts" ON public.feedback_posts;

-- ============================================================================
-- feedback_comments - Keep: view on approved posts, own policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view comments on approved posts" ON public.feedback_comments;

-- ============================================================================
-- feedback_categories - Keep: admin manage, anyone view active
-- ============================================================================

DROP POLICY IF EXISTS "Pilots can create categories" ON public.feedback_categories;

-- ============================================================================
-- task_categories - Keep one select policy
-- ============================================================================

DROP POLICY IF EXISTS "task_categories_all" ON public.task_categories;
DROP POLICY IF EXISTS "task_categories_anon_insert" ON public.task_categories;
DROP POLICY IF EXISTS "task_categories_anon_select" ON public.task_categories;
DROP POLICY IF EXISTS "task_categories_anon_update" ON public.task_categories;
DROP POLICY IF EXISTS "task_categories_select" ON public.task_categories;

-- ============================================================================
-- task_audit_log - Keep one select policy
-- ============================================================================

DROP POLICY IF EXISTS "task_audit_log_anon_select" ON public.task_audit_log;
DROP POLICY IF EXISTS "task_audit_log_select" ON public.task_audit_log;

-- ============================================================================
-- disciplinary_audit_log - Keep one select policy
-- ============================================================================

DROP POLICY IF EXISTS "disciplinary_audit_log_anon_select" ON public.disciplinary_audit_log;
DROP POLICY IF EXISTS "disciplinary_audit_log_select" ON public.disciplinary_audit_log;

-- ============================================================================
-- roster_periods - Keep: admin_all, select
-- ============================================================================

DROP POLICY IF EXISTS "roster_periods_admin_all" ON public.roster_periods;

-- ============================================================================
-- roster_reports - Keep: admin_all, select
-- ============================================================================

DROP POLICY IF EXISTS "roster_reports_admin_all" ON public.roster_reports;

-- ============================================================================
-- roster_period_capacity - Keep: admin_all, select
-- ============================================================================

DROP POLICY IF EXISTS "capacity_admin_all" ON public.roster_period_capacity;

-- ============================================================================
-- password_history - Keep: admin_view, user_access
-- ============================================================================

DROP POLICY IF EXISTS "password_history_admin_view" ON public.password_history;

-- ============================================================================
-- incident_types - Keep one select policy
-- ============================================================================

DROP POLICY IF EXISTS "incident_types_all" ON public.incident_types;
DROP POLICY IF EXISTS "incident_types_select" ON public.incident_types;

-- ============================================================================
-- digital_forms - Keep one select policy
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage forms" ON public.digital_forms;

-- ============================================================================
-- document_categories - Keep one select policy
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage document categories" ON public.document_categories;

-- ============================================================================
-- failed_login_attempts - Keep admin policies
-- ============================================================================

DROP POLICY IF EXISTS "failed_attempts_admin_delete" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "failed_attempts_admin_select" ON public.failed_login_attempts;

-- ============================================================================
-- certification_renewal_plans - Keep CRUD policies
-- ============================================================================

DROP POLICY IF EXISTS "renewal_plans_delete" ON public.certification_renewal_plans;
DROP POLICY IF EXISTS "renewal_plans_insert" ON public.certification_renewal_plans;
DROP POLICY IF EXISTS "renewal_plans_update" ON public.certification_renewal_plans;
DROP POLICY IF EXISTS "renewal_plans_select" ON public.certification_renewal_plans;

-- ============================================================================
-- renewal_plan_history - Keep select policy
-- ============================================================================

DROP POLICY IF EXISTS "renewal_history_select" ON public.renewal_plan_history;

-- ============================================================================
-- audit_logs - Keep: admin_read_all, authenticated_create
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_authenticated_create" ON public.audit_logs;

-- ============================================================================
-- feedback_likes - Policies already consolidated
-- ============================================================================

-- ============================================================================
-- Add back essential policies that were removed but are needed
-- ============================================================================

-- Pilots readable by authenticated users
CREATE POLICY "pilots_authenticated_read" ON public.pilots
  FOR SELECT TO authenticated
  USING (true);

-- Pilot checks readable by authenticated users
CREATE POLICY "pilot_checks_authenticated_read" ON public.pilot_checks
  FOR SELECT TO authenticated
  USING (true);

-- Check types readable by authenticated users
CREATE POLICY "check_types_authenticated_read" ON public.check_types
  FOR SELECT TO authenticated
  USING (true);

-- Contract types readable by authenticated users
CREATE POLICY "contract_types_authenticated_read" ON public.contract_types
  FOR SELECT TO authenticated
  USING (true);

-- Tasks readable by authenticated users
CREATE POLICY "tasks_authenticated_read" ON public.tasks
  FOR SELECT TO authenticated
  USING (true);

-- Notifications readable by own user - already have notifications_user_read_own

-- Roster periods readable by authenticated users
CREATE POLICY "roster_periods_authenticated_read" ON public.roster_periods
  FOR SELECT TO authenticated
  USING (true);

-- Roster reports readable by authenticated users
CREATE POLICY "roster_reports_authenticated_read" ON public.roster_reports
  FOR SELECT TO authenticated
  USING (true);

-- Roster capacity readable by authenticated users
CREATE POLICY "capacity_authenticated_read" ON public.roster_period_capacity
  FOR SELECT TO authenticated
  USING (true);

-- Task categories readable
CREATE POLICY "task_categories_authenticated_read" ON public.task_categories
  FOR SELECT TO authenticated
  USING (true);

-- Incident types readable
CREATE POLICY "incident_types_authenticated_read" ON public.incident_types
  FOR SELECT TO authenticated
  USING (true);

-- Task audit log readable
CREATE POLICY "task_audit_authenticated_read" ON public.task_audit_log
  FOR SELECT TO authenticated
  USING (true);

-- Disciplinary audit log readable
CREATE POLICY "disciplinary_audit_authenticated_read" ON public.disciplinary_audit_log
  FOR SELECT TO authenticated
  USING (true);

-- Feedback posts - approved posts viewable by all authenticated
CREATE POLICY "feedback_posts_approved_read" ON public.feedback_posts
  FOR SELECT TO authenticated
  USING (status::text = 'APPROVED');

-- Feedback comments on approved posts viewable
CREATE POLICY "feedback_comments_approved_read" ON public.feedback_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM feedback_posts
    WHERE id = feedback_comments.post_id
      AND status::text = 'APPROVED'
  ));

-- Feedback likes viewable
CREATE POLICY "feedback_likes_read" ON public.feedback_likes
  FOR SELECT TO authenticated
  USING (true);

-- Digital forms - active forms viewable
CREATE POLICY "digital_forms_active_read" ON public.digital_forms
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Document categories - active viewable
CREATE POLICY "document_categories_active_read" ON public.document_categories
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Certification renewal plans readable by authenticated
CREATE POLICY "renewal_plans_authenticated_read" ON public.certification_renewal_plans
  FOR SELECT TO authenticated
  USING (true);

-- Renewal plan history readable
CREATE POLICY "renewal_history_authenticated_read" ON public.renewal_plan_history
  FOR SELECT TO authenticated
  USING (true);

-- Audit logs readable by authenticated
CREATE POLICY "audit_logs_authenticated_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (true);

-- Audit logs insertable by authenticated
CREATE POLICY "audit_logs_authenticated_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Failed login attempts - admin only via service role or is_admin
CREATE POLICY "failed_attempts_admin_read" ON public.failed_login_attempts
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Pilot users - login authentication support (for public registration)
CREATE POLICY "pilot_users_public_read_for_login" ON public.pilot_users
  FOR SELECT TO public
  USING (registration_status = 'APPROVED');
