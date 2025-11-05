/**
 * Add Performance Indexes Migration
 *
 * Developer: Maurice Rondeau
 * Date: 2025-11-02
 *
 * Adds missing database indexes for improved query performance on frequently
 * filtered and sorted columns across critical tables.
 */

-- Add index on flight_requests.flight_date for date filtering
CREATE INDEX IF NOT EXISTS idx_flight_requests_flight_date
ON flight_requests(flight_date DESC);

-- Add index on flight_requests.status for status filtering
CREATE INDEX IF NOT EXISTS idx_flight_requests_status
ON flight_requests(status);

-- Add index on flight_requests.pilot_id for pilot-specific queries
CREATE INDEX IF NOT EXISTS idx_flight_requests_pilot_id
ON flight_requests(pilot_id);

-- Add index on leave_requests.start_date for date range queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date
ON leave_requests(start_date DESC);

-- Add index on leave_requests.end_date for date range queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date
ON leave_requests(end_date DESC);

-- Add index on leave_requests.status for status filtering
CREATE INDEX IF NOT EXISTS idx_leave_requests_status
ON leave_requests(status);

-- Add composite index on leave_requests for common query pattern (pilot + status)
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_status
ON leave_requests(pilot_id, status);

-- Add index on leave_bids.status for admin review page filtering
CREATE INDEX IF NOT EXISTS idx_leave_bids_status
ON leave_bids(status);

-- Add index on leave_bids.roster_period_code for period filtering
CREATE INDEX IF NOT EXISTS idx_leave_bids_roster_period
ON leave_bids(roster_period_code);

-- Add index on pilot_checks.expiry_date for expiration tracking
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date
ON pilot_checks(expiry_date DESC)
WHERE expiry_date IS NOT NULL;

-- Add index on notifications.created_at for sorting recent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON notifications(created_at DESC);

-- Add composite index on notifications for recipient-specific unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
ON notifications(recipient_id, read, created_at DESC);

-- Add index on audit_logs.created_at for log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Add index on audit_logs.table_name for table-specific audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
ON audit_logs(table_name);

-- Add index on tasks.status for kanban board queries
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(status);

-- Add index on tasks.assigned_to for user-specific task queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
ON tasks(assigned_to)
WHERE assigned_to IS NOT NULL;

-- Add composite index on tasks for common query pattern (assigned + status)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
ON tasks(assigned_to, status)
WHERE assigned_to IS NOT NULL;

COMMENT ON INDEX idx_flight_requests_flight_date IS 'Improves performance for date-based flight request filtering';
COMMENT ON INDEX idx_leave_requests_start_date IS 'Improves performance for leave request date range queries';
COMMENT ON INDEX idx_leave_requests_pilot_status IS 'Optimizes pilot-specific leave request status queries';
COMMENT ON INDEX idx_notifications_recipient_read IS 'Optimizes unread notification queries for recipients';
COMMENT ON INDEX idx_tasks_assigned_status IS 'Optimizes kanban board queries for assigned tasks';
