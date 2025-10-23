-- Performance Indexes Migration
-- Created: 2025-10-23
-- Purpose: Add indexes for frequently queried columns to improve query performance

-- Index for pilots.seniority_number (used for sorting and leave request priority)
CREATE INDEX IF NOT EXISTS idx_pilots_seniority_number
ON pilots(seniority_number)
WHERE is_active = true;

-- Index for pilots.role (used for filtering captains vs first officers)
CREATE INDEX IF NOT EXISTS idx_pilots_role
ON pilots(role)
WHERE is_active = true;

-- Index for pilot_checks.expiry_date (used for expiring certifications queries)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date
ON pilot_checks(expiry_date);

-- Composite index for pilot_checks (pilot_id + expiry_date for efficient lookups)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_expiry
ON pilot_checks(pilot_id, expiry_date);

-- Index for leave_requests.status (used for filtering pending/approved/denied requests)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status
ON leave_requests(status);

-- Composite index for leave_requests (status + start_date for approval workflows)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_dates
ON leave_requests(status, start_date, end_date);

-- Index for leave_requests.pilot_id (used for pilot-specific queries)
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_id
ON leave_requests(pilot_id);

-- Index for tasks.status (used for filtering active/completed tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(status);

-- Index for tasks.assigned_to (used for user-specific task queries)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
ON tasks(assigned_to);

-- Index for audit_logs.created_at (used for time-based queries and cleanup)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Index for audit_logs.user_id (used for user-specific audit trails)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id);

-- Index for flight_requests.status (used for filtering pending/approved requests)
CREATE INDEX IF NOT EXISTS idx_flight_requests_status
ON flight_requests(status);

-- Index for disciplinary_actions.pilot_id (used for pilot-specific queries)
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_pilot_id
ON disciplinary_actions(pilot_id);

-- Index for notifications.user_id + read status (for unread notification counts)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON notifications(user_id, is_read)
WHERE is_read = false;

-- Analyze tables to update query planner statistics
ANALYZE pilots;
ANALYZE pilot_checks;
ANALYZE leave_requests;
ANALYZE tasks;
ANALYZE audit_logs;
ANALYZE flight_requests;
ANALYZE disciplinary_actions;
ANALYZE notifications;

-- Add comment documenting the indexes
COMMENT ON INDEX idx_pilots_seniority_number IS 'Performance index for pilot sorting and leave request priority calculations';
COMMENT ON INDEX idx_pilot_checks_expiry_date IS 'Performance index for expiring certifications queries';
COMMENT ON INDEX idx_leave_requests_status IS 'Performance index for leave request approval workflows';
COMMENT ON INDEX idx_tasks_status IS 'Performance index for task management queries';
COMMENT ON INDEX idx_audit_logs_created_at IS 'Performance index for audit log time-based queries';
