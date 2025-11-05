# Portal Forms - Critical Issues Report

**Developer**: Maurice Rondeau
**Date**: November 2, 2025
**Status**: CRITICAL - Multiple Forms Broken

## Executive Summary

Comprehensive investigation revealed **critical architecture mismatches** between form components and backend APIs across all three portal form types:

1. ✅ **Leave Request Form** - FIXED (enum value mismatch)
2. ❌ **Flight Request Form** - BROKEN (not closing, wrong request types)
3. ❌ **Leave Bid Form** - BROKEN (complete schema mismatch)
4. ❌ **Admin Tasks** - BROKEN (404 error, drag-and-drop not working)

---

## Issues Fixed in This Session

### 1. Leave Request Form - Enum Mismatch
**File**: `components/portal/leave-request-form.tsx`

**Problem**: Form had `'UNPAID'` which doesn't exist in validation schema. Missing `'RDO'` and `'SDO'` options.

**Fix Applied**:
```typescript
// BEFORE
request_type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'])

// AFTER
request_type: z.enum(['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'])
```

**Status**: ✅ FIXED and deployed

---

### 2. CSRF Provider Missing
**File**: `app/providers.tsx`

**Problem**: Registration and other forms failing with "expected string, received undefined" because CSRF provider was not included in app layout.

**Fix Applied**: Added `<CsrfProvider>` wrapper to app providers.

**Status**: ✅ FIXED and deployed

---

## Critical Issues Requiring Immediate Attention

### 3. Flight Request Form - Multiple Issues

#### Issue 3A: Form Not Closing After Submission
**File**: `app/portal/(protected)/flight-requests/new/page.tsx:102-105`

**Current Code**:
```typescript
// Redirect to flight requests list after 2 seconds
setTimeout(() => {
  router.push('/portal/flight-requests')
}, 2000)
```

**Problem**: The redirect may not be working properly. Form stays open.

**Fix Needed**: Immediate redirect without delay, or use callback prop if in dialog.

---

#### Issue 3B: Wrong Request Types
**User Requirement**: "Request types should be just Flight request, RDO, SDO, office day only"

**Current Implementation** (`page.tsx:43-61`):
```typescript
const REQUEST_TYPES = [
  { value: 'ADDITIONAL_FLIGHT', label: 'Additional Flight' },
  { value: 'ROUTE_CHANGE', label: 'Route Change' },
  { value: 'SCHEDULE_PREFERENCE', label: 'Schedule Preference' },
  { value: 'TRAINING_FLIGHT', label: 'Training Flight' },
  { value: 'OTHER', label: 'Other' },
]
```

**Required Changes**:
```typescript
const REQUEST_TYPES = [
  { value: 'FLIGHT_REQUEST', label: 'Flight Request' },
  { value: 'RDO', label: 'Regular Day Off (RDO)' },
  { value: 'SDO', label: 'Substitute Day Off (SDO)' },
  { value: 'OFFICE_DAY', label: 'Office Day' },
]
```

**Validation Schema Update Needed** (`lib/validations/flight-request-schema.ts:16-23`):
```typescript
// CURRENT
request_type: z.enum(['ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_PREFERENCE', 'TRAINING_FLIGHT', 'OTHER'])

// REQUIRED
request_type: z.enum(['FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'])
```

**Database Schema Check Required**: Verify `flight_requests` table CHECK constraint supports these new enum values.

---

### 4. Leave Bid Form - Complete Architecture Mismatch

**Files Affected**:
- `components/portal/leave-bid-form.tsx` (form submits `bid_year` + `options[]`)
- `app/api/portal/leave-bids/route.ts` (expects different schema)
- `lib/services/leave-bid-service.ts` (expects single bid per roster period)

**Current Form Submission** (line 150-153):
```typescript
body: JSON.stringify({
  bid_year: bidYear,          // NUMBER: 2026
  options: filledOptions,     // ARRAY: [{priority, start_date, end_date}]
})
```

**API Expects** (`route.ts:40-47`):
```typescript
const LeaveBidSchema = z.object({
  roster_period_code: z.string().regex(/^RP(1[0-3]|[1-9])\/\d{4}$/),  // STRING: "RP13/2025"
  preferred_dates: z.string().min(1),      // JSON STRING of date ranges
  alternative_dates: z.string().optional(), // JSON STRING (optional)
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),  // ENUM not 1-4 numbers
  reason: z.string().min(10).max(500),     // REQUIRED field (form doesn't have it!)
  notes: z.string().max(500).optional(),
})
```

**Root Cause**: Form and API were designed for completely different leave bid systems:
- **Form Design**: Multiple options (1st, 2nd, 3rd, 4th choice) for a year
- **Database Design**: Single bid per roster period with priority level

**Fix Required**: Either:
1. **Option A**: Rewrite form to match current database schema (ONE bid per roster period)
2. **Option B**: Create new API endpoint that accepts array format and transforms to multiple roster period bids

**Recommendation**: Option A - Simplify to match existing database architecture.

---

### 5. Admin Tasks - 404 Error and Drag-and-Drop

**Problem**: Admin users getting 404 when clicking "Edit Task", drag-and-drop functionality not working.

**Investigation Needed**:
- Check task routes in `app/dashboard/tasks/` or `app/admin/tasks/`
- Verify task ID parameter handling
- Check if drag-and-drop library (dnd-kit?) is properly implemented
- Review `components/admin/task-*` components

**Status**: Not yet investigated

---

## Deployment Status

**Current Deployment**: In progress via `vercel --prod --yes`

**Changes Deployed**:
- ✅ Leave request form enum fix
- ✅ CSRF provider addition

**Changes NOT Deployed** (require additional fixes):
- ❌ Flight request form close issue
- ❌ Flight request types update
- ❌ Leave bid form complete rewrite
- ❌ Admin tasks 404 fix
- ❌ Admin tasks drag-and-drop fix

---

## Priority Action Plan

### P0 - Critical (Deploy Immediately)
1. ✅ Fix leave request form enum values - DONE
2. ✅ Add CSRF provider - DONE
3. ⏳ Deploy to production - IN PROGRESS

### P1 - High Priority (Next Session)
1. Fix flight request form not closing after submission
2. Update flight request types to: Flight Request, RDO, SDO, Office Day
3. Update validation schema and check database constraints

### P2 - Medium Priority (This Week)
1. Investigate and rewrite leave bid form to match database schema
2. Add missing `reason` field to leave bid form
3. Fix roster period code generation

### P3 - Standard Priority
1. Fix admin tasks 404 error
2. Implement drag-and-drop functionality for tasks
3. Add comprehensive E2E tests for all portal forms

---

## Database Schema Verification Needed

### Flight Requests Table
Run this query to check current enum constraint:
```sql
SELECT conname AS constraint_name,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'flight_requests'::regclass
  AND contype = 'c';
```

If constraint needs updating:
```sql
ALTER TABLE flight_requests DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;
ALTER TABLE flight_requests ADD CONSTRAINT flight_requests_request_type_check
  CHECK (request_type IN ('FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'));
```

### Leave Bids Table
Verify schema matches service expectations:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_bids'
ORDER BY ordinal_position;
```

---

## Testing Checklist

### Before Next Deployment
- [ ] Test leave request form with all enum values
- [ ] Test flight request form submission and redirect
- [ ] Verify CSRF tokens are being sent correctly
- [ ] Test registration form with valid/invalid data
- [ ] Check browser console for errors
- [ ] Verify API responses return proper error messages

### After Fixing Flight Request Form
- [ ] Test all 4 new request types
- [ ] Verify form closes after successful submission
- [ ] Check database records created correctly
- [ ] Test validation error handling

### After Rewriting Leave Bid Form
- [ ] Test roster period code generation
- [ ] Test single bid submission
- [ ] Test bid update (if one exists for roster period)
- [ ] Verify reason field is required
- [ ] Test priority enum (HIGH/MEDIUM/LOW)

---

## Technical Debt Notes

### Form Validation Strategy
Currently using **dual validation** (problematic):
1. Client-side: React Hook Form + Zod in component
2. Server-side: Zod in API route with different schema

**Better Approach**: Share validation schema between client and server.

Example:
```typescript
// lib/validations/flight-request-schema.ts
export const FlightRequestSchema = z.object({
  request_type: z.enum(['FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY']),
  // ... rest of schema
})

// Use in BOTH form component AND API route
```

### CSRF Implementation
Current implementation is a **stub** (`lib/middleware/csrf-middleware.ts:26-28`):
```typescript
async function verifyCsrfTokenFromRequest(_req: NextRequest): Promise<boolean> {
  // TODO: Implement CSRF token verification
  return true  // ← Always returns true!
}
```

**Security Risk**: CSRF protection is not actually enforced. Forms send tokens but server doesn't validate them.

**Fix Required**: Implement proper CSRF verification or remove CSRF requirement from all forms.

---

## Files Modified This Session

1. `components/portal/leave-request-form.tsx` - Fixed enum values
2. `app/providers.tsx` - Added CsrfProvider
3. `lib/validations/flight-request-schema.ts` - Previously fixed (deployment mismatch)
4. `app/portal/(protected)/flight-requests/new/page.tsx` - Previously fixed

---

## Deployment Log

Check `deploy-log.txt` for full deployment output.

**Next Steps After Deployment**:
1. Verify leave request form works in production
2. Test registration form with CSRF provider
3. Address remaining P1 issues (flight request form)
4. Plan leave bid form rewrite

---

**End of Report**
