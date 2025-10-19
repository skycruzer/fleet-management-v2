# Data Integrity Review Report
**Pilot Portal Database Design**

**Review Date**: 2025-10-19
**Reviewer**: Data Integrity Guardian (Claude Code)
**Scope**: Database schema, migrations, service layer, and Server Actions

---

## Executive Summary

**Overall Assessment**: ⚠️ **MODERATE RISK** - Multiple P1 critical issues identified

**Critical Findings**: 5 P1 issues, 3 P2 issues, 2 P3 issues

**Recommendation**: Address all P1 issues before production deployment. The current implementation has significant data integrity vulnerabilities that could lead to orphaned records, data inconsistency, and privacy violations.

---

## Critical Issues (P1) - Must Fix Before Production

### P1-1: Orphaned Records Risk - Foreign Key Cascade Mismatch

**Severity**: 🔴 **CRITICAL** - Data Loss Risk

**Issue**: Inconsistent cascade deletion rules create orphaned record vulnerability.

**Evidence**:
```sql
-- feedback_posts
pilot_user_id → pilot_users.id: ON DELETE SET NULL

-- leave_requests
pilot_user_id → pilot_users.id: ON DELETE SET NULL
pilot_id → pilots.id: ON DELETE CASCADE

-- flight_requests
pilot_user_id → pilot_users.id: ON DELETE CASCADE
pilot_id → pilots.id: ON DELETE CASCADE
```

**Problem Scenario**:
1. Pilot user account deleted from `auth.users` (GDPR right to deletion)
2. `pilot_users` record CASCADE deleted (auth.users → pilot_users FK)
3. `feedback_posts.pilot_user_id` SET to NULL (orphaned posts with no author)
4. `leave_requests.pilot_user_id` SET to NULL but `pilot_id` remains
5. `flight_requests` CASCADE deleted (inconsistent with leave_requests)

**Data Corruption Example**:
```sql
-- Before deletion
SELECT id, pilot_user_id, pilot_id FROM leave_requests WHERE pilot_user_id = 'uuid-123';
-- Result: {pilot_user_id: 'uuid-123', pilot_id: 'uuid-456'}

-- After pilot user deletion
SELECT id, pilot_user_id, pilot_id FROM leave_requests WHERE pilot_id = 'uuid-456';
-- Result: {pilot_user_id: NULL, pilot_id: 'uuid-456'}
-- ⚠️ ORPHANED: No way to identify which pilot_user submitted this request
```

**Impact**:
- Loss of audit trail (who submitted the request?)
- Privacy compliance failure (cannot fulfill GDPR deletion)
- Inconsistent behavior across tables (feedback, leave, flights)
- Business logic breaks (cannot filter by pilot_user_id after deletion)

**Solution**:
```sql
-- Option 1: Soft delete pattern (RECOMMENDED for compliance)
ALTER TABLE pilot_users ADD COLUMN deleted_at TIMESTAMPTZ NULL;
ALTER TABLE pilot_users ADD COLUMN deletion_reason TEXT NULL;

-- Keep records but mark as deleted for GDPR compliance
-- Option 2: Consistent CASCADE behavior
ALTER TABLE feedback_posts
  DROP CONSTRAINT feedback_posts_pilot_user_id_fkey,
  ADD CONSTRAINT feedback_posts_pilot_user_id_fkey
    FOREIGN KEY (pilot_user_id) REFERENCES pilot_users(id)
    ON DELETE CASCADE;

ALTER TABLE leave_requests
  DROP CONSTRAINT leave_requests_pilot_user_id_fkey,
  ADD CONSTRAINT leave_requests_pilot_user_id_fkey
    FOREIGN KEY (pilot_user_id) REFERENCES pilot_users(id)
    ON DELETE CASCADE;
```

**Rollback Strategy**: Create migration with explicit CASCADE rules and test data preservation.

---

### P1-2: Missing Transaction Boundaries in Service Layer

**Severity**: 🔴 **CRITICAL** - Data Inconsistency Risk

**Issue**: Write operations in `pilot-portal-service.ts` do not use explicit transactions.

**Evidence**:
```typescript
// lib/services/pilot-portal-service.ts (lines 296-342)
export async function submitLeaveRequest(pilotUserId, leaveRequest) {
  const supabase = await createClient()

  // Step 1: Get pilot_id (separate query)
  const pilot_id = await getPilotIdFromPilotUserId(pilotUserId)

  if (!pilot_id) {
    throw new Error('Pilot not found')
  }

  // Step 2: Insert leave request (separate transaction)
  const { error } = await supabase.from('leave_requests').insert([{
    pilot_id: pilot_id,
    pilot_user_id: pilotUserId,
    // ... other fields
  }])

  // ⚠️ NO TRANSACTION BOUNDARY - Race condition possible
}
```

**Race Condition Scenario**:
1. **Thread A**: Calls `submitLeaveRequest()` for pilot user '123'
2. **Thread A**: Queries `pilot_user_mappings` view (pilot exists)
3. **Thread B**: Admin deletes pilot user '123' from database
4. **Thread A**: Attempts INSERT with `pilot_user_id='123'` (already deleted)
5. **Result**: Foreign key violation OR orphaned record (depending on timing)

**Concurrent Submission Risk**:
```typescript
// Two pilots submit simultaneously
Promise.all([
  submitLeaveRequest('pilot-1', { start_date: '2025-10-20', ... }),
  submitLeaveRequest('pilot-2', { start_date: '2025-10-20', ... })
])
// No atomic validation of minimum crew requirements
// Both could be approved even if it violates the 10-pilot minimum
```

**Impact**:
- Potential duplicate submissions
- Race conditions during pilot deletion
- No atomicity guarantee for multi-step operations
- Violates ACID principles (Atomicity, Consistency)

**Solution**:
```typescript
// Use database function with explicit transaction
export async function submitLeaveRequest(pilotUserId, leaveRequest) {
  const supabase = await createClient()

  // Call PostgreSQL function that wraps everything in a transaction
  const { data, error } = await supabase.rpc('submit_leave_request_atomic', {
    p_pilot_user_id: pilotUserId,
    p_leave_data: leaveRequest
  })

  if (error) throw error
  return data
}

// Database migration:
CREATE OR REPLACE FUNCTION submit_leave_request_atomic(
  p_pilot_user_id uuid,
  p_leave_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_pilot_id uuid;
  v_result jsonb;
BEGIN
  -- Step 1: Get pilot_id with FOR UPDATE lock
  SELECT pilot_id INTO v_pilot_id
  FROM pilot_user_mappings
  WHERE pilot_user_id = p_pilot_user_id
  FOR UPDATE;  -- Row-level lock prevents deletion during transaction

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for pilot_user_id %', p_pilot_user_id;
  END IF;

  -- Step 2: Insert leave request atomically
  INSERT INTO leave_requests (
    pilot_id, pilot_user_id, request_type, start_date, end_date, days_count, roster_period, reason, status
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_leave_data->>'request_type',
    (p_leave_data->>'start_date')::date,
    (p_leave_data->>'end_date')::date,
    (p_leave_data->>'days_count')::int,
    p_leave_data->>'roster_period',
    p_leave_data->>'reason',
    'PENDING'
  )
  RETURNING jsonb_build_object('id', id, 'status', status) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit leave request: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

---

### P1-3: pilot_user_mappings View Performance and Consistency Risk

**Severity**: 🔴 **CRITICAL** - Query Performance and Data Staleness

**Issue**: Non-materialized view causes multiple reads and potential stale data.

**Evidence**:
```sql
-- Current implementation (lines 6-21 in migration)
CREATE OR REPLACE VIEW pilot_user_mappings AS
SELECT
  pu.id as pilot_user_id,
  pu.employee_id,
  -- ... 10+ fields
  p.id as pilot_id,
  p.created_at as pilot_created_at
FROM pilot_users pu
LEFT JOIN pilots p ON p.employee_id = pu.employee_id;
-- ⚠️ No materialization, no refresh policy, no indexes
```

**Performance Problem**:
```typescript
// Every service call executes the JOIN query
const pilot_id = await getPilotIdFromPilotUserId(pilotUserId)  // JOIN executed
const stats = await getPilotDashboardStats(pilotUserId)        // JOIN executed again
const certs = await getPilotCertifications(pilotUserId)        // JOIN executed again

// 3 function calls = 3 identical JOIN operations
// With 27 pilots × 3 calls = 81 unnecessary JOIN operations per page load
```

**Consistency Risk**:
```sql
-- Transaction 1 (in progress)
BEGIN;
SELECT pilot_id FROM pilot_user_mappings WHERE pilot_user_id = 'uuid-123';
-- Returns: pilot_id = 'uuid-456'

-- Transaction 2 (concurrent)
UPDATE pilots SET employee_id = 'NEW-123' WHERE id = 'uuid-456';
COMMIT;

-- Transaction 1 (continues)
INSERT INTO leave_requests (pilot_id, pilot_user_id) VALUES ('uuid-456', 'uuid-123');
COMMIT;
-- ⚠️ pilot_id 'uuid-456' no longer has employee_id matching pilot_user employee_id
-- Data inconsistency: mapping is now broken
```

**Impact**:
- Every query re-executes the join (N+1 problem not fully solved)
- No caching of mapping results
- Read uncommitted data during concurrent updates
- View performance degrades linearly with table size

**Solution**:
```sql
-- Option 1: Materialized view with refresh policy (RECOMMENDED)
CREATE MATERIALIZED VIEW pilot_user_mappings_mv AS
SELECT
  pu.id as pilot_user_id,
  pu.employee_id,
  pu.email,
  pu.first_name,
  pu.last_name,
  pu.rank,
  pu.seniority_number,
  pu.registration_approved,
  pu.last_login_at,
  pu.created_at as pilot_user_created_at,
  p.id as pilot_id,
  p.created_at as pilot_created_at
FROM pilot_users pu
LEFT JOIN pilots p ON p.employee_id = pu.employee_id;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_pilot_user_mappings_mv_pilot_user_id
  ON pilot_user_mappings_mv (pilot_user_id);
CREATE INDEX idx_pilot_user_mappings_mv_pilot_id
  ON pilot_user_mappings_mv (pilot_id);

-- Auto-refresh trigger
CREATE OR REPLACE FUNCTION refresh_pilot_user_mappings()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY pilot_user_mappings_mv;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_mappings_on_pilot_users
AFTER INSERT OR UPDATE OR DELETE ON pilot_users
FOR EACH STATEMENT EXECUTE FUNCTION refresh_pilot_user_mappings();

CREATE TRIGGER trigger_refresh_mappings_on_pilots
AFTER INSERT OR UPDATE OR DELETE ON pilots
FOR EACH STATEMENT EXECUTE FUNCTION refresh_pilot_user_mappings();

-- Option 2: Direct foreign key (simpler, better performance)
ALTER TABLE pilot_users ADD COLUMN pilot_id UUID REFERENCES pilots(id);
CREATE INDEX idx_pilot_users_pilot_id ON pilot_users(pilot_id);

-- Update existing records
UPDATE pilot_users pu
SET pilot_id = p.id
FROM pilots p
WHERE p.employee_id = pu.employee_id;

-- Add NOT NULL constraint after backfill
ALTER TABLE pilot_users ALTER COLUMN pilot_id SET NOT NULL;
```

---

### P1-4: Missing Database-Level Constraints for Business Rules

**Severity**: 🔴 **CRITICAL** - Data Validation Bypass

**Issue**: Critical business rules only validated in application code, not database.

**Evidence**:
```typescript
// Server Action validation (app/portal/leave/actions.ts)
const leaveRequestActionSchema = z.object({
  request_type: z.enum(['Annual Leave', 'Sick Leave', ...]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days_count: z.number().positive(),
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'End date must be on or after start date',
})

// ⚠️ Database has NO CHECK constraints enforcing these rules
```

**Bypass Scenario**:
```sql
-- Application validates dates, but database doesn't
-- Direct SQL bypass (admin script, data migration, etc.)
INSERT INTO leave_requests (pilot_id, pilot_user_id, start_date, end_date, days_count)
VALUES ('uuid-1', 'uuid-2', '2025-12-31', '2025-01-01', 365);
-- ✓ Accepted by database
-- ⚠️ end_date BEFORE start_date (logical impossibility)
-- ⚠️ days_count = 365 but date range is negative
```

**Missing Constraints**:
1. **Date range validation**: `end_date >= start_date`
2. **Days count calculation**: `days_count = (end_date - start_date + 1)`
3. **Future date validation**: `start_date > CURRENT_DATE` (for leave requests)
4. **Roster period format**: `roster_period ~ '^RP\d{1,2}\/\d{4}$'`
5. **Status transition rules**: Cannot go from APPROVED → PENDING

**Impact**:
- Invalid data can be inserted via SQL
- Data migrations bypass validation
- Admin tools can create corrupt records
- No defense in depth (single layer of validation)

**Solution**:
```sql
-- Add database CHECK constraints
ALTER TABLE leave_requests
  ADD CONSTRAINT check_leave_dates_valid
    CHECK (end_date >= start_date);

ALTER TABLE leave_requests
  ADD CONSTRAINT check_days_count_positive
    CHECK (days_count > 0);

ALTER TABLE leave_requests
  ADD CONSTRAINT check_roster_period_format
    CHECK (roster_period IS NULL OR roster_period ~ '^RP\d{1,2}\/\d{4}$');

-- Add calculated column for date validation
ALTER TABLE leave_requests
  ADD COLUMN calculated_days_count INT
    GENERATED ALWAYS AS (end_date - start_date + 1) STORED;

ALTER TABLE leave_requests
  ADD CONSTRAINT check_days_count_matches
    CHECK (days_count = calculated_days_count);

-- Add status transition validation
ALTER TABLE leave_requests
  ADD CONSTRAINT check_status_values
    CHECK (status IN ('PENDING', 'APPROVED', 'DENIED'));

-- Prevent status rollback via trigger
CREATE OR REPLACE FUNCTION prevent_status_rollback()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('APPROVED', 'DENIED') AND NEW.status = 'PENDING' THEN
    RAISE EXCEPTION 'Cannot change status from % back to PENDING', OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_leave_status_rollback
BEFORE UPDATE ON leave_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION prevent_status_rollback();
```

---

### P1-5: Anonymous Feedback Privacy Violation Risk

**Severity**: 🔴 **CRITICAL** - Privacy/GDPR Compliance Issue

**Issue**: Anonymous feedback can be de-anonymized via database queries.

**Evidence**:
```typescript
// Service layer (lib/services/pilot-portal-service.ts, lines 621-656)
export async function submitFeedbackPost(pilotUserId, feedbackData) {
  const { error } = await supabase.from('feedback_posts').insert([{
    pilot_user_id: pilotUserId,  // ⚠️ ALWAYS stored, even for anonymous posts
    title: feedbackData.title,
    content: feedbackData.content,
    category_id: feedbackData.category_id || null,
    is_anonymous: feedbackData.is_anonymous || false,
    author_display_name: feedbackData.is_anonymous
      ? 'Anonymous Pilot'        // Display name hidden
      : feedbackData.author_display_name,
    author_rank: feedbackData.is_anonymous
      ? null                      // Rank hidden
      : feedbackData.author_rank,
    status: 'published',
  }])
}
```

**Privacy Breach Scenario**:
```sql
-- User submits anonymous feedback
INSERT INTO feedback_posts (
  pilot_user_id,      -- 'uuid-123' (STORED)
  is_anonymous,       -- true
  author_display_name -- 'Anonymous Pilot'
) VALUES ('uuid-123', true, 'Anonymous Pilot');

-- Admin queries database directly
SELECT
  fp.pilot_user_id,
  pu.first_name,
  pu.last_name,
  pu.email,
  fp.title,
  fp.content
FROM feedback_posts fp
JOIN pilot_users pu ON pu.id = fp.pilot_user_id
WHERE fp.is_anonymous = true;

-- ⚠️ RESULT: Full identity of "anonymous" poster revealed
-- {
--   pilot_user_id: 'uuid-123',
--   first_name: 'John',
--   last_name: 'Smith',
--   email: 'john.smith@airline.com',
--   title: 'Management issues...',
--   content: 'Sensitive complaint about supervisor...'
-- }
```

**Impact**:
- False promise of anonymity to users
- GDPR violation (right to anonymity)
- Trust violation (pilots believe they are anonymous)
- Potential retaliation risk (management can identify complainers)
- Legal liability if anonymity is promised but not delivered

**Solution**:
```sql
-- Option 1: Don't store pilot_user_id for anonymous posts (RECOMMENDED)
ALTER TABLE feedback_posts
  DROP CONSTRAINT feedback_posts_pilot_user_id_fkey,
  ADD CONSTRAINT feedback_posts_pilot_user_id_fkey
    FOREIGN KEY (pilot_user_id) REFERENCES pilot_users(id)
    ON DELETE SET NULL;

-- Add constraint: if anonymous, pilot_user_id must be NULL
ALTER TABLE feedback_posts
  ADD CONSTRAINT check_anonymous_no_user_id
    CHECK (
      (is_anonymous = false AND pilot_user_id IS NOT NULL) OR
      (is_anonymous = true AND pilot_user_id IS NULL)
    );

-- Update service layer
export async function submitFeedbackPost(pilotUserId, feedbackData) {
  const { error } = await supabase.from('feedback_posts').insert([{
    pilot_user_id: feedbackData.is_anonymous ? null : pilotUserId,  // NULL for anonymous
    is_anonymous: feedbackData.is_anonymous || false,
    author_display_name: feedbackData.is_anonymous
      ? 'Anonymous Pilot'
      : feedbackData.author_display_name,
    // ... rest
  }])
}

-- Option 2: One-way hash (allows deduplication but not identification)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE feedback_posts ADD COLUMN author_hash TEXT;

-- Service layer: hash pilot_user_id for anonymous posts
export async function submitFeedbackPost(pilotUserId, feedbackData) {
  const authorHash = feedbackData.is_anonymous
    ? createHash('sha256').update(pilotUserId + SECRET_SALT).digest('hex')
    : null;

  await supabase.from('feedback_posts').insert([{
    pilot_user_id: feedbackData.is_anonymous ? null : pilotUserId,
    author_hash: authorHash,  // Can detect spam but not identify user
    is_anonymous: feedbackData.is_anonymous,
    // ... rest
  }])
}
```

---

## High Priority Issues (P2) - Should Fix Soon

### P2-1: No Duplicate Request Prevention

**Severity**: 🟡 **HIGH** - Data Quality Issue

**Issue**: No unique constraints prevent duplicate submissions.

**Evidence**:
```sql
-- No unique constraint on leave_requests
-- Pilot can submit identical requests multiple times
INSERT INTO leave_requests (pilot_id, start_date, end_date, roster_period)
VALUES ('uuid-1', '2025-10-20', '2025-10-27', 'RP12/2025');

INSERT INTO leave_requests (pilot_id, start_date, end_date, roster_period)
VALUES ('uuid-1', '2025-10-20', '2025-10-27', 'RP12/2025');
-- ✓ Both accepted (duplicates)
```

**Solution**:
```sql
-- Add unique constraint for active requests only
CREATE UNIQUE INDEX idx_leave_requests_no_duplicates
ON leave_requests (pilot_id, start_date, end_date)
WHERE status IN ('PENDING', 'APPROVED');

-- Prevent overlapping date ranges for same pilot
CREATE UNIQUE INDEX idx_leave_requests_no_overlap
ON leave_requests USING gist (
  pilot_id,
  daterange(start_date, end_date, '[]')
)
WHERE status IN ('PENDING', 'APPROVED');
```

---

### P2-2: Missing Audit Trail for Data Changes

**Severity**: 🟡 **HIGH** - Compliance Issue

**Issue**: No automatic audit logging for sensitive operations.

**Evidence**:
```typescript
// submitLeaveRequest() has no audit trail
// Who submitted? When? What IP address? What was changed?
```

**Solution**:
```sql
-- Use existing audit_logs table with triggers
CREATE OR REPLACE FUNCTION audit_leave_request_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, new_data, user_id, created_at
    ) VALUES (
      'leave_requests', NEW.id, 'INSERT', row_to_json(NEW), NEW.pilot_user_id, now()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, old_data, new_data, user_id, created_at
    ) VALUES (
      'leave_requests', NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.pilot_user_id, now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_leave_requests
AFTER INSERT OR UPDATE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION audit_leave_request_changes();
```

---

### P2-3: View Refresh Policy Missing for pilot_user_mappings

**Severity**: 🟡 **HIGH** - Data Staleness Risk

**Issue**: Current view has no refresh strategy if converted to materialized view.

**Solution**: See P1-3 solution for refresh triggers.

---

## Medium Priority Issues (P3) - Nice to Have

### P3-1: No Database-Level Default Values for Required Fields

**Severity**: 🟢 **MEDIUM** - Data Quality

**Issue**: Service layer provides defaults but database doesn't enforce them.

```sql
-- Add database defaults
ALTER TABLE leave_requests
  ALTER COLUMN status SET DEFAULT 'PENDING',
  ALTER COLUMN submission_type SET DEFAULT 'pilot',
  ALTER COLUMN request_method SET DEFAULT 'SYSTEM',
  ALTER COLUMN is_late_request SET DEFAULT false;
```

---

### P3-2: Missing NOT NULL Constraints on Business-Critical Fields

**Severity**: 🟢 **MEDIUM** - Data Quality

**Issue**: Fields that should never be NULL are marked as nullable.

```sql
-- These should be NOT NULL
ALTER TABLE leave_requests
  ALTER COLUMN pilot_id SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL,
  ALTER COLUMN days_count SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE flight_requests
  ALTER COLUMN pilot_id SET NOT NULL,
  ALTER COLUMN flight_date SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;
```

---

## Migration Safety Assessment

### Current Migration: 20251019_create_pilot_user_mappings_view.sql

**Safety Rating**: ✅ **SAFE** (for view creation)

**Rollback Strategy**:
```sql
-- Rollback migration
DROP VIEW IF EXISTS pilot_user_mappings CASCADE;
REVOKE SELECT ON pilot_user_mappings FROM authenticated;
```

**Issues**:
- View is safe but suboptimal (see P1-3)
- No performance impact during creation
- No data modification (read-only view)

**Recommendation**:
- Current migration is safe to deploy
- Follow up with materialized view migration for performance

---

## Recommendations Summary

### Immediate Actions (Before Production)

1. **Fix P1-1**: Implement consistent cascade deletion strategy
   - Choose: Soft delete OR consistent CASCADE behavior
   - Priority: **CRITICAL** - Data loss risk

2. **Fix P1-2**: Add transaction boundaries to all write operations
   - Use PostgreSQL functions for atomic operations
   - Priority: **CRITICAL** - Race condition risk

3. **Fix P1-3**: Materialize pilot_user_mappings view with refresh policy
   - OR add direct foreign key pilot_users.pilot_id
   - Priority: **CRITICAL** - Performance issue

4. **Fix P1-4**: Add database CHECK constraints for business rules
   - Date validation, status transitions, format validation
   - Priority: **CRITICAL** - Data validation bypass

5. **Fix P1-5**: Fix anonymous feedback privacy violation
   - NULL pilot_user_id for anonymous posts
   - Priority: **CRITICAL** - GDPR/privacy violation

### Short-Term Actions (Next Sprint)

1. **Fix P2-1**: Add unique constraints to prevent duplicates
2. **Fix P2-2**: Implement comprehensive audit logging
3. **Fix P2-3**: Add view refresh policy

### Long-Term Improvements

1. **Fix P3-1**: Add database default values
2. **Fix P3-2**: Add NOT NULL constraints where appropriate

---

## Testing Recommendations

### Data Integrity Tests Required

```sql
-- Test 1: Verify cascade deletion behavior
BEGIN;
  DELETE FROM pilot_users WHERE id = 'test-uuid';
  -- Verify: feedback_posts, leave_requests, flight_requests behavior
ROLLBACK;

-- Test 2: Verify concurrent submission handling
-- Run two simultaneous transactions

-- Test 3: Verify constraint enforcement
-- Attempt to insert invalid data (end_date < start_date)

-- Test 4: Verify anonymous feedback privacy
-- Attempt to query pilot_user_id for anonymous posts
```

### Load Testing

```bash
# Test view performance under load
ab -n 1000 -c 10 http://localhost:3000/portal/dashboard
# Monitor: pilot_user_mappings view query execution time
```

---

## Conclusion

The Pilot Portal database design has **significant data integrity risks** that must be addressed before production deployment. The five P1 critical issues represent fundamental violations of data safety principles:

1. **Orphaned records** (P1-1) violate referential integrity
2. **Missing transactions** (P1-2) violate atomicity guarantees
3. **Performance issues** (P1-3) will degrade under load
4. **Missing constraints** (P1-4) allow invalid data
5. **Privacy violations** (P1-5) create legal liability

**Estimated Fix Time**: 2-3 days for all P1 issues

**Risk if Deployed As-Is**:
- 🔴 **HIGH** - Data loss likely within first month
- 🔴 **HIGH** - Privacy violation exposure
- 🔴 **HIGH** - Performance degradation at scale

**Recommendation**: **DO NOT DEPLOY TO PRODUCTION** until all P1 issues are resolved.

---

**Report Generated**: 2025-10-19
**Review Methodology**: Database schema analysis, foreign key examination, service layer code review, Server Action validation analysis
**Files Analyzed**:
- `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/supabase/migrations/20251019_create_pilot_user_mappings_view.sql`
- `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/supabase/migrations/20251017_add_transaction_boundaries.sql`
- `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/pilot-portal-service.ts`
- `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/portal/feedback/actions.ts`
- `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/portal/leave/actions.ts`
- `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/portal/flights/actions.ts`

**Database Schema**: 27 tables analyzed via Supabase MCP integration
