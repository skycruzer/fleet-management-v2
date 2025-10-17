---
status: done
priority: p2
issue_id: "015"
tags: [performance, database, indexes]
dependencies: []
---

# Add Database Indexes

## Problem Statement

Foreign key columns lack indexes - pilot_checks.pilot_id (607 rows), check_type_id, expiry_date. Sequential scans instead of index scans.

## Findings

- **Severity**: 🟡 P2 (HIGH)
- **Impact**: Slow queries, poor performance
- **Agent**: performance-oracle

## Proposed Solutions

### Option 1: Add Performance Indexes

```sql
-- supabase/migrations/add_performance_indexes.sql
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_id ON pilot_checks(pilot_id);
CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type_id ON pilot_checks(check_type_id);
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date ON pilot_checks(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_days ON pilot_checks(expiry_date, days_until_expiry);
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_id ON leave_requests(pilot_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pilots_rank ON pilots(rank);
CREATE INDEX IF NOT EXISTS idx_pilots_commencement_date ON pilots(commencement_date);
```

**Expected Impact**: 10x query performance improvement

**Effort**: Small (1 day)
**Risk**: Low

## Acceptance Criteria

- [x] All indexes created
- [ ] Query performance improved 10x (requires deployment to test)
- [ ] EXPLAIN ANALYZE verifies index usage (requires deployment to test)
- [ ] Dashboard loads faster (requires deployment to test)

## Work Log

### 2025-10-17 - Initial Discovery
**By:** performance-oracle
**Learnings:** Critical for scalability

### 2025-10-17 - Migration Created
**By:** Claude Code (Comment Resolution Agent)
**Action**: Created `supabase/migrations/add_performance_indexes.sql`
**Details**:
- Created migrations directory structure
- Added comprehensive migration file with all 9 required indexes
- Includes detailed comments explaining each index purpose
- Includes verification queries for testing after deployment

## Resolution Summary

Migration file successfully created at:
`/Users/skycruzer/Desktop/Fleet Office Management/supabase/migrations/add_performance_indexes.sql`

The migration includes:
- 4 indexes for pilot_checks table (pilot_id, check_type_id, expiry_date, composite expiry_days)
- 3 indexes for leave_requests table (pilot_id, status, date range composite)
- 2 indexes for pilots table (rank, commencement_date)

Next steps:
1. Review migration file
2. Deploy to Supabase using MCP tools or Supabase CLI
3. Run EXPLAIN ANALYZE queries to verify index usage
4. Measure dashboard performance improvements

## Notes

Source: Performance Review, Optimization #4
Status: Ready for deployment (DO NOT commit per user request)
