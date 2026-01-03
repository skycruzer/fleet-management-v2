-- Migration: Add Missing Performance Indexes
-- Date: 2025-12-28
-- Description: Add remaining performance indexes identified in code review
-- Author: Maurice (Skycruzer)

-- =====================================================
-- INDEX 1: pilot_requests(created_at DESC)
-- =====================================================
-- Query pattern: Get most recent requests (dashboard, lists)
-- Example: SELECT * FROM pilot_requests ORDER BY created_at DESC LIMIT 10

CREATE INDEX IF NOT EXISTS idx_pilot_requests_created_at
ON pilot_requests(created_at DESC);

-- =====================================================
-- INDEX 2: pilot_requests(roster_period, workflow_status, created_at DESC)
-- =====================================================
-- Query pattern: Get pending requests for a roster period sorted by date
-- Example: SELECT * FROM pilot_requests
--          WHERE roster_period = 'RP01/2026' AND workflow_status = 'SUBMITTED'
--          ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_pilot_requests_roster_status_created
ON pilot_requests(roster_period, workflow_status, created_at DESC);

-- =====================================================
-- INDEX 3: audit_logs(user_id, created_at DESC) - Composite
-- =====================================================
-- Query pattern: Get activity log for a specific user sorted by date
-- Example: SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
ON audit_logs(user_id, created_at DESC);

-- =====================================================
-- INDEX 4: pilot_requests(submission_date DESC)
-- =====================================================
-- Query pattern: Sort requests by submission order
-- Example: SELECT * FROM pilot_requests ORDER BY submission_date DESC

CREATE INDEX IF NOT EXISTS idx_pilot_requests_submission_date
ON pilot_requests(submission_date DESC);

-- =====================================================
-- INDEX 5: pilot_sessions(pilot_user_id, expires_at)
-- =====================================================
-- Query pattern: Validate active sessions for a user
-- Example: SELECT * FROM pilot_sessions
--          WHERE pilot_user_id = ? AND expires_at > NOW()

CREATE INDEX IF NOT EXISTS idx_pilot_sessions_user_expires
ON pilot_sessions(pilot_user_id, expires_at);

-- =====================================================
-- ANALYZE AFFECTED TABLES
-- =====================================================

ANALYZE pilot_requests;
ANALYZE audit_logs;
ANALYZE pilot_sessions;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251228100001_add_missing_performance_indexes completed';
  RAISE NOTICE 'Created indexes: idx_pilot_requests_created_at, idx_pilot_requests_roster_status_created, idx_audit_logs_user_created, idx_pilot_requests_submission_date, idx_pilot_sessions_user_expires';
END $$;
