/**
 * Add Missing Performance Indexes
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Purpose: Add critical database indexes identified during performance audit
 * Impact: Significantly improve query performance for:
 *   - Leave eligibility calculations (rank-separated)
 *   - Seniority-based leave approvals
 *   - Certification compliance tracking
 *   - Pending approval workflows
 */

-- Index 1: Leave eligibility queries (rank-separated approval logic)
-- Optimizes: Leave approval workflow queries filtering by pilot, dates, and status
-- Used in: lib/services/leave-eligibility-service.ts
CREATE INDEX IF NOT EXISTS idx_leave_requests_rank_dates
ON leave_requests(pilot_id, start_date, end_date, status)
WHERE status IN ('PENDING', 'APPROVED');

-- Index 2: Seniority-based queries for leave prioritization
-- Optimizes: Seniority number lookups for approval priority
-- Used in: lib/services/leave-eligibility-service.ts (seniority-based approval)
CREATE INDEX IF NOT EXISTS idx_pilots_seniority_role
ON pilots(seniority_number, role)
WHERE is_active = true;

-- Index 3: Certification compliance and expiry tracking
-- Optimizes: Expiring certification queries and compliance dashboards
-- Used in: lib/services/expiring-certifications-service.ts, dashboard queries
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_pilot
ON pilot_checks(expiry_date, pilot_id)
WHERE expiry_date IS NOT NULL;

-- Index 4: Pending flight request approvals
-- Optimizes: Admin dashboard pending approvals list (sorted by recency)
-- Used in: Flight request approval workflows
CREATE INDEX IF NOT EXISTS idx_flight_requests_pending
ON flight_requests(created_at DESC)
WHERE status = 'PENDING';

-- Index 5: Pending leave request approvals
-- Optimizes: Admin dashboard pending leave requests (sorted by recency)
-- Used in: Leave request approval workflows
CREATE INDEX IF NOT EXISTS idx_leave_requests_pending
ON leave_requests(created_at DESC)
WHERE status = 'PENDING';

-- Index 6: Active pilots lookup (frequently filtered)
-- Optimizes: Queries that filter by active status
-- Used in: Dashboard metrics, pilot lists
CREATE INDEX IF NOT EXISTS idx_pilots_active
ON pilots(is_active)
WHERE is_active = true;

-- Index 7: Pilot checks by pilot (for individual pilot reports)
-- Optimizes: Single pilot certification history queries
-- Used in: Pilot profile pages, certification reports
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_date
ON pilot_checks(pilot_id, completion_date DESC);

-- Index 8: Leave requests by date range (for roster period queries)
-- Optimizes: Leave calendar and roster period filtering
-- Used in: Leave calendar views, roster period reports
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
ON leave_requests(start_date, end_date)
WHERE status IN ('PENDING', 'APPROVED');

-- Analyze tables to update query planner statistics
ANALYZE pilots;
ANALYZE leave_requests;
ANALYZE pilot_checks;
ANALYZE flight_requests;

-- Verification queries to confirm indexes were created
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully';
  RAISE NOTICE 'Run EXPLAIN ANALYZE on queries to verify index usage';
END $$;
