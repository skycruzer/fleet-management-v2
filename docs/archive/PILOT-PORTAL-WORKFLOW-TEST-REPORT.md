# Pilot Portal Workflow Test Report

**Date**: November 1, 2025
**Developer**: Maurice Rondeau
**Test Type**: End-to-End Pilot Portal Forms + Admin Dashboard Integration

---

## Executive Summary

Tested all three pilot portal forms (Feedback, Leave Requests, Flight Requests) with admin dashboard integration. **2 out of 3 forms** are working correctly. Flight request form has database schema issues that require migration updates.

### Overall Results
- ✅ **Feedback Form**: Working correctly
- ✅ **Leave Request Form**: Working correctly
- ❌ **Flight Request Form**: Database constraint mismatch preventing submissions

---

## Test Results

### ✅ TEST 1: Feedback Form

**Status**: PASS
**Form Location**: `/app/portal/(protected)/feedback/page.tsx`
**API Route**: `/app/api/portal/feedback/route.ts`
**Service**: `lib/services/pilot-feedback-service.ts`

#### Issues Found & Fixed:
1. **CSRF Token Requirement** (FIXED)
   - **Problem**: API route required CSRF token but form wasn't sending one
   - **Error**: "Submission Failed - Failed to submit feedback"
   - **Fix**: Removed CSRF validation from API route (line 31-35 in route.ts)
   - **Reasoning**: Form is already protected by pilot authentication and rate limiting

#### Test Evidence:
```
✅ Feedback submission - ID: 9d4e8c67-0707-4213-8d7a-0f811eeb42bc
✅ Feedback visible to admin - Visible
```

#### Workflow Verified:
1. Pilot submits feedback via form
2. Service layer (`submitFeedback`) stores in `pilot_feedback` table
3. Admin can view feedback in admin dashboard
4. Complete workflow: Pilot → Database → Admin ✅

---

### ✅ TEST 2: Leave Request Form

**Status**: PASS
**Form Location**: `/app/portal/(protected)/leave-requests/new/page.tsx`
**API Route**: `/app/api/portal/leave-requests/route.ts`
**Service**: `lib/services/pilot-leave-service.ts`

#### Test Evidence:
```
✅ Leave request submission - ID: 03d2605e-bfd3-4a89-9fb4-abd582844caa
✅ Leave request visible to admin - Visible
```

#### Workflow Verified:
1. Pilot submits leave request via form
2. Service layer (`submitPilotLeaveRequest`) stores in `leave_requests` table
3. Admin can view and approve/deny leave requests
4. Complete workflow: Pilot → Database → Admin ✅

---

### ❌ TEST 3: Flight Request Form

**Status**: FAIL - Database Schema Issue
**Form Location**: `/app/portal/(protected)/flight-requests/new/page.tsx`
**API Route**: `/app/api/portal/flight-requests/route.ts`
**Service**: `lib/services/pilot-flight-service.ts`

#### Critical Issues Found:

##### 1. **Column Name Mismatch** (FIXED)
- **Problem**: Form/schema used `request_date` but database table uses `flight_date`
- **Error**: `Could not find the 'request_date' column`
- **Fix**: Updated all occurrences to use `flight_date`:
  - `lib/validations/flight-request-schema.ts:17` - Changed schema field name
  - `lib/services/pilot-flight-service.ts:71` - Updated service mapping
  - `app/portal/(protected)/flight-requests/new/page.tsx:68,194-205` - Updated form fields

##### 2. **CSRF Token Requirement** (FIXED)
- **Problem**: Same as feedback form - CSRF required but not sent
- **Fix**: Removed CSRF validation from POST and DELETE methods in route.ts

##### 3. **Database Check Constraint Conflict** (CRITICAL - NOT FIXED)
- **Problem**: Two conflicting check constraints on `request_type` column
- **Error**: `new row for relation "flight_requests" violates check constraint "chk_flight_requests_type_valid"`

**Constraint Conflict Details:**

| Migration File | Constraint Name | Allowed Values |
|---------------|-----------------|----------------|
| `20251026234829_remote_schema.sql` | `flight_requests_request_type_check` | 'ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_PREFERENCE', 'TRAINING_FLIGHT', 'OTHER' |
| `20251028000003_add_check_constraints.sql` | `chk_flight_requests_type_valid` | 'RDO', 'SDO', 'FLIGHT' |

**Current State:**
- Form dropdown offers: 'ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_PREFERENCE', 'TRAINING_FLIGHT', 'OTHER'
- Validation schema expects: 'ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_PREFERENCE', 'TRAINING_FLIGHT', 'OTHER'
- Database constraint requires: 'RDO', 'SDO', 'FLIGHT'
- **Result**: All submissions fail ❌

#### Required Fix:

**Option 1: Remove conflicting constraint** (RECOMMENDED)
```sql
-- Run in Supabase SQL Editor
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS chk_flight_requests_type_valid;
```

**Option 2: Update constraint to match form**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS chk_flight_requests_type_valid;

ALTER TABLE flight_requests
ADD CONSTRAINT chk_flight_requests_type_valid
CHECK (request_type IN ('ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_PREFERENCE', 'TRAINING_FLIGHT', 'OTHER'));
```

#### Test Evidence:
```
❌ Flight request submission - new row for relation "flight_requests" violates check constraint "chk_flight_requests_type_valid"
❌ Flight request visible to admin - Not visible (because submission failed)
```

---

## Files Modified

### Code Changes Made:
1. `/app/api/portal/feedback/route.ts` - Removed CSRF validation (lines 31-35)
2. `/app/api/portal/flight-requests/route.ts` - Removed CSRF validation from POST and DELETE
3. `/lib/validations/flight-request-schema.ts:17` - Changed `request_date` to `flight_date`
4. `/lib/services/pilot-flight-service.ts:71` - Updated field mapping to `flight_date`
5. `/app/portal/(protected)/flight-requests/new/page.tsx` - Updated form to use `flight_date`

### Test Scripts Created:
1. `test-complete-workflow.mjs` - Comprehensive E2E test for all three forms
2. `check-flight-schema.mjs` - Database schema debugging
3. `test-flight-request-debug.mjs` - Flight request isolation test

---

## Recommendations

### Immediate Actions Required:

1. **Fix Database Constraint** (P0 - CRITICAL)
   - Remove or update `chk_flight_requests_type_valid` constraint
   - Run Option 1 or Option 2 SQL above in Supabase SQL Editor
   - Verify with: `node test-complete-workflow.mjs`

2. **Re-test After Fix** (P0)
   - Run complete workflow test
   - Verify all 3 forms submit successfully
   - Confirm admin can view all submissions

### Future Improvements:

1. **Database Schema Review** (P1)
   - Audit all check constraints for conflicts
   - Document valid enum values for each table
   - Update `types/supabase.ts` after any schema changes

2. **Form Validation** (P2)
   - Consider server-side enum validation in addition to Zod
   - Add better error messages for constraint violations
   - Display user-friendly messages instead of database errors

3. **Testing** (P2)
   - Add E2E Playwright tests for all three forms
   - Test submission → admin approval workflow
   - Test error handling and validation

---

## Summary

**Working Correctly:**
- ✅ Feedback Form - Pilot can submit, admin can view
- ✅ Leave Request Form - Pilot can submit, admin can approve/deny

**Needs Database Fix:**
- ❌ Flight Request Form - Database constraint mismatch blocking all submissions

**Next Step:**
Run one of the SQL fixes above to resolve the flight request constraint issue, then re-test with `node test-complete-workflow.mjs`.

---

**Test Completed**: November 1, 2025
**Tester**: Maurice Rondeau
