-- Migration: Drop Unused Indexes (Part 3)
-- Author: Maurice Rondeau
-- Date: 2026-01-27
-- Resolves: 38 unused indexes with 0 scans

-- ============================================================================
-- Drop clearly redundant unused indexes (0 scans, not FK-critical)
-- ============================================================================

-- Audit/logging tables - rarely queried by these columns alone
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_disciplinary_audit_log_action;
DROP INDEX IF EXISTS public.idx_disciplinary_audit_timestamp;
DROP INDEX IF EXISTS public.idx_disciplinary_audit_log_user_id;
DROP INDEX IF EXISTS public.idx_task_audit_log_action;
DROP INDEX IF EXISTS public.idx_task_audit_log_timestamp;
DROP INDEX IF EXISTS public.idx_task_audit_log_user_id;
DROP INDEX IF EXISTS public.idx_renewal_history_change_type;
DROP INDEX IF EXISTS public.idx_renewal_history_changed_at;

-- Display order indexes - rarely used for filtering
DROP INDEX IF EXISTS public.idx_document_categories_display_order;
DROP INDEX IF EXISTS public.idx_feedback_categories_display_order;

-- Date/time indexes covered by composite indexes or rarely queried alone
DROP INDEX IF EXISTS public.idx_digital_forms_created_at;
DROP INDEX IF EXISTS public.idx_feedback_comments_created;
DROP INDEX IF EXISTS public.idx_leave_bids_submitted_at;
DROP INDEX IF EXISTS public.idx_pilot_ebt_assessments_date;
DROP INDEX IF EXISTS public.idx_roster_reports_sent;

-- Status indexes - usually part of composite queries
DROP INDEX IF EXISTS public.idx_feedback_categories_active;
DROP INDEX IF EXISTS public.idx_leave_bids_status;
DROP INDEX IF EXISTS public.idx_pilot_feedback_status;
DROP INDEX IF EXISTS public.idx_feedback_posts_pending;

-- Upvotes/priority - rarely filtered alone
DROP INDEX IF EXISTS public.idx_feedback_posts_upvotes;
DROP INDEX IF EXISTS public.idx_tasks_priority;

-- Parent/hierarchy indexes on small tables
DROP INDEX IF EXISTS public.idx_feedback_comments_parent;
DROP INDEX IF EXISTS public.idx_tasks_parent;

-- Approval indexes - covered by status queries
DROP INDEX IF EXISTS public.idx_digital_forms_requires_approval;
DROP INDEX IF EXISTS public.idx_pilot_requests_approval_checklist;

-- IP address index - rarely queried
DROP INDEX IF EXISTS public.idx_failed_login_attempts_ip;

-- Role indexes on small tables
DROP INDEX IF EXISTS public.idx_an_users_role;

-- Session expiry (covered by composite or cleanup jobs)
DROP INDEX IF EXISTS public.idx_admin_sessions_expiry;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_expires_at;

-- Deadline indexes - covered by composite indexes
DROP INDEX IF EXISTS public.idx_roster_periods_deadline;
DROP INDEX IF EXISTS public.idx_pilot_requests_deadline_pending;

-- Date of birth/commencement - rarely filtered
DROP INDEX IF EXISTS public.idx_pilots_date_of_birth;
DROP INDEX IF EXISTS public.idx_pilots_commencement_date;

-- Licence type - small table, seq scan is fine
DROP INDEX IF EXISTS public.idx_pilots_licence_type;

-- Form type - small table
DROP INDEX IF EXISTS public.idx_digital_forms_form_type;

-- Severity - usually part of status queries
DROP INDEX IF EXISTS public.idx_disciplinary_matters_severity;

-- Submission date - covered by created_at patterns
DROP INDEX IF EXISTS public.idx_pilot_requests_submission_date;

-- ============================================================================
-- Analyze affected tables
-- ============================================================================

ANALYZE public.audit_logs;
ANALYZE public.disciplinary_audit_log;
ANALYZE public.task_audit_log;
ANALYZE public.renewal_plan_history;
ANALYZE public.document_categories;
ANALYZE public.feedback_categories;
ANALYZE public.digital_forms;
ANALYZE public.feedback_comments;
ANALYZE public.leave_bids;
ANALYZE public.pilot_ebt_assessments;
ANALYZE public.roster_reports;
ANALYZE public.pilot_feedback;
ANALYZE public.feedback_posts;
ANALYZE public.tasks;
ANALYZE public.failed_login_attempts;
ANALYZE public.an_users;
ANALYZE public.admin_sessions;
ANALYZE public.password_reset_tokens;
ANALYZE public.roster_periods;
ANALYZE public.pilot_requests;
ANALYZE public.pilots;
ANALYZE public.disciplinary_matters;

-- ============================================================================
-- Part 2: Additional unused indexes dropped
-- ============================================================================

-- Audit tables - complex composites not being used
DROP INDEX IF EXISTS public.idx_audit_logs_table_record;
DROP INDEX IF EXISTS public.idx_audit_logs_user_table;
DROP INDEX IF EXISTS public.idx_disciplinary_audit_matter;
DROP INDEX IF EXISTS public.idx_task_audit_log_task_id;

-- Certification renewal plans - complex unused composites
DROP INDEX IF EXISTS public.idx_certification_renewal_plans_priority;
DROP INDEX IF EXISTS public.idx_renewal_plans_period_category_pairing;

-- Check types - small table
DROP INDEX IF EXISTS public.idx_check_types_category;

-- Disciplinary - redundant with FK indexes
DROP INDEX IF EXISTS public.idx_disciplinary_matters_active;
DROP INDEX IF EXISTS public.idx_disciplinary_assigned;

-- Pilot checks - redundant composites
DROP INDEX IF EXISTS public.idx_pilot_checks_pilot_date;
DROP INDEX IF EXISTS public.idx_pilot_checks_type_expiry_pilot;

-- Dashboard metrics - single row table
DROP INDEX IF EXISTS public.idx_pilot_dashboard_metrics_version;

-- Leave bids - redundant
DROP INDEX IF EXISTS public.idx_leave_bids_pilot_period;
DROP INDEX IF EXISTS public.idx_leave_bid_options_dates;

-- Pilot users - redundant with other indexes
DROP INDEX IF EXISTS public.idx_pilot_users_pending_approval;

-- Pilots - complex composite
DROP INDEX IF EXISTS public.idx_pilots_active_role_seniority;

-- Roster reports - small table
DROP INDEX IF EXISTS public.idx_roster_reports_period;

-- Tasks - redundant
DROP INDEX IF EXISTS public.idx_tasks_assigned_status;
DROP INDEX IF EXISTS public.idx_tasks_due_date;

-- Pilot sessions - redundant
DROP INDEX IF EXISTS public.idx_pilot_sessions_user_active;
DROP INDEX IF EXISTS public.idx_pilot_sessions_user_expires;

-- Pilot requests - redundant composite
DROP INDEX IF EXISTS public.idx_pilot_requests_rank_period_status;

-- Re-analyze
ANALYZE public.audit_logs;
ANALYZE public.disciplinary_audit_log;
ANALYZE public.task_audit_log;
ANALYZE public.certification_renewal_plans;
ANALYZE public.check_types;
ANALYZE public.disciplinary_matters;
ANALYZE public.pilot_checks;
ANALYZE public.pilot_dashboard_metrics;
ANALYZE public.leave_bids;
ANALYZE public.leave_bid_options;
ANALYZE public.pilot_users;
ANALYZE public.pilots;
ANALYZE public.roster_reports;
ANALYZE public.tasks;
ANALYZE public.pilot_sessions;
ANALYZE public.pilot_requests;
