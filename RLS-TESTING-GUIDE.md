# RLS Testing Guide

**Developer**: Maurice Rondeau
**Date**: October 27, 2025
**Sprint**: Sprint 1 Days 3-4 (Task 4)

---

## 🎯 Overview

This guide provides step-by-step instructions for testing Row Level Security (RLS) policies in Supabase.

---

## 🧪 Testing Methodology

### Test Approach

1. **Create Test Users** - Set up users with different roles
2. **Test Each Policy** - Verify expected behavior for each operation
3. **Test Edge Cases** - Check boundary conditions and error scenarios
4. **Document Results** - Record pass/fail for each test

---

## 👥 Test User Setup

### Step 1: Create Test Accounts

```sql
-- Admin user
INSERT INTO an_users (id, email, role, first_name, last_name, status)
VALUES (
  gen_random_uuid(),
  'test-admin@fleet.com',
  'Admin',
  'Test',
  'Admin',
  'active'
);

-- Manager user
INSERT INTO an_users (id, email, role, first_name, last_name, status)
VALUES (
  gen_random_uuid(),
  'test-manager@fleet.com',
  'Manager',
  'Test',
  'Manager',
  'active'
);

-- Pilot user A
INSERT INTO an_users (id, email, role, first_name, last_name, status)
VALUES (
  gen_random_uuid(),
  'test-pilot-a@fleet.com',
  'Pilot',
  'Test',
  'Pilot A',
  'active'
);

-- Pilot user B
INSERT INTO an_users (id, email, role, first_name, last_name, status)
VALUES (
  gen_random_uuid(),
  'test-pilot-b@fleet.com',
  'Pilot',
  'Test',
  'Pilot B',
  'active'
);
```

### Step 2: Link Users to Pilots Table

```sql
-- Create pilot records linked to user accounts
INSERT INTO pilots (id, user_id, first_name, last_name, employee_number, rank, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM an_users WHERE email = 'test-pilot-a@fleet.com'),
  'Test',
  'Pilot A',
  'TEST-001',
  'Captain',
  'active'
);

INSERT INTO pilots (id, user_id, first_name, last_name, employee_number, rank, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM an_users WHERE email = 'test-pilot-b@fleet.com'),
  'Test',
  'Pilot B',
  'TEST-002',
  'First Officer',
  'active'
);
```

---

## 🔬 Test Cases

### Test 1: Pilot Data Isolation (CRITICAL)

**Objective**: Verify pilots can ONLY see their own data

#### Test 1.1: Leave Request Isolation

**Setup**:
```sql
-- Create leave request for Pilot A
INSERT INTO leave_requests (pilot_id, start_date, end_date, leave_type, status)
VALUES (
  (SELECT id FROM pilots WHERE employee_number = 'TEST-001'),
  '2026-01-01',
  '2026-01-07',
  'ANNUAL',
  'PENDING'
);

-- Create leave request for Pilot B
INSERT INTO leave_requests (pilot_id, start_date, end_date, leave_type, status)
VALUES (
  (SELECT id FROM pilots WHERE employee_number = 'TEST-002'),
  '2026-01-01',
  '2026-01-07',
  'ANNUAL',
  'PENDING'
);
```

**Test** (as Pilot A):
```sql
-- Should return ONLY Pilot A's request (1 row)
SELECT COUNT(*) FROM leave_requests;

-- Should return 0 (Pilot A cannot see Pilot B's requests)
SELECT COUNT(*) FROM leave_requests
WHERE pilot_id = (SELECT id FROM pilots WHERE employee_number = 'TEST-002');
```

**Expected Result**:
- ✅ Pilot A sees 1 leave request (their own)
- ✅ Pilot A cannot see Pilot B's request

**Actual Result**: _[To be filled]_

#### Test 1.2: Cannot Modify Other Pilot's Data

**Test** (as Pilot A):
```sql
-- Should FAIL with permission error
UPDATE leave_requests
SET status = 'APPROVED'
WHERE pilot_id = (SELECT id FROM pilots WHERE employee_number = 'TEST-002');
```

**Expected Result**:
- ✅ UPDATE fails - no rows modified
- ✅ Error message about insufficient permissions

**Actual Result**: _[To be filled]_

### Test 2: Admin Full Access

**Objective**: Verify admin can see and modify ALL data

#### Test 2.1: Admin Views All Leave Requests

**Test** (as Admin):
```sql
-- Should return ALL leave requests (including Pilot A and B)
SELECT COUNT(*) FROM leave_requests;
```

**Expected Result**:
- ✅ Admin sees all leave requests (≥2)

**Actual Result**: _[To be filled]_

#### Test 2.2: Admin Can Approve Requests

**Test** (as Admin):
```sql
-- Should SUCCEED
UPDATE leave_requests
SET status = 'APPROVED'
WHERE pilot_id = (SELECT id FROM pilots WHERE employee_number = 'TEST-001')
  AND status = 'PENDING';
```

**Expected Result**:
- ✅ UPDATE succeeds - 1 row modified
- ✅ Status changed to APPROVED

**Actual Result**: _[To be filled]_

### Test 3: Role Protection

**Objective**: Verify pilots cannot escalate privileges

#### Test 3.1: Pilot Cannot Change Own Role

**Test** (as Pilot A):
```sql
-- Should FAIL
UPDATE an_users
SET role = 'Admin'
WHERE email = 'test-pilot-a@fleet.com';
```

**Expected Result**:
- ✅ UPDATE fails - no rows modified
- ✅ Role remains 'Pilot'

**Actual Result**: _[To be filled]_

#### Test 3.2: Pilot Cannot View Password Hashes

**Test** (as Pilot A):
```sql
-- Should return NULL or redacted for password_hash
SELECT id, email, password_hash FROM an_users
WHERE email = 'test-pilot-a@fleet.com';
```

**Expected Result**:
- ✅ password_hash is NULL or redacted
- ✅ Cannot see other users' password hashes

**Actual Result**: _[To be filled]_

### Test 4: Status Protection

**Objective**: Verify pilots cannot modify approved requests

#### Test 4.1: Pilot Cannot Modify Approved Request

**Setup**:
```sql
-- Admin approves a request
-- (run as Admin)
UPDATE leave_requests
SET status = 'APPROVED'
WHERE pilot_id = (SELECT id FROM pilots WHERE employee_number = 'TEST-001')
LIMIT 1;
```

**Test** (as Pilot A):
```sql
-- Should FAIL - approved requests are immutable
UPDATE leave_requests
SET end_date = '2026-01-10'
WHERE pilot_id = (SELECT id FROM pilots WHERE employee_number = 'TEST-001')
  AND status = 'APPROVED';
```

**Expected Result**:
- ✅ UPDATE fails - no rows modified
- ✅ Approved request remains unchanged

**Actual Result**: _[To be filled]_

#### Test 4.2: Pilot Can Modify Pending Requests

**Test** (as Pilot A):
```sql
-- Should SUCCEED
UPDATE leave_requests
SET end_date = '2026-01-10'
WHERE pilot_id = (SELECT id FROM pilots WHERE employee_number = 'TEST-001')
  AND status = 'PENDING';
```

**Expected Result**:
- ✅ UPDATE succeeds - 1 row modified
- ✅ End date updated

**Actual Result**: _[To be filled]_

### Test 5: Audit Trail Immutability

**Objective**: Verify audit logs cannot be modified

#### Test 5.1: Cannot Update Audit Logs

**Test** (as Admin):
```sql
-- Should FAIL even for admin
UPDATE audit_logs
SET action = 'MODIFIED'
WHERE id = (SELECT id FROM audit_logs LIMIT 1);
```

**Expected Result**:
- ✅ UPDATE fails - no rows modified
- ✅ Error: audit logs are immutable

**Actual Result**: _[To be filled]_

#### Test 5.2: Cannot Delete Audit Logs

**Test** (as Admin):
```sql
-- Should FAIL even for admin
DELETE FROM audit_logs
WHERE id = (SELECT id FROM audit_logs LIMIT 1);
```

**Expected Result**:
- ✅ DELETE fails - no rows deleted
- ✅ Error: audit logs are immutable

**Actual Result**: _[To be filled]_

### Test 6: Public/Anon Access

**Objective**: Verify no public/anon access to any table

#### Test 6.1: No Unauthenticated Access

**Test** (without authentication):
```sql
-- Should FAIL for all tables
SELECT COUNT(*) FROM pilots;
SELECT COUNT(*) FROM leave_requests;
SELECT COUNT(*) FROM an_users;
```

**Expected Result**:
- ✅ All queries fail with authentication error
- ✅ No data leakage in error messages

**Actual Result**: _[To be filled]_

---

## 📊 Test Results Template

| Test # | Test Name | User Role | Expected | Actual | Status |
|--------|-----------|-----------|----------|--------|--------|
| 1.1 | Leave Request Isolation | Pilot A | See own only | | ⏳ |
| 1.2 | Cannot Modify Other's Data | Pilot A | FAIL | | ⏳ |
| 2.1 | Admin Views All | Admin | See all | | ⏳ |
| 2.2 | Admin Can Approve | Admin | SUCCESS | | ⏳ |
| 3.1 | Cannot Change Own Role | Pilot A | FAIL | | ⏳ |
| 3.2 | Cannot View Password Hash | Pilot A | NULL/Redacted | | ⏳ |
| 4.1 | Cannot Modify Approved | Pilot A | FAIL | | ⏳ |
| 4.2 | Can Modify Pending | Pilot A | SUCCESS | | ⏳ |
| 5.1 | Cannot Update Audit | Admin | FAIL | | ⏳ |
| 5.2 | Cannot Delete Audit | Admin | FAIL | | ⏳ |
| 6.1 | No Unauth Access | None | FAIL | | ⏳ |

**Legend**:
- ✅ PASS - Test passed as expected
- ❌ FAIL - Test failed (security issue)
- ⚠️ WARNING - Test passed but with concerns
- ⏳ PENDING - Test not yet run

---

## 🔍 Automated Testing (Playwright)

### Test Suite Structure

```typescript
// e2e/rls-security.spec.ts
import { test, expect } from '@playwright/test'

test.describe('RLS Security Tests', () => {
  test.describe('Pilot Data Isolation', () => {
    test('Pilot A cannot see Pilot B leave requests', async ({ page }) => {
      // Login as Pilot A
      // Navigate to leave requests
      // Verify only sees own requests
      // Attempt to access Pilot B's request directly (should 404/403)
    })
  })

  test.describe('Admin Access', () => {
    test('Admin can view all leave requests', async ({ page }) => {
      // Login as Admin
      // Navigate to leave requests
      // Verify sees all pilots' requests
    })
  })

  test.describe('Role Protection', () => {
    test('Pilot cannot access admin routes', async ({ page }) => {
      // Login as Pilot
      // Attempt to access /dashboard/admin
      // Should redirect or show 403
    })
  })
})
```

---

## 🛠️ Troubleshooting

### Issue: Test User Cannot Login

**Solution**: Verify test user exists in Supabase Auth AND `an_users` table

```sql
-- Check Supabase Auth
SELECT email FROM auth.users WHERE email LIKE 'test-%';

-- Check an_users table
SELECT email, role, status FROM an_users WHERE email LIKE 'test-%';
```

### Issue: RLS Policy Not Applied

**Solution**: Verify RLS is enabled on table

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'your_table';
```

If `rowsecurity = false`:
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Issue: Admin Cannot Access Data

**Solution**: Check if admin is authenticated with correct role

```sql
-- Verify current user and role
SELECT
  auth.uid() as user_id,
  (SELECT role FROM an_users WHERE id = auth.uid()) as role;
```

---

## 📝 Test Cleanup

After testing, clean up test data:

```sql
-- Delete test leave requests
DELETE FROM leave_requests
WHERE pilot_id IN (
  SELECT id FROM pilots WHERE employee_number LIKE 'TEST-%'
);

-- Delete test pilots
DELETE FROM pilots WHERE employee_number LIKE 'TEST-%';

-- Delete test users
DELETE FROM an_users WHERE email LIKE 'test-%@fleet.com';

-- Delete from Supabase Auth (if applicable)
-- This may require admin dashboard access
```

---

## 🎯 Success Criteria

All tests must pass before deploying to production:

- ✅ All critical tests pass (Tests 1, 3, 5, 6)
- ✅ Zero security vulnerabilities found
- ✅ No data leakage between users
- ✅ Audit trail is immutable
- ✅ Role-based access control working correctly

---

**Last Updated**: October 27, 2025
**Document Version**: 1.0
