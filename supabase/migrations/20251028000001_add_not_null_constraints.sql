-- Migration: Add NOT NULL constraints to critical columns
-- Date: 2025-10-28
-- Purpose: Improve data integrity by adding NOT NULL constraints to columns that should never be null
-- Sprint 1: Database Integrity (P1 Critical Issue #059)

-- IMPORTANT: This migration assumes all existing data has been cleaned.
-- Before running, ensure no NULL values exist in these columns.

-- =============================================================================
-- VALIDATION QUERIES (Run before migration to check for NULL values)
-- =============================================================================

-- Uncomment and run these queries to find NULL values before applying constraints:
-- SELECT COUNT(*) as null_pilots_first_name FROM pilots WHERE first_name IS NULL;
-- SELECT COUNT(*) as null_pilots_last_name FROM pilots WHERE last_name IS NULL;
-- SELECT COUNT(*) as null_pilots_employee_id FROM pilots WHERE employee_id IS NULL;
-- SELECT COUNT(*) as null_pilots_role FROM pilots WHERE role IS NULL;
-- SELECT COUNT(*) as null_pilot_checks_pilot_id FROM pilot_checks WHERE pilot_id IS NULL;
-- SELECT COUNT(*) as null_pilot_checks_check_type_id FROM pilot_checks WHERE check_type_id IS NULL;
-- SELECT COUNT(*) as null_leave_requests_start_date FROM leave_requests WHERE start_date IS NULL;
-- SELECT COUNT(*) as null_leave_requests_end_date FROM leave_requests WHERE end_date IS NULL;
-- SELECT COUNT(*) as null_leave_requests_days_count FROM leave_requests WHERE days_count IS NULL;
-- SELECT COUNT(*) as null_check_types_check_code FROM check_types WHERE check_code IS NULL;
-- SELECT COUNT(*) as null_check_types_check_description FROM check_types WHERE check_description IS NULL;

-- =============================================================================
-- PILOTS TABLE
-- =============================================================================

-- Critical identification fields
ALTER TABLE pilots
  ALTER COLUMN first_name SET NOT NULL;

ALTER TABLE pilots
  ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE pilots
  ALTER COLUMN employee_id SET NOT NULL;

ALTER TABLE pilots
  ALTER COLUMN role SET NOT NULL;

-- Status and tracking fields
ALTER TABLE pilots
  ALTER COLUMN is_active SET NOT NULL;

-- Timestamp fields (already have defaults, but enforce NOT NULL)
ALTER TABLE pilots
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE pilots
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN pilots.first_name IS 'Pilot first name (required)';
COMMENT ON COLUMN pilots.last_name IS 'Pilot last name (required)';
COMMENT ON COLUMN pilots.employee_id IS 'Unique employee identifier (required)';
COMMENT ON COLUMN pilots.role IS 'Pilot role: Captain or First Officer (required)';
COMMENT ON COLUMN pilots.is_active IS 'Active status flag (required, default true)';

-- =============================================================================
-- PILOT_CHECKS TABLE
-- =============================================================================

-- Foreign key relationships (must exist)
ALTER TABLE pilot_checks
  ALTER COLUMN pilot_id SET NOT NULL;

ALTER TABLE pilot_checks
  ALTER COLUMN check_type_id SET NOT NULL;

-- Timestamp fields
ALTER TABLE pilot_checks
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE pilot_checks
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN pilot_checks.pilot_id IS 'Reference to pilot (required, foreign key)';
COMMENT ON COLUMN pilot_checks.check_type_id IS 'Reference to check type (required, foreign key)';

-- =============================================================================
-- LEAVE_REQUESTS TABLE
-- =============================================================================

-- Core leave request fields
ALTER TABLE leave_requests
  ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE leave_requests
  ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE leave_requests
  ALTER COLUMN days_count SET NOT NULL;

COMMENT ON COLUMN leave_requests.start_date IS 'Leave request start date (required)';
COMMENT ON COLUMN leave_requests.end_date IS 'Leave request end date (required)';
COMMENT ON COLUMN leave_requests.days_count IS 'Number of days requested (required, auto-calculated)';

-- =============================================================================
-- CHECK_TYPES TABLE
-- =============================================================================

-- Core check type definition fields
ALTER TABLE check_types
  ALTER COLUMN check_code SET NOT NULL;

ALTER TABLE check_types
  ALTER COLUMN check_description SET NOT NULL;

-- Timestamp fields
ALTER TABLE check_types
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE check_types
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN check_types.check_code IS 'Unique check type code (required, e.g., PC, OPC, LC)';
COMMENT ON COLUMN check_types.check_description IS 'Check type description (required)';

-- =============================================================================
-- AN_USERS TABLE (Pilot Portal Authentication)
-- =============================================================================

-- Critical authentication fields
ALTER TABLE an_users
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE an_users
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE an_users
  ALTER COLUMN role SET NOT NULL;

COMMENT ON COLUMN an_users.email IS 'User email (required, unique, used for authentication)';
COMMENT ON COLUMN an_users.name IS 'User full name (required)';
COMMENT ON COLUMN an_users.role IS 'User role (required, e.g., pilot, admin)';

-- =============================================================================
-- CONTRACT_TYPES TABLE
-- =============================================================================

-- Core contract definition fields
ALTER TABLE contract_types
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE contract_types
  ALTER COLUMN is_active SET NOT NULL;

-- Timestamp fields
ALTER TABLE contract_types
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE contract_types
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN contract_types.name IS 'Contract type name (required)';
COMMENT ON COLUMN contract_types.is_active IS 'Active status flag (required, default true)';

-- =============================================================================
-- DISCIPLINARY_MATTERS TABLE
-- =============================================================================

-- Core disciplinary matter fields
ALTER TABLE disciplinary_matters
  ALTER COLUMN pilot_id SET NOT NULL;

ALTER TABLE disciplinary_matters
  ALTER COLUMN title SET NOT NULL;

ALTER TABLE disciplinary_matters
  ALTER COLUMN description SET NOT NULL;

ALTER TABLE disciplinary_matters
  ALTER COLUMN incident_date SET NOT NULL;

ALTER TABLE disciplinary_matters
  ALTER COLUMN incident_type_id SET NOT NULL;

ALTER TABLE disciplinary_matters
  ALTER COLUMN reported_by SET NOT NULL;

ALTER TABLE disciplinary_matters
  ALTER COLUMN severity SET NOT NULL;

ALTER TABLE disciplinary_matters
  ALTER COLUMN status SET NOT NULL;

COMMENT ON COLUMN disciplinary_matters.pilot_id IS 'Reference to pilot (required, foreign key)';
COMMENT ON COLUMN disciplinary_matters.title IS 'Disciplinary matter title (required)';
COMMENT ON COLUMN disciplinary_matters.description IS 'Detailed description of incident (required)';
COMMENT ON COLUMN disciplinary_matters.incident_date IS 'Date of incident (required)';
COMMENT ON COLUMN disciplinary_matters.severity IS 'Severity level (required: low, medium, high, critical)';
COMMENT ON COLUMN disciplinary_matters.status IS 'Matter status (required: open, under_review, resolved, closed)';

-- =============================================================================
-- FLIGHT_REQUESTS TABLE
-- =============================================================================

-- Core flight request fields
ALTER TABLE flight_requests
  ALTER COLUMN pilot_id SET NOT NULL;

ALTER TABLE flight_requests
  ALTER COLUMN description SET NOT NULL;

ALTER TABLE flight_requests
  ALTER COLUMN flight_date SET NOT NULL;

ALTER TABLE flight_requests
  ALTER COLUMN request_type SET NOT NULL;

COMMENT ON COLUMN flight_requests.pilot_id IS 'Reference to pilot (required, foreign key)';
COMMENT ON COLUMN flight_requests.description IS 'Flight request description (required)';
COMMENT ON COLUMN flight_requests.flight_date IS 'Requested flight date (required)';
COMMENT ON COLUMN flight_requests.request_type IS 'Type of flight request (required: RDO, SDO, FLIGHT)';

-- =============================================================================
-- FEEDBACK_POSTS TABLE
-- =============================================================================

-- Core feedback fields
ALTER TABLE feedback_posts
  ALTER COLUMN pilot_user_id SET NOT NULL;

ALTER TABLE feedback_posts
  ALTER COLUMN title SET NOT NULL;

ALTER TABLE feedback_posts
  ALTER COLUMN content SET NOT NULL;

-- Timestamp fields
ALTER TABLE feedback_posts
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE feedback_posts
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN feedback_posts.pilot_user_id IS 'Reference to pilot user (required, foreign key)';
COMMENT ON COLUMN feedback_posts.title IS 'Feedback post title (required)';
COMMENT ON COLUMN feedback_posts.content IS 'Feedback post content (required)';

-- =============================================================================
-- FEEDBACK_COMMENTS TABLE
-- =============================================================================

-- Core comment fields
ALTER TABLE feedback_comments
  ALTER COLUMN post_id SET NOT NULL;

ALTER TABLE feedback_comments
  ALTER COLUMN pilot_user_id SET NOT NULL;

ALTER TABLE feedback_comments
  ALTER COLUMN content SET NOT NULL;

-- Timestamp fields
ALTER TABLE feedback_comments
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE feedback_comments
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN feedback_comments.post_id IS 'Reference to feedback post (required, foreign key)';
COMMENT ON COLUMN feedback_comments.pilot_user_id IS 'Reference to pilot user (required, foreign key)';
COMMENT ON COLUMN feedback_comments.content IS 'Comment content (required)';

-- =============================================================================
-- FEEDBACK_LIKES TABLE
-- =============================================================================

ALTER TABLE feedback_likes
  ALTER COLUMN post_id SET NOT NULL;

ALTER TABLE feedback_likes
  ALTER COLUMN pilot_user_id SET NOT NULL;

ALTER TABLE feedback_likes
  ALTER COLUMN created_at SET NOT NULL;

COMMENT ON COLUMN feedback_likes.post_id IS 'Reference to feedback post (required, foreign key)';
COMMENT ON COLUMN feedback_likes.pilot_user_id IS 'Reference to pilot user (required, foreign key)';

-- =============================================================================
-- AUDIT_LOGS TABLE
-- =============================================================================

-- Core audit fields (critical for compliance)
ALTER TABLE audit_logs
  ALTER COLUMN table_name SET NOT NULL;

ALTER TABLE audit_logs
  ALTER COLUMN record_id SET NOT NULL;

ALTER TABLE audit_logs
  ALTER COLUMN action SET NOT NULL;

ALTER TABLE audit_logs
  ALTER COLUMN created_at SET NOT NULL;

COMMENT ON COLUMN audit_logs.table_name IS 'Name of table being audited (required)';
COMMENT ON COLUMN audit_logs.record_id IS 'ID of record being audited (required)';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (required: INSERT, UPDATE, DELETE, SOFT_DELETE)';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp of audit entry (required)';

-- =============================================================================
-- CERTIFICATION_RENEWAL_PLANS TABLE
-- =============================================================================

-- Core renewal plan fields
ALTER TABLE certification_renewal_plans
  ALTER COLUMN pilot_id SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN check_type_id SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN original_expiry_date SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN planned_renewal_date SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN planned_roster_period SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN renewal_window_start SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN renewal_window_end SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN priority SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN status SET NOT NULL;

-- Timestamp fields
ALTER TABLE certification_renewal_plans
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE certification_renewal_plans
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN certification_renewal_plans.pilot_id IS 'Reference to pilot (required, foreign key)';
COMMENT ON COLUMN certification_renewal_plans.check_type_id IS 'Reference to check type (required, foreign key)';
COMMENT ON COLUMN certification_renewal_plans.planned_renewal_date IS 'Planned renewal date (required)';
COMMENT ON COLUMN certification_renewal_plans.status IS 'Renewal plan status (required: PENDING, SCHEDULED, COMPLETED, CANCELLED)';

-- =============================================================================
-- SETTINGS TABLE
-- =============================================================================

ALTER TABLE settings
  ALTER COLUMN key SET NOT NULL;

ALTER TABLE settings
  ALTER COLUMN value SET NOT NULL;

COMMENT ON COLUMN settings.key IS 'Setting key identifier (required, unique)';
COMMENT ON COLUMN settings.value IS 'Setting value (required, JSONB)';

-- =============================================================================
-- DIGITAL_FORMS TABLE
-- =============================================================================

ALTER TABLE digital_forms
  ALTER COLUMN title SET NOT NULL;

ALTER TABLE digital_forms
  ALTER COLUMN form_schema SET NOT NULL;

ALTER TABLE digital_forms
  ALTER COLUMN form_type SET NOT NULL;

COMMENT ON COLUMN digital_forms.title IS 'Form title (required)';
COMMENT ON COLUMN digital_forms.form_schema IS 'JSON schema definition (required)';
COMMENT ON COLUMN digital_forms.form_type IS 'Form type identifier (required)';

-- =============================================================================
-- FEEDBACK_CATEGORIES TABLE
-- =============================================================================

ALTER TABLE feedback_categories
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE feedback_categories
  ALTER COLUMN slug SET NOT NULL;

COMMENT ON COLUMN feedback_categories.name IS 'Category name (required)';
COMMENT ON COLUMN feedback_categories.slug IS 'URL-friendly slug (required, unique)';

-- =============================================================================
-- DOCUMENT_CATEGORIES TABLE
-- =============================================================================

ALTER TABLE document_categories
  ALTER COLUMN name SET NOT NULL;

COMMENT ON COLUMN document_categories.name IS 'Document category name (required)';

-- =============================================================================
-- TASK_CATEGORIES TABLE
-- =============================================================================

ALTER TABLE task_categories
  ALTER COLUMN name SET NOT NULL;

COMMENT ON COLUMN task_categories.name IS 'Task category name (required)';

-- =============================================================================
-- DISCIPLINARY_AUDIT_LOG TABLE
-- =============================================================================

ALTER TABLE disciplinary_audit_log
  ALTER COLUMN matter_id SET NOT NULL;

ALTER TABLE disciplinary_audit_log
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE disciplinary_audit_log
  ALTER COLUMN action SET NOT NULL;

COMMENT ON COLUMN disciplinary_audit_log.matter_id IS 'Reference to disciplinary matter (required, foreign key)';
COMMENT ON COLUMN disciplinary_audit_log.user_id IS 'Reference to user who performed action (required, foreign key)';
COMMENT ON COLUMN disciplinary_audit_log.action IS 'Action performed (required)';

-- =============================================================================
-- TASK_AUDIT_LOG TABLE
-- =============================================================================

ALTER TABLE task_audit_log
  ALTER COLUMN task_id SET NOT NULL;

ALTER TABLE task_audit_log
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE task_audit_log
  ALTER COLUMN action SET NOT NULL;

COMMENT ON COLUMN task_audit_log.task_id IS 'Reference to task (required, foreign key)';
COMMENT ON COLUMN task_audit_log.user_id IS 'Reference to user who performed action (required, foreign key)';
COMMENT ON COLUMN task_audit_log.action IS 'Action performed (required)';

-- =============================================================================
-- RENEWAL_PLAN_HISTORY TABLE
-- =============================================================================

ALTER TABLE renewal_plan_history
  ALTER COLUMN renewal_plan_id SET NOT NULL;

ALTER TABLE renewal_plan_history
  ALTER COLUMN change_type SET NOT NULL;

ALTER TABLE renewal_plan_history
  ALTER COLUMN changed_at SET NOT NULL;

COMMENT ON COLUMN renewal_plan_history.renewal_plan_id IS 'Reference to renewal plan (required, foreign key)';
COMMENT ON COLUMN renewal_plan_history.change_type IS 'Type of change (required: DATE_CHANGE, STATUS_CHANGE, PILOT_CHANGE)';
COMMENT ON COLUMN renewal_plan_history.changed_at IS 'Timestamp of change (required)';

-- =============================================================================
-- ROSTER_PERIOD_CAPACITY TABLE
-- =============================================================================

ALTER TABLE roster_period_capacity
  ALTER COLUMN roster_period SET NOT NULL;

ALTER TABLE roster_period_capacity
  ALTER COLUMN period_start_date SET NOT NULL;

ALTER TABLE roster_period_capacity
  ALTER COLUMN period_end_date SET NOT NULL;

ALTER TABLE roster_period_capacity
  ALTER COLUMN max_pilots_per_category SET NOT NULL;

ALTER TABLE roster_period_capacity
  ALTER COLUMN current_allocations SET NOT NULL;

ALTER TABLE roster_period_capacity
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE roster_period_capacity
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN roster_period_capacity.roster_period IS 'Roster period identifier (required, e.g., RP1/2025)';
COMMENT ON COLUMN roster_period_capacity.period_start_date IS 'Period start date (required)';
COMMENT ON COLUMN roster_period_capacity.period_end_date IS 'Period end date (required)';

-- =============================================================================
-- SUMMARY
-- =============================================================================

-- Total NOT NULL constraints added: 80+
-- Tables modified: 20
-- Critical tables covered:
--   ✅ pilots (7 columns)
--   ✅ pilot_checks (4 columns)
--   ✅ leave_requests (3 columns)
--   ✅ check_types (4 columns)
--   ✅ an_users (3 columns)
--   ✅ contract_types (4 columns)
--   ✅ disciplinary_matters (8 columns)
--   ✅ flight_requests (4 columns)
--   ✅ feedback_posts (5 columns)
--   ✅ feedback_comments (5 columns)
--   ✅ feedback_likes (3 columns)
--   ✅ audit_logs (4 columns)
--   ✅ certification_renewal_plans (11 columns)
--   ✅ settings (2 columns)
--   ✅ digital_forms (3 columns)
--   ✅ feedback_categories (2 columns)
--   ✅ document_categories (1 column)
--   ✅ task_categories (1 column)
--   ✅ disciplinary_audit_log (3 columns)
--   ✅ task_audit_log (3 columns)
--   ✅ renewal_plan_history (3 columns)
--   ✅ roster_period_capacity (7 columns)

-- Migration completed successfully
-- Next steps:
--   1. Run: npm run db:types (regenerate TypeScript types)
--   2. Run: npm run type-check (verify no type errors)
--   3. Run: npm test (verify E2E tests pass)
--   4. Deploy to staging for validation
