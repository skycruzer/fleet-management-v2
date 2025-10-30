---
status: pending
priority: p1
issue_id: "056"
tags: [code-review, data-integrity, concurrency, critical, leave-system]
dependencies: []
discovered_by: data-integrity-guardian
review_date: 2025-10-26
---

# Race Condition in Crew Availability Checks

## Problem Statement

The leave eligibility system checks crew availability using two separate database queries, creating a race condition window where multiple concurrent approvals can violate the minimum crew requirement (10 Captains AND 10 First Officers).

## Findings

**Discovered during**: Comprehensive code review by Data Integrity Guardian agent
**Location**: `/lib/services/leave-eligibility-service.ts:726-869`
**Severity**: 🔴 CRITICAL

### Current Implementation Issue

```typescript
// Step 1: Get pilots (snapshot at time T1)
const { data: pilots } = await supabase
  .from('pilots')
  .select('id, role')
  .eq('is_active', true)

// ⏰ TIME PASSES - Other transactions can modify data here

// Step 2: Get leave requests (snapshot at time T2)
const { data: existingLeave } = await supabase
  .from('leave_requests')
  .select(/* ... */)
  .in('status', ['APPROVED', 'PENDING'])

// ❌ RACE CONDITION: Calculation uses INCONSISTENT DATA from T1 and T2
const availableCaptains = totalCaptains - onLeaveCaptains
```

### Attack Scenario

**Initial State**: 12 Captains available, minimum required = 10

1. **Request A** (Captain #5): Starts check, sees 12 available → Calculates 11 remaining ✅
2. **Request B** (Captain #8): Starts check simultaneously, sees 12 available → Calculates 11 remaining ✅
3. **Request C** (Captain #12): Starts check simultaneously, sees 12 available → Calculates 11 remaining ✅

**All commit**: 12 - 3 = 9 Captains available
**Result**: ❌ VIOLATED minimum 10 Captains requirement!

### Real-World Impact

- Flight operations cannot continue safely with insufficient crew
- Business rule violations during high-volume approval periods
- Data integrity compromise in production
- Potential safety violations for FAA compliance

## Proposed Solutions

### Option 1: Atomic PostgreSQL Function with Row Locking (RECOMMENDED)

**Pros**:
- Complete atomicity - no race condition possible
- Database-level locking ensures serialization
- Consistent snapshot across all queries
- Performance: Minimal overhead (row locks vs table locks)

**Cons**:
- Requires database migration
- More complex testing

**Effort**: High (8 hours)
**Risk**: Low (well-tested PostgreSQL pattern)

**Implementation**:

```sql
-- File: supabase/migrations/20251027_atomic_crew_availability.sql
CREATE OR REPLACE FUNCTION check_crew_availability_atomic(
  p_pilot_role text,
  p_start_date date,
  p_end_date date,
  p_exclude_request_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_total_pilots int;
  v_on_leave_count int;
  v_available int;
  v_minimum_required int := 10;
  v_can_approve boolean;
  v_remaining_after_approval int;
BEGIN
  -- STEP 1: Lock and count total active pilots of this role
  -- Using FOR UPDATE prevents concurrent modifications
  SELECT COUNT(*) INTO v_total_pilots
  FROM pilots
  WHERE role = p_pilot_role
    AND is_active = true
  FOR UPDATE;

  -- STEP 2: Lock and count pilots on leave during request period
  -- Using FOR UPDATE prevents concurrent leave approvals
  SELECT COUNT(DISTINCT lr.pilot_id) INTO v_on_leave_count
  FROM leave_requests lr
  INNER JOIN pilots p ON lr.pilot_id = p.id
  WHERE p.role = p_pilot_role
    AND lr.status IN ('APPROVED', 'PENDING')
    AND (lr.id != p_exclude_request_id OR p_exclude_request_id IS NULL)
    AND NOT (lr.end_date < p_start_date OR lr.start_date > p_end_date)
  FOR UPDATE OF lr;

  -- STEP 3: Calculate availability
  v_available := v_total_pilots - v_on_leave_count;
  v_remaining_after_approval := v_available - 1;
  v_can_approve := v_remaining_after_approval >= v_minimum_required;

  -- STEP 4: Return results
  RETURN jsonb_build_object(
    'total_pilots', v_total_pilots,
    'on_leave_count', v_on_leave_count,
    'available', v_available,
    'minimum_required', v_minimum_required,
    'remaining_after_approval', v_remaining_after_approval,
    'can_approve', v_can_approve,
    'reason', CASE
      WHEN v_can_approve THEN
        format('Sufficient crew: %s available after approval', v_remaining_after_approval)
      ELSE
        format('Crew shortage: Only %s would remain (minimum: %s)',
          v_remaining_after_approval, v_minimum_required)
    END
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_crew_availability_atomic TO authenticated;
```

**Service Layer Update**:

```typescript
// File: lib/services/leave-eligibility-service.ts
export async function calculateCrewAvailability(
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<CrewAvailability[]> {
  const supabase = await createClient()

  // ✅ NEW: Use atomic function for Captains
  const { data: captainCheck, error: captainError } = await supabase.rpc(
    'check_crew_availability_atomic',
    {
      p_pilot_role: 'Captain',
      p_start_date: startDate,
      p_end_date: endDate,
      p_exclude_request_id: excludeRequestId || null
    }
  )

  if (captainError) throw captainError

  // ✅ NEW: Use atomic function for First Officers
  const { data: foCheck, error: foError } = await supabase.rpc(
    'check_crew_availability_atomic',
    {
      p_pilot_role: 'First Officer',
      p_start_date: startDate,
      p_end_date: endDate,
      p_exclude_request_id: excludeRequestId || null
    }
  )

  if (foError) throw foError

  return [{
    date: startDate,
    availableCaptains: captainCheck.available,
    availableFirstOfficers: foCheck.available,
    onLeaveCaptains: captainCheck.on_leave_count,
    onLeaveFirstOfficers: foCheck.on_leave_count,
    totalCaptains: captainCheck.total_pilots,
    totalFirstOfficers: foCheck.total_pilots,
    meetsMinimum: captainCheck.can_approve && foCheck.can_approve,
    captainsShortfall: captainCheck.remaining_after_approval - 10,
    firstOfficersShortfall: foCheck.remaining_after_approval - 10
  }]
}
```

### Option 2: Application-Level Locking (NOT RECOMMENDED)

**Pros**: No database migration needed

**Cons**:
- Still vulnerable to race conditions with multiple servers
- Requires Redis or similar distributed lock
- More complex application code
- Higher failure rate

**Effort**: Medium (6 hours)
**Risk**: High (distributed locking is complex)

## Recommended Action

**IMPLEMENT OPTION 1** - Atomic PostgreSQL function with row-level locking.

This is the industry-standard solution for preventing race conditions in concurrent systems. PostgreSQL's MVCC and row-level locking provide proven reliability.

## Technical Details

**Affected Files**:
- `/lib/services/leave-eligibility-service.ts` (primary fix location)
- `supabase/migrations/20251027_atomic_crew_availability.sql` (new migration)
- `/lib/services/leave-service.ts` (caller updates)

**Related Components**:
- Leave approval workflow
- Crew availability dashboard
- Leave request validation
- Minimum crew requirement enforcement

**Database Changes**: Yes - New PostgreSQL function

**Breaking Changes**: No - Backward compatible API

## Testing Strategy

### 1. Concurrent Request Test

```typescript
// File: e2e/leave-approval-race-condition.spec.ts
test('should prevent crew minimum violations under concurrent approvals', async ({ browser }) => {
  // Setup: 12 Captains, 3 pending requests
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  const context3 = await browser.newContext()

  // All 3 admins approve simultaneously
  await Promise.all([
    context1.newPage().then(p => p.click('[data-testid="approve-1"]')),
    context2.newPage().then(p => p.click('[data-testid="approve-2"]')),
    context3.newPage().then(p => p.click('[data-testid="approve-3"]')),
  ])

  // Verify: Maximum 2 approvals, 1 denied
  const approved = await page.locator('[data-status="approved"]').count()
  const denied = await page.locator('[data-status="denied"]').count()

  expect(approved).toBe(2)
  expect(denied).toBe(1)
})
```

### 2. Load Test with Artillery

```yaml
# artillery-concurrent-approvals.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 10
      arrivalRate: 10  # 10 concurrent approvals/second

scenarios:
  - name: "Concurrent Leave Approvals"
    flow:
      - post:
          url: "/api/leave-requests/approve"
          json:
            requestId: "{{ $randomUUID() }}"
```

### 3. Database Function Test

```sql
-- Test concurrent approvals via SQL
BEGIN;
  -- Simulate 3 concurrent checks
  SELECT check_crew_availability_atomic('Captain', '2025-11-01', '2025-11-05');
  -- Should serialize and prevent violations
COMMIT;
```

## Acceptance Criteria

- [ ] PostgreSQL function created with proper locking
- [ ] Service layer updated to use atomic function
- [ ] E2E test passes with 10+ concurrent approval attempts
- [ ] Load test shows no crew minimum violations under load
- [ ] Database function grants proper permissions
- [ ] Backward compatibility maintained
- [ ] Performance benchmarks: <50ms latency for availability check
- [ ] Documentation updated with concurrency guarantees
- [ ] Code review approved by senior engineer

## Work Log

### 2025-10-26 - Code Review Discovery
**By**: Data Integrity Guardian (Claude)
**Actions**:
- Comprehensive code review of leave eligibility system
- Identified race condition in crew availability checks
- Analyzed attack scenarios and real-world impact
- Designed atomic PostgreSQL function solution

**Learnings**:
- Multi-query operations need transaction boundaries
- Row-level locking prevents phantom reads
- PostgreSQL FOR UPDATE ensures serialization

## Related Issues

- Finding #2: Missing unique constraints (todos/057-pending-p1-missing-unique-constraints.md)
- Finding #4: Missing NOT NULL constraints (todos/059-pending-p1-missing-not-null-constraints.md)

## Notes

**Priority Justification**: This is P1 CRITICAL because it directly violates FAA compliance requirements for minimum crew availability. The race condition is easily triggered during high-volume approval periods (e.g., end of roster period when multiple requests are pending).

**Deployment Strategy**: Can be deployed safely with zero downtime:
1. Deploy PostgreSQL function
2. Deploy updated service layer code
3. Monitor for any errors
4. Rollback service layer if issues (function remains harmless)
