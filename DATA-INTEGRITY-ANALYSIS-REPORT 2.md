# Data Integrity Analysis Report - Pilot Portal
## Fleet Management v2 - B767 Pilot Management System

**Analysis Date:** October 19, 2025
**Analyzed By:** Data Integrity Guardian
**Scope:** Pilot Portal self-service operations (leave requests, flight requests, certifications, feedback)
**Files Reviewed:**
- `/lib/services/pilot-portal-service.ts` (621 lines)
- `/app/portal/leave/actions.ts` (47 lines)
- `/app/portal/flights/actions.ts` (47 lines)
- `/app/portal/feedback/actions.ts` (46 lines)
- `/supabase/migrations/20251017_add_transaction_boundaries.sql` (399 lines)

---

## Executive Summary

**Overall Risk Level:** 🟡 **MEDIUM** (6 Critical Issues, 8 High Priority Issues, 5 Medium Priority Issues)

The Pilot Portal has **good architectural foundations** with service layer separation and PostgreSQL transaction functions. However, **critical data integrity risks exist** in the dual-ID relationship pattern (`pilot_users.id` vs `auth.users.id` vs `pilots.employee_id`), lack of transactional boundaries in multi-step operations, and insufficient validation at the service layer.

**Most Critical Finding:** The pilot identification chain involves **3 sequential database queries** without transaction wrapping, creating race condition windows and potential orphaned record scenarios.

---

## 1. DATABASE SCHEMA ALIGNMENT ANALYSIS

### 1.1 Critical Issue: Dual ID Relationship Pattern

**Risk Level:** 🔴 **CRITICAL** - Potential for data corruption and orphaned records

**Schema Structure:**
```
auth.users (Supabase Auth)
    ↓ (FK: pilot_users.id → auth.users.id)
pilot_users
    ↓ (FK: pilot_users.employee_id → pilots.employee_id)
pilots
    ↓ (FK: leave_requests.pilot_id → pilots.id)
    ↓ (FK: pilot_checks.pilot_id → pilots.id)
leave_requests
    ↑ (FK: leave_requests.pilot_user_id → pilot_users.id)
```

**The Problem:**
1. `pilot_users.id` references `auth.users.id` (UUID from Supabase Auth)
2. `pilot_users.employee_id` references `pilots.employee_id` (TEXT field, business key)
3. Leave/flight requests store **BOTH** `pilot_id` (UUID) AND `pilot_user_id` (UUID)

**Data Integrity Risks:**

```sql
-- RISK 1: Foreign key can be SET NULL on delete
-- leave_requests.pilot_user_id → pilot_users.id (DELETE RULE: SET NULL)
-- This means deleting a pilot_user leaves orphaned records with NULL pilot_user_id
-- but non-NULL pilot_id, creating inconsistency

-- RISK 2: Inconsistent cascade rules
-- leave_requests.pilot_id → pilots.id (DELETE RULE: CASCADE)
-- leave_requests.pilot_user_id → pilot_users.id (DELETE RULE: SET NULL)
-- These conflicting rules create unpredictable deletion behavior

-- RISK 3: No uniqueness constraint on pilot_users.employee_id
-- Multiple pilot_users can point to the same employee_id
SELECT employee_id, COUNT(*)
FROM pilot_users
GROUP BY employee_id
HAVING COUNT(*) > 1;
-- This query could reveal duplicate pilot_user accounts
```

**Example Data Corruption Scenario:**
```typescript
// Scenario: Admin deletes pilot_users record
// 1. DELETE FROM pilot_users WHERE id = 'abc-123'
// 2. leave_requests.pilot_user_id becomes NULL (SET NULL cascade)
// 3. leave_requests.pilot_id remains valid (still references pilots table)
// 4. Result: "Ghost requests" with pilot_id but no pilot_user_id
// 5. getCurrentPilotUser() returns NULL, but requests exist in database
```

**Current Code Pattern (UNSAFE):**
```typescript
// lib/services/pilot-portal-service.ts:280-299
export async function submitLeaveRequest(pilotUserId: string, leaveRequest: {...}) {
  const supabase = await createClient()

  // QUERY 1: Get pilot_users.employee_id
  const { data: pilotUser } = await supabase
    .from('pilot_users')
    .select('employee_id')
    .eq('id', pilotUserId)
    .single()

  if (!pilotUser?.employee_id) {
    throw new Error('Pilot employee_id not found')
  }

  // QUERY 2: Get pilots.id from employee_id
  const { data: pilot } = await supabase
    .from('pilots')
    .select('id')
    .eq('employee_id', pilotUser.employee_id)
    .single()

  if (!pilot) {
    throw new Error('Pilot not found')
  }

  // QUERY 3: Insert leave_request
  const { error } = await supabase.from('leave_requests').insert([{
    pilot_id: pilot.id,           // From QUERY 2
    pilot_user_id: pilotUserId,   // From input parameter
    // ... rest of fields
  }])
}
```

**Race Condition Window:**
- Between QUERY 1 and QUERY 2: `pilot_users.employee_id` could be updated
- Between QUERY 2 and QUERY 3: `pilots` record could be deleted
- Result: `leave_requests` record with mismatched IDs

---

### 1.2 Critical Issue: Missing NOT NULL Constraints

**Risk Level:** 🔴 **CRITICAL** - Silent data quality degradation

**Current Schema Nullability Issues:**

| Table | Column | Current | Should Be | Risk |
|-------|--------|---------|-----------|------|
| `leave_requests` | `pilot_id` | **NULL allowed** | NOT NULL | Orphaned requests without pilot linkage |
| `leave_requests` | `request_type` | **NULL allowed** | NOT NULL | Unknown leave type breaks business logic |
| `leave_requests` | `roster_period` | **NULL allowed** | NOT NULL | Cannot calculate eligibility without RP |
| `flight_requests` | `pilot_id` | **NOT NULL** | ✅ Correct | Properly enforced |
| `feedback_posts` | `pilot_user_id` | **NULL allowed** | Conditional | Anonymous posts need NULL, but validation missing |

**Example Data Corruption:**
```sql
-- Current schema allows this invalid data
INSERT INTO leave_requests (
  pilot_id,           -- NULL (ALLOWED BUT INVALID)
  pilot_user_id,      -- Valid UUID
  start_date,
  end_date,
  days_count,
  status
) VALUES (
  NULL,               -- WHO IS THIS REQUEST FOR?
  'abc-123-uuid',
  '2025-11-01',
  '2025-11-10',
  10,
  'PENDING'
);

-- Query breaks when trying to join to pilots table
SELECT lr.*, p.first_name, p.last_name
FROM leave_requests lr
LEFT JOIN pilots p ON p.id = lr.pilot_id
WHERE lr.pilot_user_id = 'abc-123-uuid';
-- Returns NULL for pilot name, breaking UI display
```

---

## 2. FOREIGN KEY RELATIONSHIPS & CONSTRAINTS

### 2.1 High Priority: Inconsistent Cascade Behaviors

**Current Foreign Key Constraints:**

```sql
-- INCONSISTENT DELETE RULES FOR SAME ENTITY

-- Leave Requests:
leave_requests.pilot_id → pilots.id (DELETE: CASCADE, UPDATE: NO ACTION)
leave_requests.pilot_user_id → pilot_users.id (DELETE: SET NULL, UPDATE: NO ACTION)
leave_requests.reviewed_by → an_users.id (DELETE: NO ACTION, UPDATE: NO ACTION)

-- Flight Requests:
flight_requests.pilot_id → pilots.id (DELETE: CASCADE, UPDATE: NO ACTION)
flight_requests.pilot_user_id → pilot_users.id (DELETE: CASCADE, UPDATE: NO ACTION)
flight_requests.reviewed_by → an_users.id (DELETE: NO ACTION, UPDATE: NO ACTION)

-- Feedback Posts:
feedback_posts.pilot_user_id → pilot_users.id (DELETE: SET NULL, UPDATE: NO ACTION)
feedback_posts.category_id → feedback_categories.id (DELETE: SET NULL, UPDATE: NO ACTION)
```

**CRITICAL INCONSISTENCY:**
- `leave_requests.pilot_user_id` uses **SET NULL** on delete
- `flight_requests.pilot_user_id` uses **CASCADE** on delete

**Problem:** Deleting a `pilot_users` record:
- Deletes ALL flight requests (CASCADE)
- Keeps ALL leave requests but sets `pilot_user_id` to NULL (SET NULL)
- **INCONSISTENT DATA PRESERVATION BEHAVIOR**

**Expected Behavior for Production System:**
Both should use the **SAME** cascade rule to maintain data consistency.

---

### 2.2 High Priority: Missing Referential Integrity on employee_id

**Risk Level:** 🟠 **HIGH** - Data duplication and integrity violations

**Current Relationship:**
```sql
-- pilot_users.employee_id is TEXT (not UUID)
-- References pilots.employee_id (also TEXT)
-- NO UNIQUE CONSTRAINT on pilot_users.employee_id
```

**The Problem:**
```sql
-- Schema allows multiple pilot_users with same employee_id
INSERT INTO pilot_users (id, email, employee_id, first_name, last_name)
VALUES
  (gen_random_uuid(), 'pilot1@airline.com', 'EMP001', 'John', 'Doe'),
  (gen_random_uuid(), 'pilot1.alt@airline.com', 'EMP001', 'John', 'Doe');
  -- ALLOWED! Same employee_id, different auth accounts

-- Now getCurrentPilotUser() has ambiguity
SELECT * FROM pilot_users WHERE email = 'pilot1@airline.com';  -- Returns EMP001
SELECT * FROM pilots WHERE employee_id = 'EMP001';             -- Returns 1 record

-- But which pilot_user is "correct"?
-- What if one account has registration_approved=true and other=false?
```

**Missing Database Constraint:**
```sql
-- SHOULD EXIST:
ALTER TABLE pilot_users
ADD CONSTRAINT pilot_users_employee_id_unique
UNIQUE (employee_id);
```

---

## 3. DATA VALIDATION AT SERVICE LAYER

### 3.1 Critical Issue: No Validation of Required Fields

**Risk Level:** 🔴 **CRITICAL** - Invalid data bypasses database constraints

**Current Service Layer (NO VALIDATION):**
```typescript
// lib/services/pilot-portal-service.ts:265-326
export async function submitLeaveRequest(
  pilotUserId: string,
  leaveRequest: {
    request_type: string      // NO VALIDATION
    start_date: string        // NO DATE FORMAT VALIDATION
    end_date: string          // NO DATE FORMAT VALIDATION
    days_count: number        // NO RANGE VALIDATION
    roster_period: string     // NO FORMAT VALIDATION
    reason?: string
  }
): Promise<void> {
  // Direct insert without validation
  const { error } = await supabase.from('leave_requests').insert([{
    request_type: leaveRequest.request_type,  // Could be empty string!
    start_date: leaveRequest.start_date,      // Could be invalid date!
    days_count: leaveRequest.days_count,      // Could be negative!
    roster_period: leaveRequest.roster_period // Could be "invalid"!
  }])
}
```

**Missing Validations:**

| Field | Missing Validation | Risk |
|-------|-------------------|------|
| `request_type` | Enum validation | Could insert 'INVALID_TYPE' |
| `start_date` | Date format | Could insert '2025-13-45' |
| `end_date` | Date logic | end_date could be before start_date |
| `days_count` | Range check | Could be negative or zero |
| `roster_period` | Format validation | Could be 'RP99/2025' (invalid) |
| `pilotUserId` | UUID format | Could be malformed string |

**Example Attack Vector:**
```typescript
// Malicious or buggy client could send:
await submitLeaveRequest('not-a-uuid', {
  request_type: 'DROP TABLE leave_requests;--',
  start_date: '2025-99-99',
  end_date: '2025-01-01',  // Before start_date!
  days_count: -999,
  roster_period: 'INVALID',
  reason: 'x'.repeat(1000000)  // 1MB of text
})
```

---

### 3.2 High Priority: No Business Rule Validation

**Risk Level:** 🟠 **HIGH** - Invalid business data accepted

**Missing Business Validations:**

1. **Date Range Validation:**
```typescript
// SHOULD VALIDATE: end_date must be after start_date
if (new Date(leaveRequest.end_date) < new Date(leaveRequest.start_date)) {
  throw new Error('End date must be after start date')
}
```

2. **Days Count Calculation Validation:**
```typescript
// SHOULD VALIDATE: days_count matches date range
const actualDays = calculateDaysBetween(start_date, end_date)
if (actualDays !== leaveRequest.days_count) {
  throw new Error('Days count mismatch')
}
```

3. **Roster Period Format Validation:**
```typescript
// SHOULD VALIDATE: Format is RPxx/YYYY
const rosterPeriodRegex = /^RP(0[1-9]|1[0-3])\/20\d{2}$/
if (!rosterPeriodRegex.test(leaveRequest.roster_period)) {
  throw new Error('Invalid roster period format')
}
```

4. **Request Type Enum Validation:**
```typescript
// SHOULD VALIDATE: Against database CHECK constraint
const VALID_REQUEST_TYPES = ['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE']
if (!VALID_REQUEST_TYPES.includes(leaveRequest.request_type)) {
  throw new Error('Invalid request type')
}
```

---

## 4. TRANSACTION BOUNDARIES IN MULTI-STEP OPERATIONS

### 4.1 Critical Issue: No Transaction Wrapping in Service Functions

**Risk Level:** 🔴 **CRITICAL** - Partial writes and data corruption

**Current Pattern (UNSAFE):**
```typescript
// lib/services/pilot-portal-service.ts:280-326
export async function submitLeaveRequest(pilotUserId: string, leaveRequest: {...}) {
  const supabase = await createClient()

  // STEP 1: Query pilot_users (Separate transaction)
  const { data: pilotUser } = await supabase
    .from('pilot_users')
    .select('employee_id')
    .eq('id', pilotUserId)
    .single()

  // RACE CONDITION WINDOW #1: pilotUser could be deleted here

  // STEP 2: Query pilots (Separate transaction)
  const { data: pilot } = await supabase
    .from('pilots')
    .select('id')
    .eq('employee_id', pilotUser.employee_id)
    .single()

  // RACE CONDITION WINDOW #2: pilot could be deleted here

  // STEP 3: Insert leave_request (Separate transaction)
  const { error } = await supabase.from('leave_requests').insert([{
    pilot_id: pilot.id,          // Could now be invalid!
    pilot_user_id: pilotUserId,  // Could now be invalid!
    // ...
  }])
}
```

**The Problem:**
- Each Supabase query is a **separate HTTP request** (separate transaction)
- Between queries, data can change
- No rollback capability if STEP 3 fails after STEP 1 and STEP 2 succeed

**Partial Write Scenario:**
```typescript
// 1. STEP 1 succeeds: pilotUser = { employee_id: 'EMP001' }
// 2. STEP 2 succeeds: pilot = { id: 'uuid-xyz' }
// 3. CONCURRENT DELETE: Admin deletes pilot record
// 4. STEP 3 executes: INSERT with pilot_id = 'uuid-xyz' (now invalid)
// 5. Result: Foreign key violation OR orphaned record (if FK is SET NULL)
```

---

### 4.2 High Priority: PostgreSQL Functions Not Used by Service Layer

**Current State:**
- Migration `20251017_add_transaction_boundaries.sql` defines **5 transactional functions**
- Service layer (`pilot-portal-service.ts`) **DOES NOT USE THEM**
- All operations still use multi-query non-transactional pattern

**Available Transaction Functions (NOT USED):**

1. `approve_leave_request(request_id, reviewer_id, status, comments)` - Atomic approval + audit log
2. `create_pilot_with_certifications(pilot_data, certifications)` - Atomic pilot + certs creation
3. `batch_update_certifications(updates)` - Atomic multi-cert update
4. `delete_pilot_with_cascade(pilot_id)` - Atomic pilot deletion with cleanup
5. `bulk_delete_certifications(certification_ids)` - Atomic multi-cert deletion

**Why This is a Problem:**
- Functions provide ACID guarantees
- Service layer bypasses them, creating race conditions
- Transaction rollback impossible in current implementation

**Example: Should Use Function but Doesn't:**
```typescript
// CURRENT (UNSAFE):
export async function submitLeaveRequest(pilotUserId, leaveRequest) {
  // 3 separate queries, no transaction
}

// SHOULD BE (SAFE):
export async function submitLeaveRequest(pilotUserId, leaveRequest) {
  const { data } = await supabase.rpc('create_leave_request_atomic', {
    p_pilot_user_id: pilotUserId,
    p_request_data: leaveRequest
  })
  // Single atomic operation with rollback capability
}
```

---

## 5. RACE CONDITION RISKS

### 5.1 Critical Issue: Pilot Lookup Chain Race Condition

**Risk Level:** 🔴 **CRITICAL** - Duplicate requests or orphaned data

**Attack Surface:**
```typescript
// RACE CONDITION IN PARALLEL REQUEST SUBMISSIONS
// Two browser tabs submit leave request simultaneously

// TAB 1                                    // TAB 2
submitLeaveRequest('user-123', request1)  submitLeaveRequest('user-123', request2)
  QUERY 1: Get employee_id                  QUERY 1: Get employee_id
  → employee_id = 'EMP001'                   → employee_id = 'EMP001'

  QUERY 2: Get pilot.id                     QUERY 2: Get pilot.id
  → pilot_id = 'uuid-abc'                    → pilot_id = 'uuid-abc'

  INSERT leave_request                      INSERT leave_request
  → pilot_id = 'uuid-abc'                    → pilot_id = 'uuid-abc'
  → dates: Nov 1-10                          → dates: Nov 1-10 (DUPLICATE!)
  → status: PENDING                          → status: PENDING

// RESULT: Two identical leave requests for same pilot, same dates
```

**No Uniqueness Constraint:**
```sql
-- MISSING CONSTRAINT:
-- Should prevent duplicate requests for same pilot + dates + roster_period
ALTER TABLE leave_requests
ADD CONSTRAINT unique_pilot_dates_per_roster
UNIQUE (pilot_id, roster_period, start_date, end_date);
```

---

### 5.2 High Priority: getCurrentPilotUser Race Condition

**Risk Level:** 🟠 **HIGH** - Inconsistent authentication state

**Current Implementation:**
```typescript
// lib/services/pilot-portal-service.ts:107-133
export async function getCurrentPilotUser(): Promise<PilotUser | null> {
  const supabase = await createClient()

  // QUERY 1: Get auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // RACE CONDITION WINDOW: user could be deleted from pilot_users here

  // QUERY 2: Get pilot_users record
  const { data, error } = await supabase
    .from('pilot_users')
    .select('*')
    .eq('email', user.email)  // USING EMAIL, NOT ID!
    .single()

  if (error) {
    console.error('Error fetching pilot user:', error)
    return null
  }

  return data
}
```

**Problems:**

1. **Using email instead of ID:**
```typescript
// SHOULD BE:
.eq('id', user.id)  // Direct UUID match

// CURRENTLY:
.eq('email', user.email)  // String comparison, slower + less reliable
```

2. **No transaction wrapping:**
- Auth user could be valid
- pilot_users record could be missing (not yet created or deleted)
- Result: Inconsistent state

3. **Silent error handling:**
```typescript
if (error) {
  console.error('Error fetching pilot user:', error)
  return null  // Swallows error, user thinks they're not logged in
}
```

---

## 6. DATA CONSISTENCY IN SUBMISSIONS

### 6.1 Medium Priority: Duplicate Submission Prevention

**Risk Level:** 🟡 **MEDIUM** - User experience and data quality

**Current State:** No duplicate detection

**Scenarios:**

1. **Network Timeout Retry:**
```typescript
// User clicks "Submit Leave Request"
// Network is slow, appears to hang
// User clicks "Submit" again
// First request completes → INSERT successful
// Second request completes → INSERT successful (DUPLICATE!)
```

2. **Missing Idempotency Key:**
```typescript
// SHOULD HAVE:
export async function submitLeaveRequest(
  pilotUserId: string,
  leaveRequest: {...},
  idempotencyKey?: string  // Missing!
) {
  // Check if request with this key already exists
  if (idempotencyKey) {
    const existing = await checkExisting(idempotencyKey)
    if (existing) return existing  // Return cached result
  }
  // Proceed with insert
}
```

---

### 6.2 Medium Priority: Optimistic Concurrency Control

**Risk Level:** 🟡 **MEDIUM** - Lost updates

**Current State:** No version tracking

**Example Lost Update:**
```typescript
// ADMIN 1: Reviews leave request
const request = await getLeaveRequest('req-123')
// request.status = 'PENDING'

// ADMIN 2: Reviews same request (concurrent)
const request = await getLeaveRequest('req-123')
// request.status = 'PENDING'

// ADMIN 1: Approves
await updateLeaveRequest('req-123', { status: 'APPROVED' })

// ADMIN 2: Denies (overwrites ADMIN 1's approval!)
await updateLeaveRequest('req-123', { status: 'DENIED' })

// RESULT: ADMIN 1's approval is lost, no audit trail of conflict
```

**Solution:**
```sql
-- Add version column to leave_requests
ALTER TABLE leave_requests ADD COLUMN version INTEGER DEFAULT 1;

-- Update with version check
UPDATE leave_requests
SET status = 'APPROVED', version = version + 1
WHERE id = 'req-123' AND version = 1;  -- Only update if version matches
-- Returns 0 rows if version mismatch (concurrent update detected)
```

---

## 7. ANONYMOUS FEEDBACK DATA INTEGRITY

### 7.1 High Priority: Anonymity Enforcement Gap

**Risk Level:** 🟠 **HIGH** - Privacy violation / GDPR compliance

**Current Implementation:**
```typescript
// lib/services/pilot-portal-service.ts:585-620
export async function submitFeedbackPost(
  pilotUserId: string,
  feedbackData: {
    title: string
    content: string
    category_id?: string
    is_anonymous?: boolean
    author_display_name: string  // ALWAYS PROVIDED BY CLIENT
    author_rank: string          // ALWAYS PROVIDED BY CLIENT
  }
): Promise<void> {
  const { error } = await supabase.from('feedback_posts').insert([{
    pilot_user_id: pilotUserId,  // ALWAYS STORED (even for anonymous!)
    author_display_name: feedbackData.is_anonymous
      ? 'Anonymous Pilot'
      : feedbackData.author_display_name,
    author_rank: feedbackData.is_anonymous
      ? null
      : feedbackData.author_rank,
    is_anonymous: feedbackData.is_anonymous || false,
  }])
}
```

**The Problem:**
```sql
-- Anonymous post stores pilot_user_id
SELECT * FROM feedback_posts WHERE is_anonymous = true;

-- Result:
id: 'post-123'
pilot_user_id: 'user-abc'  -- REVEALS IDENTITY IN DATABASE!
is_anonymous: true
author_display_name: 'Anonymous Pilot'
author_rank: NULL
```

**Privacy Risk:**
- Database admin can see `pilot_user_id` even for anonymous posts
- JOIN to `pilot_users` reveals full identity
- Violates anonymity promise to pilots

**Server Action Has Same Issue:**
```typescript
// app/portal/feedback/actions.ts:27-28
author_display_name: `${pilotUser.rank} ${pilotUser.first_name} ${pilotUser.last_name}`,
author_rank: pilotUser.rank,
// These are constructed from pilotUser object, then conditionally overwritten
// But pilotUser data is already logged in service function
```

**Solution:**
```typescript
export async function submitFeedbackPost(
  pilotUserId: string,
  feedbackData: {...}
): Promise<void> {
  const { error } = await supabase.from('feedback_posts').insert([{
    pilot_user_id: feedbackData.is_anonymous ? null : pilotUserId,  // NULL for anonymous
    // ... rest of fields
  }])
}
```

---

### 7.2 Medium Priority: Feedback Post Validation

**Risk Level:** 🟡 **MEDIUM** - Data quality

**Missing Validations:**

```typescript
// SHOULD VALIDATE:
export async function submitFeedbackPost(pilotUserId: string, feedbackData: {...}) {
  // 1. Title length (database has CHECK: 3-200 chars)
  if (feedbackData.title.length < 3 || feedbackData.title.length > 200) {
    throw new Error('Title must be 3-200 characters')
  }

  // 2. Content length (database has CHECK: min 10 chars)
  if (feedbackData.content.length < 10) {
    throw new Error('Content must be at least 10 characters')
  }

  // 3. Category exists and is not archived
  if (feedbackData.category_id) {
    const category = await validateCategory(feedbackData.category_id)
    if (!category || category.is_archived) {
      throw new Error('Invalid or archived category')
    }
  }

  // 4. XSS prevention (sanitize HTML)
  feedbackData.content = sanitizeHTML(feedbackData.content)
  feedbackData.title = sanitizeHTML(feedbackData.title)
}
```

---

## 8. NULL HANDLING AND REQUIRED FIELDS

### 8.1 High Priority: Inconsistent Null Handling

**Risk Level:** 🟠 **HIGH** - Unpredictable application behavior

**Problematic Patterns:**

```typescript
// lib/services/pilot-portal-service.ts:149-151
if (!pilotUser?.employee_id) {
  throw new Error('Pilot employee_id not found')
}

// PROBLEM: Truthy check on employee_id
// employee_id could be empty string ''
// Empty string is falsy, so this throws error
// But database allows empty string (it's not NULL)

// SHOULD BE:
if (!pilotUser?.employee_id || pilotUser.employee_id.trim() === '') {
  throw new Error('Pilot employee_id not found')
}
```

**Null vs Undefined Confusion:**
```typescript
// Server Actions extract form data with type assertions
const data = {
  reason: formData.get('reason') as string | undefined,
  // FormData.get() returns string | null, NOT undefined
  // Type assertion is incorrect
}

// CORRECT:
const reason = formData.get('reason')
const data = {
  reason: reason ? reason.toString() : undefined,
}
```

---

### 8.2 Medium Priority: Optional Fields Not Validated

**Risk Level:** 🟡 **MEDIUM** - Invalid optional data

**Current Pattern:**
```typescript
// Optional fields accepted without validation
export async function submitLeaveRequest(
  pilotUserId: string,
  leaveRequest: {
    reason?: string  // No length validation
  }
) {
  // Direct insert
  const { error } = await supabase.from('leave_requests').insert([{
    reason: leaveRequest.reason,  // Could be 1MB of text!
  }])
}
```

**Missing Constraints:**
```sql
-- Database has no CHECK constraint on reason length
-- Should add:
ALTER TABLE leave_requests
ADD CONSTRAINT reason_max_length
CHECK (char_length(reason) <= 5000);
```

---

## 9. SERVER ACTIONS ERROR HANDLING

### 9.1 High Priority: Insufficient Error Information

**Risk Level:** 🟠 **HIGH** - Debugging difficulty and user confusion

**Current Pattern:**
```typescript
// app/portal/leave/actions.ts:39-44
} catch (error) {
  console.error('Error submitting leave request:', error)
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Failed to submit leave request'
  }
}
```

**Problems:**

1. **Generic Error Messages:**
```typescript
// User sees: "Failed to submit leave request"
// No details about WHAT failed
// Could be: validation, database, network, permissions, etc.
```

2. **No Error Codes:**
```typescript
// SHOULD HAVE:
return {
  success: false,
  errorCode: 'VALIDATION_ERROR' | 'PILOT_NOT_FOUND' | 'DATABASE_ERROR',
  error: 'Specific error message',
  field: 'roster_period'  // Which field caused the error
}
```

3. **No Rollback Information:**
```typescript
// If multi-step operation fails, user doesn't know:
// - Which step failed
// - What was already committed
// - Whether retry is safe
```

---

### 9.2 Medium Priority: No Validation Before Service Call

**Risk Level:** 🟡 **MEDIUM** - Unnecessary database queries

**Current Server Actions:**
```typescript
// app/portal/leave/actions.ts:22-30
const data = {
  request_type: formData.get('request_type') as string,
  start_date: formData.get('start_date') as string,
  end_date: formData.get('end_date') as string,
  roster_period: formData.get('roster_period') as string,
  reason: formData.get('reason') as string | undefined,
  days_count: parseInt(formData.get('days_count') as string),
}

// NO VALIDATION HERE
await submitLeaveRequest(pilotUser.id, data)
```

**Should Validate Before Service Call:**
```typescript
// Validate in Server Action BEFORE calling service
const errors = []

if (!data.request_type) errors.push('Request type required')
if (!data.start_date) errors.push('Start date required')
if (isNaN(data.days_count)) errors.push('Invalid days count')

if (errors.length > 0) {
  return { success: false, errors }  // Return early, don't call service
}

await submitLeaveRequest(pilotUser.id, data)
```

---

## 10. ROW LEVEL SECURITY (RLS) POLICY ENFORCEMENT

### 10.1 Analysis of RLS Coverage

**Tables Reviewed:** All have `rls_enabled: true`

**Good:**
- All tables in schema have RLS enabled
- Prevents direct database access bypass

**Concern:**
```typescript
// Service layer uses server-side Supabase client
// Server-side client may use service_role key (bypasses RLS)
// Need to verify which key is used

// lib/supabase/server.ts - Need to review
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Bypasses RLS!
  // vs
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // Respects RLS
)
```

**Recommendation:**
Verify that pilot portal service functions use **anon key** (respects RLS), not service_role key.

---

## RECOMMENDATIONS

### Priority 1: CRITICAL (Immediate Action Required)

#### 1.1 Add Database Constraints
```sql
-- File: supabase/migrations/20251019_add_integrity_constraints.sql

-- 1. Make pilot_id NOT NULL in leave_requests
ALTER TABLE leave_requests
ALTER COLUMN pilot_id SET NOT NULL;

-- 2. Add unique constraint on pilot_users.employee_id
ALTER TABLE pilot_users
ADD CONSTRAINT pilot_users_employee_id_unique
UNIQUE (employee_id);

-- 3. Prevent duplicate leave requests
ALTER TABLE leave_requests
ADD CONSTRAINT unique_pilot_dates_per_roster
UNIQUE (pilot_id, roster_period, start_date, end_date);

-- 4. Add CHECK constraint for date logic
ALTER TABLE leave_requests
ADD CONSTRAINT end_date_after_start_date
CHECK (end_date >= start_date);

-- 5. Add CHECK constraint for positive days_count
ALTER TABLE leave_requests
ADD CONSTRAINT days_count_positive
CHECK (days_count > 0);

-- 6. Add max length for reason fields
ALTER TABLE leave_requests
ADD CONSTRAINT reason_max_length
CHECK (char_length(reason) <= 5000);

ALTER TABLE flight_requests
ADD CONSTRAINT reason_max_length
CHECK (char_length(reason) <= 5000);
```

#### 1.2 Wrap Multi-Step Operations in Transactions
```typescript
// File: lib/services/pilot-portal-service.ts

// CREATE NEW POSTGRESQL FUNCTION:
-- supabase/migrations/20251019_create_leave_request_atomic.sql
CREATE OR REPLACE FUNCTION create_leave_request_atomic(
  p_pilot_user_id uuid,
  p_request_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_pilot_id uuid;
  v_employee_id text;
  v_request_id uuid;
  v_result jsonb;
BEGIN
  -- Step 1: Get employee_id and pilot_id in single transaction
  SELECT pu.employee_id, p.id
  INTO v_employee_id, v_pilot_id
  FROM pilot_users pu
  JOIN pilots p ON p.employee_id = pu.employee_id
  WHERE pu.id = p_pilot_user_id
    AND pu.registration_approved = true;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found or not approved';
  END IF;

  -- Step 2: Insert leave request
  INSERT INTO leave_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    start_date,
    end_date,
    days_count,
    roster_period,
    reason,
    status,
    submission_type,
    request_date,
    request_method
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_data->>'request_type',
    (p_request_data->>'start_date')::date,
    (p_request_data->>'end_date')::date,
    (p_request_data->>'days_count')::integer,
    p_request_data->>'roster_period',
    p_request_data->>'reason',
    'PENDING',
    'pilot',
    CURRENT_DATE,
    'SYSTEM'
  ) RETURNING id INTO v_request_id;

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Leave request submitted successfully'
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create leave request: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- UPDATE SERVICE FUNCTION:
export async function submitLeaveRequest(
  pilotUserId: string,
  leaveRequest: {...}
): Promise<void> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('create_leave_request_atomic', {
    p_pilot_user_id: pilotUserId,
    p_request_data: leaveRequest
  })

  if (error) {
    throw new Error(`Failed to submit leave request: ${error.message}`)
  }
}
```

#### 1.3 Fix Anonymous Feedback Privacy Violation
```typescript
// File: lib/services/pilot-portal-service.ts

export async function submitFeedbackPost(
  pilotUserId: string,
  feedbackData: {...}
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('feedback_posts').insert([{
    // CRITICAL FIX: Set pilot_user_id to NULL for anonymous posts
    pilot_user_id: feedbackData.is_anonymous ? null : pilotUserId,
    title: feedbackData.title,
    content: feedbackData.content,
    category_id: feedbackData.category_id || null,
    is_anonymous: feedbackData.is_anonymous || false,
    author_display_name: feedbackData.is_anonymous
      ? 'Anonymous Pilot'
      : feedbackData.author_display_name,
    author_rank: feedbackData.is_anonymous
      ? null
      : feedbackData.author_rank,
    status: 'published',
  }])

  if (error) {
    throw new Error(`Failed to submit feedback post: ${error.message}`)
  }
}
```

#### 1.4 Add Comprehensive Validation Layer
```typescript
// File: lib/validation/pilot-portal-validation.ts

import { z } from 'zod'

export const LeaveRequestSchema = z.object({
  request_type: z.enum(['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  days_count: z.number().int().positive('Days count must be positive'),
  roster_period: z.string().regex(/^RP(0[1-9]|1[0-3])\/20\d{2}$/, 'Invalid roster period'),
  reason: z.string().max(5000, 'Reason too long').optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be after start date', path: ['end_date'] }
)

export const FlightRequestSchema = z.object({
  request_type: z.enum(['ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_PREFERENCE', 'TRAINING_FLIGHT', 'OTHER']),
  flight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  description: z.string().min(10, 'Description too short').max(5000, 'Description too long'),
  reason: z.string().max(5000, 'Reason too long').optional(),
})

export const FeedbackPostSchema = z.object({
  title: z.string().min(3, 'Title too short').max(200, 'Title too long'),
  content: z.string().min(10, 'Content too short').max(10000, 'Content too long'),
  category_id: z.string().uuid('Invalid category').optional(),
  is_anonymous: z.boolean().optional(),
  author_display_name: z.string().min(1, 'Author name required'),
  author_rank: z.string().optional(),
})

// UPDATE SERVICE FUNCTIONS:
export async function submitLeaveRequest(
  pilotUserId: string,
  leaveRequest: unknown
): Promise<void> {
  // VALIDATE FIRST
  const validated = LeaveRequestSchema.parse(leaveRequest)

  // Then proceed with database operation
  const supabase = await createClient()
  // ... rest of function
}
```

---

### Priority 2: HIGH (Address Within 1 Week)

#### 2.1 Standardize Foreign Key Cascade Rules
```sql
-- File: supabase/migrations/20251019_standardize_cascade_rules.sql

-- Make pilot_user_id CASCADE consistent across tables
ALTER TABLE leave_requests
DROP CONSTRAINT leave_requests_pilot_user_id_fkey,
ADD CONSTRAINT leave_requests_pilot_user_id_fkey
  FOREIGN KEY (pilot_user_id)
  REFERENCES pilot_users(id)
  ON DELETE CASCADE;  -- Changed from SET NULL

-- Or if you want to preserve data:
ALTER TABLE flight_requests
DROP CONSTRAINT flight_requests_pilot_user_id_fkey,
ADD CONSTRAINT flight_requests_pilot_user_id_fkey
  FOREIGN KEY (pilot_user_id)
  REFERENCES pilot_users(id)
  ON DELETE SET NULL;  -- Changed from CASCADE

-- RECOMMENDATION: Use CASCADE for data cleanup
-- Deleted pilot_users should remove all their requests
```

#### 2.2 Fix getCurrentPilotUser to Use ID Instead of Email
```typescript
// File: lib/services/pilot-portal-service.ts

export async function getCurrentPilotUser(): Promise<PilotUser | null> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // FIX: Use ID instead of email for direct match
    const { data, error } = await supabase
      .from('pilot_users')
      .select('*')
      .eq('id', user.id)  // CHANGED: was .eq('email', user.email)
      .single()

    if (error) {
      // FIX: Don't swallow errors, throw them
      throw new Error(`Failed to fetch pilot user: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in getCurrentPilotUser:', error)
    throw error  // CHANGED: was return null
  }
}
```

#### 2.3 Add Idempotency Key Support
```typescript
// File: lib/services/pilot-portal-service.ts

export async function submitLeaveRequest(
  pilotUserId: string,
  leaveRequest: {...},
  idempotencyKey?: string
): Promise<{ id: string; isDuplicate: boolean }> {
  const supabase = await createClient()

  // Check for duplicate submission
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('pilot_user_id', pilotUserId)
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existing) {
      return { id: existing.id, isDuplicate: true }
    }
  }

  // Proceed with insert
  const { data, error } = await supabase
    .from('leave_requests')
    .insert([{
      ...leaveRequest,
      pilot_user_id: pilotUserId,
      idempotency_key: idempotencyKey,
    }])
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id, isDuplicate: false }
}

// ADD TO DATABASE SCHEMA:
-- ALTER TABLE leave_requests ADD COLUMN idempotency_key TEXT UNIQUE;
```

---

### Priority 3: MEDIUM (Address Within 2 Weeks)

#### 3.1 Add Optimistic Concurrency Control
```sql
-- File: supabase/migrations/20251019_add_version_tracking.sql

ALTER TABLE leave_requests ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE flight_requests ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE feedback_posts ADD COLUMN version INTEGER DEFAULT 1;

-- Create update function with version check
CREATE OR REPLACE FUNCTION update_leave_request_with_version(
  p_request_id uuid,
  p_status text,
  p_version integer,
  p_reviewer_id uuid,
  p_comments text
) RETURNS jsonb AS $$
DECLARE
  v_rows_updated integer;
  v_result jsonb;
BEGIN
  UPDATE leave_requests
  SET
    status = p_status,
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_comments = p_comments,
    version = version + 1,
    updated_at = now()
  WHERE id = p_request_id
    AND version = p_version;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION 'Concurrent update detected. Please refresh and try again.';
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'new_version', p_version + 1
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

#### 3.2 Improve Error Handling with Error Codes
```typescript
// File: lib/errors/pilot-portal-errors.ts

export enum PilotPortalErrorCode {
  PILOT_NOT_FOUND = 'PILOT_NOT_FOUND',
  PILOT_NOT_APPROVED = 'PILOT_NOT_APPROVED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
  CONCURRENT_UPDATE = 'CONCURRENT_UPDATE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export class PilotPortalError extends Error {
  constructor(
    public code: PilotPortalErrorCode,
    message: string,
    public field?: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PilotPortalError'
  }
}

// UPDATE SERVICE FUNCTIONS:
export async function submitLeaveRequest(...) {
  const validated = LeaveRequestSchema.safeParse(leaveRequest)

  if (!validated.success) {
    throw new PilotPortalError(
      PilotPortalErrorCode.VALIDATION_ERROR,
      'Invalid leave request data',
      validated.error.errors[0]?.path[0] as string,
      { errors: validated.error.errors }
    )
  }

  // ... rest of function
}

// UPDATE SERVER ACTIONS:
export async function submitLeaveRequestAction(formData: FormData) {
  try {
    await submitLeaveRequest(pilotUser.id, data)
    return { success: true }
  } catch (error) {
    if (error instanceof PilotPortalError) {
      return {
        success: false,
        errorCode: error.code,
        error: error.message,
        field: error.field,
      }
    }
    return {
      success: false,
      errorCode: 'UNKNOWN_ERROR',
      error: 'An unexpected error occurred',
    }
  }
}
```

---

## SUMMARY OF RISKS

### Critical Risks (6)
1. ✅ **Dual ID relationship pattern** - Race conditions and orphaned records
2. ✅ **Missing NOT NULL constraints** - Silent data quality degradation
3. ✅ **No transaction wrapping** - Partial writes and data corruption
4. ✅ **No validation layer** - Invalid data bypasses database constraints
5. ✅ **Pilot lookup chain race condition** - Duplicate or orphaned requests
6. ✅ **Anonymous feedback privacy violation** - GDPR compliance risk

### High Priority Risks (8)
1. Inconsistent cascade behaviors across tables
2. Missing referential integrity on employee_id
3. No business rule validation (dates, roster periods, etc.)
4. PostgreSQL transaction functions not used by service layer
5. getCurrentPilotUser race condition and uses email instead of ID
6. Anonymity enforcement gap in feedback posts
7. Inconsistent null handling patterns
8. Insufficient error information in server actions

### Medium Priority Risks (5)
1. No duplicate submission prevention
2. No optimistic concurrency control
3. Feedback post validation gaps
4. Optional fields not validated
5. No validation before service call in server actions

---

## COMPLIANCE NOTES

### GDPR/Privacy Compliance
- ⚠️ **CRITICAL:** Anonymous feedback stores `pilot_user_id`, violating anonymity promise
- ✅ Audit logging exists for leave request approvals
- ⚠️ No data retention policy enforcement in code

### FAA/Aviation Standards
- ✅ Color-coded certification status (red/yellow/green)
- ✅ Roster period system aligns with 28-day cycles
- ⚠️ No certification expiry alerts implemented in pilot portal
- ✅ Leave eligibility tracking by rank separation

### Data Integrity Standards
- ⚠️ **CRITICAL:** ACID properties violated by multi-query operations without transactions
- ⚠️ Referential integrity partially enforced (inconsistent cascade rules)
- ⚠️ No uniqueness constraints on business keys (pilot_users.employee_id)
- ✅ RLS enabled on all tables

---

## NEXT STEPS

### Immediate (This Week)
1. Apply database constraints migration (`20251019_add_integrity_constraints.sql`)
2. Fix anonymous feedback privacy violation
3. Add Zod validation layer

### Short-term (Within 2 Weeks)
1. Create atomic transaction functions for all multi-step operations
2. Standardize foreign key cascade rules
3. Fix getCurrentPilotUser to use ID instead of email
4. Implement error code system

### Medium-term (Within 1 Month)
1. Add optimistic concurrency control
2. Implement idempotency key support
3. Create comprehensive integration tests
4. Add monitoring and alerting for data integrity violations

---

**Report Generated:** October 19, 2025
**Reviewed System:** Fleet Management v2 - Pilot Portal
**Database:** Supabase (Project: wgdmgvonqysflwdiiols)
**Total Issues Found:** 19 (6 Critical, 8 High, 5 Medium)
