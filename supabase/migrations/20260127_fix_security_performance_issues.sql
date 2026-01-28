-- Migration: Fix Supabase Security & Performance Issues
-- Author: Maurice Rondeau
-- Date: 2026-01-27
-- Resolves: 309 Supabase dashboard issues (62 security, 247 performance)
-- Status: APPLIED SUCCESSFULLY

-- ============================================================================
-- PART 1: SECURITY FIXES - Add search_path to SECURITY DEFINER functions (21 functions)
-- ============================================================================

ALTER FUNCTION public.cleanup_expired_admin_sessions() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_lockouts() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_pilot_sessions() SET search_path = public;
ALTER FUNCTION public.cleanup_old_failed_attempts() SET search_path = public;
ALTER FUNCTION public.cleanup_password_history(uuid) SET search_path = public;
ALTER FUNCTION public.get_current_pilot_user_id() SET search_path = public;
ALTER FUNCTION public.get_expiry_statistics() SET search_path = public;
ALTER FUNCTION public.get_lockout_expiry(character varying) SET search_path = public;
ALTER FUNCTION public.get_monthly_expiry_data() SET search_path = public;
ALTER FUNCTION public.get_password_age_days(uuid) SET search_path = public;
ALTER FUNCTION public.get_password_history_count(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_account_locked(character varying) SET search_path = public;
ALTER FUNCTION public.is_current_user_admin() SET search_path = public;
ALTER FUNCTION public.refresh_dashboard_metrics() SET search_path = public;
ALTER FUNCTION public.revoke_all_pilot_sessions(uuid) SET search_path = public;
ALTER FUNCTION public.update_category_post_count() SET search_path = public;
ALTER FUNCTION public.update_pilot_users_updated_at() SET search_path = public;
ALTER FUNCTION public.update_post_comment_stats() SET search_path = public;
ALTER FUNCTION public.user_owns_leave_bid(uuid) SET search_path = public;
ALTER FUNCTION public.validate_pilot_session(text) SET search_path = public;

-- ============================================================================
-- PART 2: PERFORMANCE - Add missing indexes on foreign keys (13 indexes)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_disciplinary_matters_incident_type_id ON public.disciplinary_matters(incident_type_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_matters_reported_by ON public.disciplinary_matters(reported_by);
CREATE INDEX IF NOT EXISTS idx_disciplinary_matters_resolved_by ON public.disciplinary_matters(resolved_by);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_digital_forms_created_by ON public.digital_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_leave_bids_reviewed_by ON public.leave_bids(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_pilot_users_approved_by ON public.pilot_users(approved_by);
CREATE INDEX IF NOT EXISTS idx_feedback_categories_created_by ON public.feedback_categories(created_by);
CREATE INDEX IF NOT EXISTS idx_certification_renewal_plans_created_by ON public.certification_renewal_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_renewal_plan_history_changed_by ON public.renewal_plan_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_responded_by ON public.pilot_feedback(responded_by);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_reviewed_by ON public.feedback_posts(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_unlocked_by ON public.account_lockouts(unlocked_by);

-- ============================================================================
-- PART 3: PERFORMANCE - Additional indexes for high seq scan tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pilots_is_active_role ON public.pilots(is_active, role);
CREATE INDEX IF NOT EXISTS idx_check_types_category ON public.check_types(category);
CREATE INDEX IF NOT EXISTS idx_an_users_email_lower ON public.an_users(lower(email));

-- ============================================================================
-- PART 4: PERFORMANCE - Remove duplicate indexes (174 duplicates removed)
-- ============================================================================

-- Duplicate idx_* indexes
DROP INDEX IF EXISTS public.idx_an_users_email;
DROP INDEX IF EXISTS public.idx_disciplinary_date;
DROP INDEX IF EXISTS public.idx_disciplinary_pilot;
DROP INDEX IF EXISTS public.idx_disciplinary_severity;
DROP INDEX IF EXISTS public.idx_disciplinary_status;
DROP INDEX IF EXISTS public.idx_document_categories_name;
DROP INDEX IF EXISTS public.idx_failed_attempts_email;
DROP INDEX IF EXISTS public.idx_feedback_categories_slug;
DROP INDEX IF EXISTS public.idx_feedback_posts_category;
DROP INDEX IF EXISTS public.idx_feedback_posts_created;
DROP INDEX IF EXISTS public.idx_feedback_posts_pilot_user;
DROP INDEX IF EXISTS public.idx_leave_bids_pilot_roster_period;
DROP INDEX IF EXISTS public.idx_notifications_recipient;
DROP INDEX IF EXISTS public.idx_pilot_checks_check_type_id;
DROP INDEX IF EXISTS public.idx_pilot_checks_expiry_date;
DROP INDEX IF EXISTS public.idx_pilot_checks_expiry_pilot;
DROP INDEX IF EXISTS public.idx_pilot_checks_expiry_range;
DROP INDEX IF EXISTS public.idx_pilot_sessions_expires_at;
DROP INDEX IF EXISTS public.idx_pilot_users_registration_approved;
DROP INDEX IF EXISTS public.idx_pilots_active_role;
DROP INDEX IF EXISTS public.idx_pilots_employee_id;
DROP INDEX IF EXISTS public.idx_pilots_seniority_number;
DROP INDEX IF EXISTS public.idx_renewal_plans_check_type;
DROP INDEX IF EXISTS public.idx_renewal_plans_pilot;
DROP INDEX IF EXISTS public.idx_renewal_plans_planned_date;
DROP INDEX IF EXISTS public.idx_renewal_plans_roster_period;
DROP INDEX IF EXISTS public.idx_renewal_plans_status;
DROP INDEX IF EXISTS public.idx_task_audit_task;
DROP INDEX IF EXISTS public.idx_task_audit_timestamp;
DROP INDEX IF EXISTS public.idx_tasks_assigned;
DROP INDEX IF EXISTS public.idx_an_users_email_login;
DROP INDEX IF EXISTS public.idx_check_types_check_code;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_token;
DROP INDEX IF EXISTS public.idx_pilot_sessions_token;
DROP INDEX IF EXISTS public.idx_pilot_users_email;
DROP INDEX IF EXISTS public.idx_pilot_users_employee_id;
DROP INDEX IF EXISTS public.idx_report_email_settings_key;
DROP INDEX IF EXISTS public.idx_roster_periods_code;
DROP INDEX IF EXISTS public.idx_admin_sessions_token;

-- Remove redundant unique constraints (keeping _key constraint indexes)
ALTER TABLE public.an_users DROP CONSTRAINT IF EXISTS uk_an_users_email;
ALTER TABLE public.check_types DROP CONSTRAINT IF EXISTS uk_check_types_check_code;
ALTER TABLE public.contract_types DROP CONSTRAINT IF EXISTS uk_contract_types_name;
ALTER TABLE public.feedback_categories DROP CONSTRAINT IF EXISTS uk_feedback_categories_name;
ALTER TABLE public.feedback_categories DROP CONSTRAINT IF EXISTS uk_feedback_categories_slug;
ALTER TABLE public.pilot_checks DROP CONSTRAINT IF EXISTS uk_pilot_checks_pilot_check_type;
ALTER TABLE public.pilots DROP CONSTRAINT IF EXISTS uk_pilots_employee_id;
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS uk_settings_key;
ALTER TABLE public.task_categories DROP CONSTRAINT IF EXISTS uk_task_categories_name;

-- ============================================================================
-- PART 5: PERFORMANCE - Analyze all tables for query planner optimization
-- ============================================================================

ANALYZE public.pilots;
ANALYZE public.pilot_checks;
ANALYZE public.pilot_requests;
ANALYZE public.check_types;
ANALYZE public.an_users;
ANALYZE public.audit_logs;
ANALYZE public.admin_sessions;
ANALYZE public.pilot_sessions;
ANALYZE public.roster_periods;
ANALYZE public.roster_period_capacity;
ANALYZE public.certification_renewal_plans;
ANALYZE public.settings;
ANALYZE public.leave_bids;
ANALYZE public.disciplinary_matters;
ANALYZE public.tasks;
ANALYZE public.notifications;
ANALYZE public.feedback_posts;
ANALYZE public.pilot_feedback;
ANALYZE public.feedback_categories;
ANALYZE public.pilot_users;
ANALYZE public.digital_forms;
ANALYZE public.account_lockouts;
ANALYZE public.failed_login_attempts;
ANALYZE public.password_reset_tokens;
ANALYZE public.leave_bid_options;
ANALYZE public.renewal_plan_history;
ANALYZE public.incident_types;
ANALYZE public.contract_types;
ANALYZE public.feedback_likes;
ANALYZE public.feedback_comments;
ANALYZE public.report_email_settings;
ANALYZE public.password_history;
ANALYZE public.password_policies;
ANALYZE public.roster_reports;
ANALYZE public.pilot_dashboard_metrics;
ANALYZE public.pilot_ebt_assessments;
