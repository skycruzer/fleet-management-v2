-- Migration: Remove Redundant Indexes (Part 2)
-- Author: Maurice Rondeau
-- Date: 2026-01-27
-- Resolves: ~57 remaining redundant indexes covered by composite indexes

-- ============================================================================
-- PART 1: Drop non-unique redundant indexes (55 indexes)
-- ============================================================================

-- account_lockouts (covered by idx_lockouts_active)
DROP INDEX IF EXISTS public.idx_lockouts_email;
DROP INDEX IF EXISTS public.idx_lockouts_locked_until;

-- audit_logs (covered by composite indexes)
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_audit_logs_record_id;
DROP INDEX IF EXISTS public.idx_audit_logs_table_name;
DROP INDEX IF EXISTS public.idx_audit_logs_user_created;
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;

-- certification_renewal_plans (covered by composite/unique indexes)
DROP INDEX IF EXISTS public.idx_certification_renewal_plans_check_type_id;
DROP INDEX IF EXISTS public.idx_certification_renewal_plans_pilot_id;
DROP INDEX IF EXISTS public.idx_certification_renewal_plans_planned_date;
DROP INDEX IF EXISTS public.idx_certification_renewal_plans_roster_period;
DROP INDEX IF EXISTS public.idx_certification_renewal_plans_status;
DROP INDEX IF EXISTS public.idx_renewal_plans_pair_group;
DROP INDEX IF EXISTS public.idx_renewal_plans_paired_pilot;
DROP INDEX IF EXISTS public.idx_renewal_plans_pairing_status;

-- disciplinary_matters (covered by idx_disciplinary_matters_active)
DROP INDEX IF EXISTS public.idx_disciplinary_matters_incident_date;
DROP INDEX IF EXISTS public.idx_disciplinary_matters_status;

-- failed_login_attempts (covered by idx_failed_attempts_email_timestamp)
DROP INDEX IF EXISTS public.idx_failed_attempts_timestamp;
DROP INDEX IF EXISTS public.idx_failed_login_attempts_email;

-- feedback_likes (covered by unique indexes)
DROP INDEX IF EXISTS public.idx_feedback_likes_post;
DROP INDEX IF EXISTS public.idx_feedback_likes_user;

-- feedback_posts (covered by idx_feedback_posts_pending)
DROP INDEX IF EXISTS public.idx_feedback_posts_created_at;
DROP INDEX IF EXISTS public.idx_feedback_posts_status;

-- leave_bids (covered by idx_leave_bids_pilot_period)
DROP INDEX IF EXISTS public.idx_leave_bids_pilot_id;
DROP INDEX IF EXISTS public.idx_leave_bids_roster_period;

-- notifications (covered by composite indexes)
DROP INDEX IF EXISTS public.idx_notifications_created_at;
DROP INDEX IF EXISTS public.idx_notifications_recipient_id;
DROP INDEX IF EXISTS public.idx_notifications_unread;

-- password_history (covered by idx_password_history_user_created)
DROP INDEX IF EXISTS public.idx_password_history_created_at;
DROP INDEX IF EXISTS public.idx_password_history_user_id;

-- pilot_checks (covered by composite indexes)
DROP INDEX IF EXISTS public.idx_pilot_checks_check_type;
DROP INDEX IF EXISTS public.idx_pilot_checks_expiring_soon;
DROP INDEX IF EXISTS public.idx_pilot_checks_expiry;
DROP INDEX IF EXISTS public.idx_pilot_checks_pilot_expiry;
DROP INDEX IF EXISTS public.idx_pilot_checks_pilot_id;

-- pilot_requests (covered by composite indexes)
DROP INDEX IF EXISTS public.idx_pilot_requests_category_status;
DROP INDEX IF EXISTS public.idx_pilot_requests_created_at;
DROP INDEX IF EXISTS public.idx_pilot_requests_date_range;
DROP INDEX IF EXISTS public.idx_pilot_requests_deadline;
DROP INDEX IF EXISTS public.idx_pilot_requests_pilot_id;
DROP INDEX IF EXISTS public.idx_pilot_requests_pilot_workflow;
DROP INDEX IF EXISTS public.idx_pilot_requests_roster_period;
DROP INDEX IF EXISTS public.idx_pilot_requests_status;

-- pilot_sessions (covered by composite indexes)
DROP INDEX IF EXISTS public.idx_pilot_sessions_expiry;
DROP INDEX IF EXISTS public.idx_pilot_sessions_pilot_user_id;

-- pilots (covered by composite indexes)
DROP INDEX IF EXISTS public.idx_pilots_first_name;
DROP INDEX IF EXISTS public.idx_pilots_is_active;
DROP INDEX IF EXISTS public.idx_pilots_is_active_role;
DROP INDEX IF EXISTS public.idx_pilots_last_name;
DROP INDEX IF EXISTS public.idx_pilots_role;
DROP INDEX IF EXISTS public.idx_pilots_role_seniority;
DROP INDEX IF EXISTS public.idx_pilots_seniority_role;

-- roster_periods (covered by roster_periods_period_number_year_key)
DROP INDEX IF EXISTS public.idx_roster_periods_year;

-- tasks (covered by idx_tasks_assigned_status)
DROP INDEX IF EXISTS public.idx_tasks_assigned_to;
DROP INDEX IF EXISTS public.idx_tasks_status;

-- ============================================================================
-- PART 2: Drop constraint-backed unique indexes (2 indexes)
-- These require ALTER TABLE DROP CONSTRAINT
-- ============================================================================

-- pilot_checks unique constraint (covered by idx_pilot_checks_type_expiry_pilot)
ALTER TABLE public.pilot_checks DROP CONSTRAINT IF EXISTS pilot_checks_pilot_id_check_type_id_key;

-- uk_pilots_seniority_number is a unique index without constraint - drop directly
DROP INDEX IF EXISTS public.uk_pilots_seniority_number;

-- ============================================================================
-- PART 3: Re-analyze affected tables
-- ============================================================================

ANALYZE public.account_lockouts;
ANALYZE public.audit_logs;
ANALYZE public.certification_renewal_plans;
ANALYZE public.disciplinary_matters;
ANALYZE public.failed_login_attempts;
ANALYZE public.feedback_likes;
ANALYZE public.feedback_posts;
ANALYZE public.leave_bids;
ANALYZE public.notifications;
ANALYZE public.password_history;
ANALYZE public.pilot_checks;
ANALYZE public.pilot_requests;
ANALYZE public.pilot_sessions;
ANALYZE public.pilots;
ANALYZE public.roster_periods;
ANALYZE public.tasks;
