-- Migration: Add Performance Indexes
-- Date: 2025-12-22
-- Description: Add missing composite indexes for common query patterns
-- Author: Maurice (Skycruzer)

-- =====================================================
-- INDEX 1: pilot_requests(pilot_id, workflow_status)
-- =====================================================
-- Common query pattern: Get requests for a pilot filtered by status
-- Example: SELECT * FROM pilot_requests WHERE pilot_id = ? AND workflow_status = 'SUBMITTED'

CREATE INDEX IF NOT EXISTS idx_pilot_requests_pilot_workflow
ON pilot_requests(pilot_id, workflow_status);

-- =====================================================
-- INDEX 2: pilot_requests(pilot_user_id)
-- =====================================================
-- Common query pattern: Get all requests for a portal user
-- Example: SELECT * FROM pilot_requests WHERE pilot_user_id = ?

CREATE INDEX IF NOT EXISTS idx_pilot_requests_pilot_user
ON pilot_requests(pilot_user_id);

-- =====================================================
-- INDEX 3: pilot_requests(request_category, workflow_status)
-- =====================================================
-- Common query pattern: Get all leave requests pending approval
-- Example: SELECT * FROM pilot_requests WHERE request_category = 'LEAVE' AND workflow_status = 'SUBMITTED'

CREATE INDEX IF NOT EXISTS idx_pilot_requests_category_status
ON pilot_requests(request_category, workflow_status);

-- =====================================================
-- INDEX 4: pilot_requests(start_date, end_date)
-- =====================================================
-- Common query pattern: Date range queries for calendar views
-- Example: SELECT * FROM pilot_requests WHERE start_date >= ? AND end_date <= ?

CREATE INDEX IF NOT EXISTS idx_pilot_requests_date_range
ON pilot_requests(start_date, end_date);

-- =====================================================
-- INDEX 5: pilot_checks(pilot_id, expiry_date)
-- =====================================================
-- Common query pattern: Get expiring certifications for a pilot
-- Example: SELECT * FROM pilot_checks WHERE pilot_id = ? AND expiry_date <= ?

CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_expiry
ON pilot_checks(pilot_id, expiry_date);

-- =====================================================
-- INDEX 6: pilots(is_active, role)
-- =====================================================
-- Common query pattern: Get active pilots by role
-- Example: SELECT * FROM pilots WHERE is_active = true AND role = 'Captain'

CREATE INDEX IF NOT EXISTS idx_pilots_active_role
ON pilots(is_active, role);

-- =====================================================
-- INDEX 7: leave_bids(pilot_id, roster_period_code)
-- =====================================================
-- Common query pattern: Get leave bids for a pilot in a roster period

CREATE INDEX IF NOT EXISTS idx_leave_bids_pilot_period
ON leave_bids(pilot_id, roster_period_code);

-- =====================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =====================================================

ANALYZE pilot_requests;
ANALYZE pilot_checks;
ANALYZE pilots;
ANALYZE leave_bids;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251222000004_add_performance_indexes completed successfully';
  RAISE NOTICE 'Created indexes: idx_pilot_requests_pilot_workflow, idx_pilot_requests_pilot_user, idx_pilot_requests_category_status, idx_pilot_requests_date_range, idx_pilot_checks_pilot_expiry, idx_pilots_active_role, idx_leave_bids_pilot_period';
END $$;
