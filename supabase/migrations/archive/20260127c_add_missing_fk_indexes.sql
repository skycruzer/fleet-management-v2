-- Migration: Add Missing Foreign Key Indexes
-- Author: Maurice Rondeau
-- Date: 2026-01-27
-- Resolves: 15 unindexed_foreign_keys INFO issues

-- ============================================================================
-- Add indexes for foreign key columns missing coverage
-- ============================================================================

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- certification_renewal_plans
CREATE INDEX IF NOT EXISTS idx_certification_renewal_plans_check_type_id ON public.certification_renewal_plans(check_type_id);
CREATE INDEX IF NOT EXISTS idx_certification_renewal_plans_paired_pilot_id ON public.certification_renewal_plans(paired_pilot_id);

-- disciplinary_audit_log
CREATE INDEX IF NOT EXISTS idx_disciplinary_audit_log_matter_id ON public.disciplinary_audit_log(matter_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_audit_log_user_id ON public.disciplinary_audit_log(user_id);

-- disciplinary_matters
CREATE INDEX IF NOT EXISTS idx_disciplinary_matters_assigned_to ON public.disciplinary_matters(assigned_to);

-- feedback_comments
CREATE INDEX IF NOT EXISTS idx_feedback_comments_parent_comment_id ON public.feedback_comments(parent_comment_id);

-- leave_bids
CREATE INDEX IF NOT EXISTS idx_leave_bids_pilot_id ON public.leave_bids(pilot_id);

-- pilot_checks
CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type_id ON public.pilot_checks(check_type_id);

-- pilot_sessions
CREATE INDEX IF NOT EXISTS idx_pilot_sessions_pilot_user_id ON public.pilot_sessions(pilot_user_id);

-- roster_reports
CREATE INDEX IF NOT EXISTS idx_roster_reports_roster_period_code ON public.roster_reports(roster_period_code);

-- task_audit_log
CREATE INDEX IF NOT EXISTS idx_task_audit_log_task_id ON public.task_audit_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_audit_log_user_id ON public.task_audit_log(user_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- ============================================================================
-- Analyze affected tables
-- ============================================================================

ANALYZE public.audit_logs;
ANALYZE public.certification_renewal_plans;
ANALYZE public.disciplinary_audit_log;
ANALYZE public.disciplinary_matters;
ANALYZE public.feedback_comments;
ANALYZE public.leave_bids;
ANALYZE public.pilot_checks;
ANALYZE public.pilot_sessions;
ANALYZE public.roster_reports;
ANALYZE public.task_audit_log;
ANALYZE public.tasks;
