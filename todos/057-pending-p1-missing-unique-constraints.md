---
status: pending
priority: p1
issue_id: "057"
tags: [code-review, data-integrity, database, critical]
dependencies: []
discovered_by: data-integrity-guardian
review_date: 2025-10-26
---

# Missing Unique Constraints on Critical Business Data

## Problem Statement

The database schema is missing unique constraints on critical business data, allowing duplicate entries that violate business rules. The constraint handler code references constraints that **do not exist in the database**.

## Findings

**Discovered during**: Comprehensive code review by Data Integrity Guardian agent
**Location**: Database schema, `/lib/utils/constraint-error-handler.ts:267`
**Severity**: 🔴 CRITICAL

### Code References Non-Existent Constraint

**File**: `/lib/services/leave-service.ts:267`
```typescript
// Check if error is a unique constraint violation
if (error.code === '23505' &&
    error.message.includes('leave_requests_pilot_dates_unique')) {
  // ❌ THIS CONSTRAINT DOES NOT EXIST IN DATABASE!
  throw new DuplicateSubmissionError(
    ERROR_MESSAGES.LEAVE.DUPLICATE_REQUEST.message
  )
}
```

**Reality**: Running `\d leave_requests` in PostgreSQL shows **NO unique constraint** on `(pilot_id, start_date, end_date)`.

### Impact

**Pilots can submit multiple identical leave requests**, causing:
1. Crew availability calculation errors (counting same pilot multiple times)
2. Duplicate approvals consuming leave balance multiple times
3. Data integrity violations in production
4. Confusion in leave approval dashboard
5. Audit trail corruption

### Real-World Scenario

```sql
-- This succeeds when it SHOULD fail:
INSERT INTO leave_requests (pilot_id, start_date, end_date, request_type, status)
VALUES ('pilot-123', '2025-11-01', '2025-11-05', 'ANNUAL', 'PENDING');

INSERT INTO leave_requests (pilot_id, start_date, end_date, request_type, status)
VALUES ('pilot-123', '2025-11-01', '2025-11-05', 'ANNUAL', 'PENDING');
-- ❌ DUPLICATE CREATED - Should be blocked by unique constraint!
```

## Proposed Solutions

### Option 1: Add All Missing Unique Constraints (RECOMMENDED)

**Pros**:
- Prevents all duplicate data issues
- Database-level enforcement (cannot be bypassed)
- Minimal performance impact
- Aligns code with database reality

**Cons**:
- Requires checking existing data for duplicates first
- Requires database migration

**Effort**: Low (1 hour)
**Risk**: Low (standard database practice)

**Implementation**:

```sql
-- File: supabase/migrations/20251027_add_missing_unique_constraints.sql
BEGIN;

-- Pre-check: Verify no existing duplicates
DO $$
DECLARE
  v_duplicate_count int;
BEGIN
  -- Check for duplicate leave requests
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT pilot_id, start_date, end_date, COUNT(*) as cnt
    FROM leave_requests
    GROUP BY pilot_id, start_date, end_date
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Found % duplicate leave requests - clean data before migration',
      v_duplicate_count;
  END IF;

  -- Check for duplicate seniority numbers
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT seniority_number, COUNT(*) as cnt
    FROM pilots
    WHERE seniority_number IS NOT NULL
    GROUP BY seniority_number
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Found % duplicate seniority numbers - fix before migration',
      v_duplicate_count;
  END IF;
END $$;

-- 1. Prevent duplicate leave requests for same pilot/dates
ALTER TABLE leave_requests
ADD CONSTRAINT leave_requests_pilot_dates_unique
UNIQUE (pilot_id, start_date, end_date);

-- 2. Prevent duplicate seniority numbers (business rule)
ALTER TABLE pilots
ADD CONSTRAINT pilots_seniority_number_unique
UNIQUE (seniority_number);

-- 3. Ensure employee IDs are unique
ALTER TABLE pilots
ADD CONSTRAINT pilots_employee_id_unique
UNIQUE (employee_id);

-- 4. Prevent duplicate flight requests for same pilot/date/type
ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_pilot_date_type_unique
UNIQUE (pilot_id, requested_date, request_type);

COMMIT;
```

**Verification Query**:

```sql
-- After migration, verify constraints exist
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('leave_requests', 'pilots', 'flight_requests')
ORDER BY tc.table_name, tc.constraint_name;

-- Expected output:
-- leave_requests_pilot_dates_unique | leave_requests | pilot_id, start_date, end_date
-- pilots_seniority_number_unique     | pilots         | seniority_number
-- pilots_employee_id_unique          | pilots         | employee_id
-- flight_requests_pilot_date_type_unique | flight_requests | pilot_id, requested_date, request_type
```

### Option 2: Application-Level Validation Only (NOT RECOMMENDED)

**Pros**: No database migration needed

**Cons**:
- Can be bypassed with direct SQL access
- Race condition between check and insert
- Not enforced at database level

**Effort**: Low (2 hours)
**Risk**: High (unreliable, can be bypassed)

## Recommended Action

**IMPLEMENT OPTION 1** - Add unique constraints at database level.

This is the **only reliable solution**. Application-level validation can always be bypassed or defeated by race conditions.

## Technical Details

**Affected Files**:
- `supabase/migrations/20251027_add_missing_unique_constraints.sql` (new migration)
- `/lib/utils/constraint-error-handler.ts` (already handles these constraints - just needs DB to match)
- Database schema

**Related Components**:
- Leave request submission
- Pilot creation workflow
- Flight request submission
- Seniority calculation

**Database Changes**: Yes - 4 new unique constraints

**Breaking Changes**: No - Prevents invalid data that shouldn't exist

## Pre-Migration Data Cleanup

**IMPORTANT**: Must check for and clean any existing duplicates BEFORE applying migration.

```sql
-- 1. Find duplicate leave requests
SELECT
  pilot_id,
  start_date,
  end_date,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as request_ids
FROM leave_requests
GROUP BY pilot_id, start_date, end_date
HAVING COUNT(*) > 1;

-- If found, decide which to keep (usually earliest created_at)
-- DELETE FROM leave_requests WHERE id IN (/* duplicate IDs except first */);

-- 2. Find duplicate seniority numbers
SELECT
  seniority_number,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY commencement_date) as pilot_ids
FROM pilots
WHERE seniority_number IS NOT NULL
GROUP BY seniority_number
HAVING COUNT(*) > 1;

-- If found, recalculate seniority based on commencement_date

-- 3. Find duplicate employee IDs
SELECT
  employee_id,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as pilot_ids
FROM pilots
GROUP BY employee_id
HAVING COUNT(*) > 1;

-- If found, assign new employee IDs to duplicates
```

## Testing Strategy

### 1. Constraint Enforcement Test

```typescript
// File: lib/services/__tests__/leave-service.test.ts
test('should prevent duplicate leave requests', async () => {
  const requestData = {
    pilot_id: 'test-pilot-123',
    start_date: '2025-11-01',
    end_date: '2025-11-05',
    request_type: 'ANNUAL',
  }

  // First request should succeed
  const first = await createLeaveRequestServer(requestData)
  expect(first).toBeDefined()

  // Duplicate request should fail with specific constraint error
  await expect(createLeaveRequestServer(requestData))
    .rejects
    .toThrow(/A leave request for these dates already exists/)

  // Verify error handling uses correct constraint name
  try {
    await createLeaveRequestServer(requestData)
  } catch (error) {
    expect(error.constraintName).toBe('leave_requests_pilot_dates_unique')
  }
})

test('should prevent duplicate seniority numbers', async () => {
  const pilot1 = await createPilot({
    employee_id: 'EMP001',
    seniority_number: 5,
    commencement_date: '2020-01-01',
  })

  // Attempt to create pilot with same seniority
  await expect(createPilot({
    employee_id: 'EMP002',
    seniority_number: 5, // ❌ Duplicate
    commencement_date: '2021-01-01',
  })).rejects.toThrow(/Seniority number already exists/)
})
```

### 2. Migration Safety Test

```sql
-- Run before migration to verify no duplicates exist
SELECT 'leave_requests', COUNT(*) as duplicate_count
FROM (
  SELECT pilot_id, start_date, end_date
  FROM leave_requests
  GROUP BY pilot_id, start_date, end_date
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 'pilots_seniority', COUNT(*)
FROM (
  SELECT seniority_number
  FROM pilots
  WHERE seniority_number IS NOT NULL
  GROUP BY seniority_number
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 'pilots_employee_id', COUNT(*)
FROM (
  SELECT employee_id
  FROM pilots
  GROUP BY employee_id
  HAVING COUNT(*) > 1
) duplicates;

-- Expected: All counts should be 0
```

## Acceptance Criteria

- [ ] Pre-migration duplicate check query returns 0 for all tables
- [ ] Migration applied successfully in development
- [ ] All 4 unique constraints exist in database schema
- [ ] Duplicate leave request submission fails with correct error message
- [ ] Duplicate seniority number assignment fails
- [ ] Duplicate employee ID assignment fails
- [ ] Duplicate flight request submission fails
- [ ] Constraint error handler correctly maps constraint names to user messages
- [ ] Unit tests pass for constraint enforcement
- [ ] Migration applied to staging environment
- [ ] Migration applied to production environment

## Work Log

### 2025-10-26 - Code Review Discovery
**By**: Data Integrity Guardian (Claude)
**Actions**:
- Discovered constraint handler references non-existent constraints
- Verified database schema does NOT contain expected unique constraints
- Identified 4 missing critical unique constraints
- Designed migration with pre-check safety

**Learnings**:
- Always verify code assumptions match database reality
- Unique constraints should be database-enforced, not application-enforced
- Pre-migration checks prevent failed deployments

## Related Issues

- Finding #1: Race condition in crew availability (todos/056-pending-p1-race-condition-crew-availability.md)
- Finding #3: Missing NOT NULL constraints (todos/059-pending-p1-missing-not-null-constraints.md)

## Notes

**Priority Justification**: This is P1 CRITICAL because:
1. Application code expects these constraints to exist (error handling depends on them)
2. Missing constraints allow data corruption
3. Easy fix with high impact
4. Required for data integrity guarantees

**Deployment Strategy**:
1. Check production for duplicates (run duplicate detection queries)
2. Clean any duplicates found
3. Apply migration during maintenance window
4. Verify constraints exist
5. Test duplicate submission fails correctly
