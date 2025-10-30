-- ============================================================================
-- PERFORMANCE INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================
-- Sprint 2: Performance Optimization - Week 3, Day 3
-- Purpose: Add database indexes to optimize frequently queried columns
-- Target: 60% faster query performance on filtered/sorted queries
--
-- Based on analysis of:
-- - 29 service files with database queries
-- - Common WHERE clauses, JOIN conditions, ORDER BY columns
-- - Slow query patterns identified in production
--
-- Developer: Maurice Rondeau
-- Date: October 27, 2025
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- PILOTS TABLE INDEXES
-- ============================================================================

-- Index for active pilot filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_pilots_is_active
ON pilots(is_active)
WHERE is_active = true;

-- Index for role-based filtering
CREATE INDEX IF NOT EXISTS idx_pilots_role
ON pilots(role);

-- Composite index for active pilots by role (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_pilots_active_role
ON pilots(is_active, role)
WHERE is_active = true;

-- Index for seniority-based sorting
CREATE INDEX IF NOT EXISTS idx_pilots_seniority
ON pilots(seniority_number)
WHERE seniority_number IS NOT NULL;

-- Index for retirement calculations (date_of_birth filtering)
CREATE INDEX IF NOT EXISTS idx_pilots_date_of_birth
ON pilots(date_of_birth)
WHERE date_of_birth IS NOT NULL;

-- Index for name searches (first_name, last_name)
CREATE INDEX IF NOT EXISTS idx_pilots_names
ON pilots(last_name, first_name);

-- Index for employee_id lookups
CREATE INDEX IF NOT EXISTS idx_pilots_employee_id
ON pilots(employee_id);

-- Index for commencement_date (seniority calculations)
CREATE INDEX IF NOT EXISTS idx_pilots_commencement_date
ON pilots(commencement_date)
WHERE commencement_date IS NOT NULL;

-- ============================================================================
-- PILOT_CHECKS TABLE INDEXES
-- ============================================================================

-- Index for expiry date filtering (most critical for compliance)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date
ON pilot_checks(expiry_date)
WHERE expiry_date IS NOT NULL;

-- Composite index for expiring checks (common alert query)
-- NOTE: Removed WHERE clause with CURRENT_DATE (not immutable)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiring_soon
ON pilot_checks(expiry_date, pilot_id)
WHERE expiry_date IS NOT NULL;

-- Index for pilot-specific check lookups
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_id
ON pilot_checks(pilot_id);

-- Index for check type filtering
CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type_id
ON pilot_checks(check_type_id);

-- Composite index for pilot checks with expiry (detailed queries)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_expiry
ON pilot_checks(pilot_id, expiry_date)
WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- LEAVE_REQUESTS TABLE INDEXES
-- ============================================================================

-- Index for status filtering (most common)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status
ON leave_requests(status);

-- Index for pending requests (dashboard alerts)
CREATE INDEX IF NOT EXISTS idx_leave_requests_pending
ON leave_requests(status, created_at DESC)
WHERE status = 'PENDING';

-- Index for pilot-specific leave requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_id
ON leave_requests(pilot_id);

-- Index for pilot_user_id (pilot portal queries)
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_user_id
ON leave_requests(pilot_user_id)
WHERE pilot_user_id IS NOT NULL;

-- Composite index for pilot leave by status
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_status
ON leave_requests(pilot_id, status);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
ON leave_requests(start_date, end_date);

-- Index for current month filtering
-- NOTE: Removed WHERE clause with CURRENT_DATE (not immutable)
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_month
ON leave_requests(created_at DESC);

-- ============================================================================
-- FLIGHT_REQUESTS TABLE INDEXES
-- ============================================================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_flight_requests_status
ON flight_requests(status);

-- Index for pilot-specific flight requests
CREATE INDEX IF NOT EXISTS idx_flight_requests_pilot_id
ON flight_requests(pilot_id);

-- Composite index for pilot flight requests by status
CREATE INDEX IF NOT EXISTS idx_flight_requests_pilot_status
ON flight_requests(pilot_id, status);

-- Index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_flight_requests_created_at
ON flight_requests(created_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- Index for recipient filtering (most common)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id
ON notifications(recipient_id);

-- Index for unread notifications (high priority)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(recipient_id, created_at DESC)
WHERE read = false;

-- Composite index for recipient notifications by read status
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
ON notifications(recipient_id, read, created_at DESC);

-- ============================================================================
-- AN_USERS TABLE INDEXES
-- ============================================================================

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_an_users_role
ON an_users(role);

-- Index for email lookups (authentication)
CREATE INDEX IF NOT EXISTS idx_an_users_email
ON an_users(email);

-- ============================================================================
-- PILOT_USERS TABLE INDEXES
-- ============================================================================

-- Index for email lookups (pilot portal authentication)
CREATE INDEX IF NOT EXISTS idx_pilot_users_email
ON pilot_users(email);

-- Index for pilot_id linkage
CREATE INDEX IF NOT EXISTS idx_pilot_users_pilot_id
ON pilot_users(pilot_id)
WHERE pilot_id IS NOT NULL;

-- Index for pending approvals (registration_approved = false or NULL)
CREATE INDEX IF NOT EXISTS idx_pilot_users_pending_approval
ON pilot_users(registration_approved)
WHERE registration_approved = false OR registration_approved IS NULL;

-- ============================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================================================

-- Index for user action tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id);

-- Index for table-specific audits
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
ON audit_logs(table_name);

-- Index for recent audits
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Composite index for user audits by table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_table
ON audit_logs(user_id, table_name, created_at DESC);

-- ============================================================================
-- TASKS TABLE INDEXES
-- ============================================================================

-- Index for assigned user filtering
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
ON tasks(assigned_to)
WHERE assigned_to IS NOT NULL;

-- Index for task status
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(status);

-- Index for due date sorting
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(due_date)
WHERE due_date IS NOT NULL;

-- Composite index for user tasks by status
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
ON tasks(assigned_to, status)
WHERE assigned_to IS NOT NULL;

-- ============================================================================
-- LEAVE_BIDS TABLE INDEXES
-- ============================================================================

-- Index for pilot-specific leave bids
CREATE INDEX IF NOT EXISTS idx_leave_bids_pilot_id
ON leave_bids(pilot_id);

-- Index for bid status
CREATE INDEX IF NOT EXISTS idx_leave_bids_status
ON leave_bids(status);

-- Index for roster period
CREATE INDEX IF NOT EXISTS idx_leave_bids_roster_period
ON leave_bids(roster_period_code);

-- Composite index for pilot bids by roster period
CREATE INDEX IF NOT EXISTS idx_leave_bids_pilot_roster_period
ON leave_bids(pilot_id, roster_period_code);

-- ============================================================================
-- CHECK_TYPES TABLE INDEXES
-- ============================================================================

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_check_types_category
ON check_types(category);

-- Index for check_code lookups
CREATE INDEX IF NOT EXISTS idx_check_types_check_code
ON check_types(check_code);

