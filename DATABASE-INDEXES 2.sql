-- =========================================================================
-- Database Performance Indexes
-- Fleet Management V2
--
-- This file contains recommended indexes for optimal query performance.
-- Run these in the Supabase SQL Editor or add as a migration.
-- =========================================================================

-- -------------------------------------------------------------------------
-- PILOTS TABLE INDEXES
-- -------------------------------------------------------------------------

-- Index for employee_id lookups (unique identifier searches)
CREATE INDEX IF NOT EXISTS idx_pilots_employee_id ON pilots(employee_id);

-- Composite index for role and active status filtering (very common query pattern)
-- Supports: WHERE role = 'Captain' AND is_active = true
CREATE INDEX IF NOT EXISTS idx_pilots_role_active ON pilots(role, is_active);

-- Index for seniority number ordering (used in most pilot lists)
-- Excludes NULL values since they're not used in ordering
CREATE INDEX IF NOT EXISTS idx_pilots_seniority ON pilots(seniority_number)
WHERE seniority_number IS NOT NULL;

-- Index for commencement date (used in seniority calculations)
-- Excludes NULL values for better performance
CREATE INDEX IF NOT EXISTS idx_pilots_commencement ON pilots(commencement_date)
WHERE commencement_date IS NOT NULL;

-- Index for date of birth (used in retirement calculations)
CREATE INDEX IF NOT EXISTS idx_pilots_dob ON pilots(date_of_birth)
WHERE date_of_birth IS NOT NULL;

-- Partial index for active pilots only (most common query)
CREATE INDEX IF NOT EXISTS idx_pilots_active ON pilots(id, role, seniority_number)
WHERE is_active = true;

-- -------------------------------------------------------------------------
-- PILOT_CHECKS (CERTIFICATIONS) TABLE INDEXES
-- -------------------------------------------------------------------------

-- Index for pilot_id foreign key (join performance)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_id ON pilot_checks(pilot_id);

-- Index for check_type_id foreign key (join performance)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type ON pilot_checks(check_type_id);

-- Index for expiry date filtering and ordering
-- Supports: WHERE expiry_date BETWEEN date1 AND date2 ORDER BY expiry_date
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry ON pilot_checks(expiry_date)
WHERE expiry_date IS NOT NULL;

-- Composite index for pilot + expiry lookups (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_expiry ON pilot_checks(pilot_id, expiry_date);

-- -------------------------------------------------------------------------
-- LEAVE_REQUESTS TABLE INDEXES
-- -------------------------------------------------------------------------

-- Index for pilot_id foreign key
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_id ON leave_requests(pilot_id);

-- Index for status filtering (pending, approved, denied)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Composite index for date range queries
-- Supports: WHERE start_date BETWEEN d1 AND d2 OR end_date BETWEEN d1 AND d2
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Composite index for roster period lookups
CREATE INDEX IF NOT EXISTS idx_leave_requests_roster_period ON leave_requests(roster_period);

-- Index for created_at (for recent requests)
CREATE INDEX IF NOT EXISTS idx_leave_requests_created ON leave_requests(created_at DESC);

-- Composite index for pilot + status (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_status ON leave_requests(pilot_id, status);

-- -------------------------------------------------------------------------
-- CHECK_TYPES TABLE INDEXES
-- -------------------------------------------------------------------------

-- Index for check_code (frequently searched)
CREATE INDEX IF NOT EXISTS idx_check_types_code ON check_types(check_code);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_check_types_category ON check_types(category)
WHERE category IS NOT NULL;

-- -------------------------------------------------------------------------
-- AN_USERS (AUTHENTICATION) TABLE INDEXES
-- -------------------------------------------------------------------------

-- Index for email lookups (login, user search)
CREATE INDEX IF NOT EXISTS idx_an_users_email ON an_users(email);

-- Index for role filtering (admin, manager, pilot queries)
CREATE INDEX IF NOT EXISTS idx_an_users_role ON an_users(role);

-- -------------------------------------------------------------------------
-- FLIGHT_REQUESTS TABLE INDEXES
-- -------------------------------------------------------------------------

-- Index for pilot_id foreign key
CREATE INDEX IF NOT EXISTS idx_flight_requests_pilot_id ON flight_requests(pilot_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_flight_requests_status ON flight_requests(status);

-- Index for created_at (recent requests)
CREATE INDEX IF NOT EXISTS idx_flight_requests_created ON flight_requests(created_at DESC);

-- -------------------------------------------------------------------------
-- DISCIPLINARY_ACTIONS TABLE INDEXES
-- -------------------------------------------------------------------------

-- Index for action_date
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_date ON disciplinary_actions(action_date);

-- =========================================================================
-- PERFORMANCE VERIFICATION QUERIES
-- =========================================================================

-- After creating indexes, verify they're being used with EXPLAIN ANALYZE

-- Example 1: Pilots by role and active status
EXPLAIN ANALYZE
SELECT id, first_name, last_name, role, seniority_number
FROM pilots
WHERE role = 'Captain' AND is_active = true
ORDER BY seniority_number;

-- Example 2: Expiring certifications
EXPLAIN ANALYZE
SELECT pc.id, pc.pilot_id, p.first_name, p.last_name, pc.expiry_date
FROM pilot_checks pc
JOIN pilots p ON pc.pilot_id = p.id
WHERE pc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY pc.expiry_date;

-- Example 3: Leave requests for a roster period
EXPLAIN ANALYZE
SELECT lr.id, lr.pilot_id, p.first_name, p.last_name, lr.status
FROM leave_requests lr
JOIN pilots p ON lr.pilot_id = p.id
WHERE lr.roster_period = 'RP12/2025'
ORDER BY lr.created_at DESC;

-- =========================================================================
-- INDEX MAINTENANCE
-- =========================================================================

-- Check index sizes and usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find unused indexes (candidates for removal)
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
AND indexrelid NOT IN (
    SELECT conindid FROM pg_constraint WHERE contype IN ('p', 'u')
)
ORDER BY pg_relation_size(indexrelid) DESC;

-- =========================================================================
-- NOTES
-- =========================================================================

-- 1. Run ANALYZE after creating indexes to update statistics:
--    ANALYZE pilots;
--    ANALYZE pilot_checks;
--    ANALYZE leave_requests;

-- 2. Monitor index usage with pg_stat_user_indexes

-- 3. Partial indexes (with WHERE clauses) are smaller and faster
--    but only used when the query matches the condition

-- 4. Composite indexes should order columns by:
--    - Equality conditions first (col = value)
--    - Range conditions second (col BETWEEN x AND y)
--    - Sort order last (ORDER BY col)

-- 5. Don't create redundant indexes:
--    - If you have index on (a, b), don't create index on (a)
--    - PostgreSQL can use (a, b) for queries on just (a)

-- =========================================================================
