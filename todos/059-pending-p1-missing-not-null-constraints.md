---
status: pending
priority: p1
issue_id: '059'
tags: [code-review, data-integrity, database, critical]
dependencies: []
discovered_by: data-integrity-guardian
review_date: 2025-10-26
---

# Missing NOT NULL Constraints on Mandatory Fields

## Problem Statement

Critical business fields in the database allow `NULL` values, enabling invalid data insertion that violates business logic. This creates "ghost records" that break application functionality.

## Findings

**Discovered during**: Comprehensive data integrity audit by Data Integrity Guardian agent
**Location**: Database schema, `types/supabase.ts`
**Severity**: 🔴 HIGH

### Evidence from Type Definitions

**File**: `/types/supabase.ts`

```typescript
// Leave Requests Table
leave_requests: {
  pilot_id: string | null // ❌ Should be NOT NULL
  request_type: string | null // ❌ Should be NOT NULL
  roster_period: string | null // ❌ Should be NOT NULL
  status: 'APPROVED' | 'DENIED' | 'PENDING' | null // ❌ Should be NOT NULL
  days_count: number | null // ❌ Should be NOT NULL
  start_date: string | null // ❌ Should be NOT NULL
  end_date: string | null // ❌ Should be NOT NULL
}

// Pilots Table
pilots: {
  employee_id: string | null // ❌ Should be NOT NULL
  first_name: string | null // ❌ Should be NOT NULL
  last_name: string | null // ❌ Should be NOT NULL
  role: 'Captain' | 'First Officer' | null // ❌ Should be NOT NULL
}

// Pilot Checks Table
pilot_checks: {
  pilot_id: string | null // ❌ Should be NOT NULL
  check_type_id: string | null // ❌ Should be NOT NULL
}
```

### Impact

**Without NOT NULL constraints, invalid data can be inserted**:

```sql
-- This should FAIL but currently SUCCEEDS
INSERT INTO leave_requests (id, created_at)
VALUES (gen_random_uuid(), now());
-- Result: Leave request with NULL pilot, NULL dates, NULL status
-- ❌ GARBAGE DATA that breaks application logic

-- This should FAIL but currently SUCCEEDS
INSERT INTO pilots (id, created_at)
VALUES (gen_random_uuid(), now());
-- Result: Pilot with no name, no employee ID, no role
-- ❌ PHANTOM PILOT that breaks crew calculations
```

### Real-World Consequences

1. **Crew Availability Calculations**: Null pilots counted incorrectly
2. **Leave Approval Logic**: Cannot determine request type or dates
3. **Seniority Calculations**: Null employee IDs break sorting
4. **Certification Tracking**: Orphaned certifications without pilot link
5. **Audit Trail**: Cannot track who created the record

## Proposed Solutions

### Option 1: Add NOT NULL Constraints with Pre-Check (RECOMMENDED)

**Pros**:

- Database-level enforcement (cannot be bypassed)
- Prevents future invalid data
- Aligns type definitions with database reality
- Minimal performance impact

**Cons**:

- Requires checking existing data for NULLs first
- May reveal existing data quality issues

**Effort**: Medium (2 hours)
**Risk**: Low (standard database practice)

**Implementation**:

```sql
-- File: supabase/migrations/20251027_add_not_null_constraints.sql
BEGIN;

-- STEP 1: Pre-check for existing NULL values
DO $$
DECLARE
  v_null_count int;
  v_error_message text := '';
BEGIN
  -- Check leave_requests
  SELECT COUNT(*) INTO v_null_count FROM leave_requests WHERE pilot_id IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('leave_requests.pilot_id has %s NULL values; ', v_null_count);
  END IF;

  SELECT COUNT(*) INTO v_null_count FROM leave_requests WHERE request_type IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('leave_requests.request_type has %s NULL values; ', v_null_count);
  END IF;

  SELECT COUNT(*) INTO v_null_count FROM leave_requests WHERE status IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('leave_requests.status has %s NULL values; ', v_null_count);
  END IF;

  -- Check pilots
  SELECT COUNT(*) INTO v_null_count FROM pilots WHERE employee_id IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('pilots.employee_id has %s NULL values; ', v_null_count);
  END IF;

  SELECT COUNT(*) INTO v_null_count FROM pilots WHERE first_name IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('pilots.first_name has %s NULL values; ', v_null_count);
  END IF;

  SELECT COUNT(*) INTO v_null_count FROM pilots WHERE role IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('pilots.role has %s NULL values; ', v_null_count);
  END IF;

  -- Check pilot_checks
  SELECT COUNT(*) INTO v_null_count FROM pilot_checks WHERE pilot_id IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('pilot_checks.pilot_id has %s NULL values; ', v_null_count);
  END IF;

  SELECT COUNT(*) INTO v_null_count FROM pilot_checks WHERE check_type_id IS NULL;
  IF v_null_count > 0 THEN
    v_error_message := v_error_message || format('pilot_checks.check_type_id has %s NULL values; ', v_null_count);
  END IF;

  -- If any NULL values found, abort migration
  IF v_error_message != '' THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraints - existing NULL values found: %', v_error_message;
  END IF;
END $$;

-- STEP 2: Add NOT NULL constraints (only if pre-check passed)

-- Leave Requests
ALTER TABLE leave_requests
  ALTER COLUMN pilot_id SET NOT NULL,
  ALTER COLUMN request_type SET NOT NULL,
  ALTER COLUMN roster_period SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN days_count SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;

-- Pilots
ALTER TABLE pilots
  ALTER COLUMN employee_id SET NOT NULL,
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL,
  ALTER COLUMN role SET NOT NULL;

-- Pilot Checks
ALTER TABLE pilot_checks
  ALTER COLUMN pilot_id SET NOT NULL,
  ALTER COLUMN check_type_id SET NOT NULL;

COMMIT;
```

**Pre-Migration Data Cleanup Query**:

```sql
-- Run this BEFORE migration to identify NULL values
SELECT
  'leave_requests.pilot_id' as column_name,
  COUNT(*) as null_count,
  array_agg(id) as record_ids
FROM leave_requests
WHERE pilot_id IS NULL

UNION ALL

SELECT
  'leave_requests.status',
  COUNT(*),
  array_agg(id)
FROM leave_requests
WHERE status IS NULL

UNION ALL

SELECT
  'pilots.employee_id',
  COUNT(*),
  array_agg(id)
FROM pilots
WHERE employee_id IS NULL

UNION ALL

SELECT
  'pilots.role',
  COUNT(*),
  array_agg(id)
FROM pilots
WHERE role IS NULL;

-- If any results returned, clean data:
-- 1. Fix if possible (add missing data)
-- 2. Delete if orphaned/invalid
```

### Option 2: Application-Level Validation Only (NOT RECOMMENDED)

**Pros**: No database migration needed

**Cons**:

- Can be bypassed with direct SQL access
- Not enforced at database level
- Unreliable protection

**Effort**: Low (Zod schemas already validate)
**Risk**: High (incomplete protection)

## Recommended Action

**IMPLEMENT OPTION 1** - Add NOT NULL constraints at database level.

Application validation already exists (Zod schemas require these fields). Database constraints provide **defense-in-depth**.

## Technical Details

**Affected Files**:

- `supabase/migrations/20251027_add_not_null_constraints.sql` (new migration)
- `types/supabase.ts` (will be updated by `npm run db:types`)
- Database schema

**Related Components**:

- Leave request submission
- Pilot creation workflow
- Certification tracking
- All CRUD operations on affected tables

**Database Changes**: Yes - NOT NULL constraints on 15+ columns

**Breaking Changes**: No - Prevents invalid data that shouldn't exist

## Type Safety Impact

**Before Migration**:

```typescript
interface LeaveRequest {
  pilot_id: string | null // ❌ TypeScript forces null checks everywhere
  status: Status | null
}

// Everywhere in code:
if (request.pilot_id !== null) {
  // Safe to use
}
```

**After Migration + Type Regeneration**:

```typescript
interface LeaveRequest {
  pilot_id: string // ✅ No null checks needed
  status: Status
}

// Simpler code:
const pilot = getPilotById(request.pilot_id) // No null check needed!
```

## Testing Strategy

### 1. Constraint Enforcement Test

```typescript
// File: lib/services/__tests__/constraint-enforcement.test.ts
test('should reject leave request without pilot_id', async () => {
  const supabase = await createClient()

  const { error } = await supabase.from('leave_requests').insert({
    // ❌ Missing pilot_id
    start_date: '2025-11-01',
    end_date: '2025-11-05',
    status: 'PENDING',
  })

  expect(error).toBeDefined()
  expect(error.code).toBe('23502') // PostgreSQL NOT NULL violation
  expect(error.message).toContain('pilot_id')
})

test('should reject pilot without employee_id', async () => {
  const supabase = await createClient()

  const { error } = await supabase.from('pilots').insert({
    first_name: 'John',
    last_name: 'Doe',
    role: 'Captain',
    // ❌ Missing employee_id
  })

  expect(error).toBeDefined()
  expect(error.code).toBe('23502')
  expect(error.message).toContain('employee_id')
})
```

### 2. Pre-Migration NULL Detection

```sql
-- Test query to verify no NULLs exist before migration
WITH null_checks AS (
  SELECT 'leave_requests' as table_name, 'pilot_id' as column_name,
         COUNT(*) FILTER (WHERE pilot_id IS NULL) as null_count
  FROM leave_requests

  UNION ALL

  SELECT 'pilots', 'employee_id',
         COUNT(*) FILTER (WHERE employee_id IS NULL)
  FROM pilots

  UNION ALL

  SELECT 'pilot_checks', 'pilot_id',
         COUNT(*) FILTER (WHERE pilot_id IS NULL)
  FROM pilot_checks
)
SELECT * FROM null_checks WHERE null_count > 0;

-- Expected: No rows (all null_count should be 0)
```

## Acceptance Criteria

- [ ] Pre-migration NULL check query returns 0 for all columns
- [ ] Any found NULL values cleaned or deleted
- [ ] Migration applied successfully in development
- [ ] All NOT NULL constraints exist in database schema
- [ ] `npm run db:types` regenerates types without `| null`
- [ ] TypeScript compilation succeeds with stricter types
- [ ] Attempt to insert NULL values fails with error code 23502
- [ ] Unit tests pass for constraint enforcement
- [ ] Migration applied to staging environment
- [ ] Migration applied to production environment
- [ ] Type definitions in codebase updated (remove unnecessary null checks)

## Work Log

### 2025-10-26 - Code Review Discovery

**By**: Data Integrity Guardian (Claude)
**Actions**:

- Analyzed Supabase type definitions
- Identified 15+ fields allowing NULL that shouldn't
- Verified application code expects NOT NULL (Zod schemas require them)
- Designed migration with pre-check safety

**Learnings**:

- Type definitions reveal database schema mismatches
- NOT NULL constraints improve type safety
- Database constraints = defense-in-depth

## Related Issues

- Finding #1: Race condition in crew availability (todos/056-pending-p1-race-condition-crew-availability.md)
- Finding #2: Missing unique constraints (todos/057-pending-p1-missing-unique-constraints.md)

## Notes

**Priority Justification**: This is P1 HIGH because:

1. Allows invalid data that breaks application logic
2. Type safety compromised (unnecessary null checks everywhere)
3. Easy fix with high impact
4. Required for data integrity guarantees

**TypeScript Benefit**: After migration, regenerating types removes `| null` from 15+ fields, eliminating hundreds of unnecessary null checks in application code.

**Deployment Strategy**:

1. Run NULL detection query in production
2. Clean any NULL values found
3. Apply migration during maintenance window
4. Regenerate types: `npm run db:types`
5. Update application code to remove unnecessary null checks (optional)
6. Deploy updated types and code
