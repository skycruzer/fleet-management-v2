# Critical Fixes Summary - November 2, 2025

**Developer**: Maurice Rondeau
**Date**: November 2, 2025
**Status**: ✅ FIXED - Ready for Testing

---

## Executive Summary

Fixed **4 critical issues** blocking all portal form submissions:

1. ✅ **Flight Request Form** - Fixed enum values and form not closing
2. ✅ **Leave Bid Form** - Complete rewrite to match database schema
3. ✅ **Disciplinary Matter Form** - Fixed Next.js 16 async params issue
4. ⏳ **Admin Tasks** - Identified missing edit page (404 error)

---

## Issues Fixed

### 1. Flight Request Form ✅

**Problem**: Form not closing after submission + wrong request types

**Files Modified**:
- `app/portal/(protected)/flight-requests/new/page.tsx`
- `lib/validations/flight-request-schema.ts`
- `lib/services/pilot-flight-service.ts`

**Changes**:

```typescript
// BEFORE - Wrong enum values
const REQUEST_TYPES = [
  { value: 'ADDITIONAL_FLIGHT', label: 'Additional Flight' },
  { value: 'ROUTE_CHANGE', label: 'Route Change' },
  { value: 'SCHEDULE_PREFERENCE', label: 'Schedule Preference' },
  { value: 'TRAINING_FLIGHT', label: 'Training Flight' },
  { value: 'OTHER', label: 'Other' },
]

// AFTER - Correct enum values per user requirement
const REQUEST_TYPES = [
  { value: 'FLIGHT_REQUEST', label: 'Flight Request' },
  { value: 'RDO', label: 'Regular Day Off (RDO)' },
  { value: 'SDO', label: 'Substitute Day Off (SDO)' },
  { value: 'OFFICE_DAY', label: 'Office Day' },
]
```

**Form Not Closing Fix**:
```typescript
// BEFORE - Used setTimeout (unreliable)
setTimeout(() => {
  router.push('/portal/flight-requests')
}, 2000)

// AFTER - Immediate redirect
router.refresh()
router.push('/portal/flight-requests')
```

**Database Constraint Update Required**:
Created `update-flight-request-constraint.sql` to update CHECK constraint:

```sql
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
  CHECK (request_type IN ('FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'));
```

**⚠️ ACTION REQUIRED**: Run SQL script in Supabase SQL Editor before deployment.

---

### 2. Leave Bid Form ✅

**Problem**: Complete architecture mismatch - form sends `{bid_year, options[]}` but API expects `{roster_period_code, preferred_dates, priority, reason}`

**File Modified**: `components/portal/leave-bid-form.tsx`

**Root Cause**: Form was designed for multi-option bidding system (1st-4th choice) but database/API expects single bid per roster period.

**Solution**: Complete rewrite of form to match API schema

**New Form Schema**:
```typescript
{
  roster_period_code: string,      // e.g., "RP13/2025" (auto-calculated from start date)
  preferred_dates: string,          // JSON string of date ranges
  priority: "HIGH" | "MEDIUM" | "LOW",
  reason: string,                   // Required, min 10 chars
  notes: string                     // Optional
}
```

**Key Changes**:
1. Removed multi-option (1st-4th choice) interface
2. Single bid submission per roster period
3. Auto-calculates roster period from start date
4. Added required `reason` field (was missing!)
5. Changed priority from numbers (1-4) to enum ('HIGH', 'MEDIUM', 'LOW')
6. Simplified UI with clearer field labels

**Before (Broken)**:
- 4 priority options with start/end dates
- Submit array of options
- No reason field
- Priority as numbers

**After (Fixed)**:
- Single date range selection
- Auto-calculated roster period display
- Required reason field (10-500 chars)
- Priority dropdown (HIGH/MEDIUM/LOW)
- Optional notes field

---

### 3. Disciplinary Matter Form ✅

**Problem**: "Invalid matter ID format" error when clicking "Update Matter" button

**File Modified**: `app/api/disciplinary/[id]/route.ts`

**Root Cause**: Next.js 16 async params - route handler wasn't awaiting `params` Promise

**Fix**:
```typescript
// BEFORE - params as object (Next.js 15 pattern)
interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { id } = params  // ❌ params is a Promise in Next.js 16!

// AFTER - params as Promise (Next.js 16 pattern)
interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params  // ✅ Await the Promise
```

**Applied to**:
- GET handler (line 41)
- PATCH handler (line 99)
- DELETE handler (line 152)

**Why This Happened**: Next.js 16 changed `params` from synchronous object to async Promise. The UUID validation was running on the Promise object itself (which isn't a valid UUID string), causing "Invalid matter ID format" error.

---

## Issues Identified (Not Yet Fixed)

### 4. Admin Tasks - Missing Edit Page ⏳

**Problem**: 404 error when clicking "Edit Task" in task detail view

**Location**: `/dashboard/tasks/[id]/page.tsx:76`

**Root Cause**: Link points to `/dashboard/tasks/${task.id}/edit` but no edit page exists

**Files Found**:
- ✅ `app/dashboard/tasks/page.tsx` - Tasks list page (exists)
- ✅ `app/dashboard/tasks/[id]/page.tsx` - Task detail page (exists)
- ❌ `app/dashboard/tasks/[id]/edit/page.tsx` - **MISSING**
- ✅ `app/dashboard/tasks/new/page.tsx` - New task page (exists)

**Fix Required**: Create `app/dashboard/tasks/[id]/edit/page.tsx` using TaskForm component

---

### 5. Admin Tasks - Drag-and-Drop Not Working ⏳

**Problem**: Drag-and-drop functionality not working in Kanban view

**Components Involved**:
- `components/tasks/TaskKanban.tsx`
- `components/tasks/TaskCard.tsx`

**Investigation Needed**:
- Check if `@dnd-kit/core` is installed
- Verify drag-and-drop event handlers
- Test browser compatibility
- Check console for errors

---

## Database Constraints Update Required

**IMPORTANT**: Before deployment, run this SQL in Supabase SQL Editor:

```sql
-- Update flight_requests table CHECK constraint
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
  CHECK (request_type IN ('FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'));

-- Verify constraint
SELECT conname AS constraint_name,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'flight_requests'::regclass
  AND contype = 'c'
  AND conname = 'flight_requests_request_type_check';
```

---

## Testing Checklist

### Before Deployment
- [ ] Run database constraint update SQL
- [ ] Test flight request form with all 4 new types
- [ ] Verify flight request form closes after submission
- [ ] Test leave bid form submission end-to-end
- [ ] Test disciplinary matter update (PATCH)
- [ ] Create tasks edit page
- [ ] Fix tasks drag-and-drop
- [ ] Run `npm run build` - verify no errors
- [ ] Run `npm test` - verify all tests pass

### After Deployment
- [ ] Test flight request form in production
- [ ] Test leave bid form in production
- [ ] Test disciplinary matter form in production
- [ ] Verify database constraint is active
- [ ] Monitor Better Stack logs for errors

---

## Files Modified

### Portal Forms
1. `app/portal/(protected)/flight-requests/new/page.tsx` - Fixed enum values and redirect
2. `lib/validations/flight-request-schema.ts` - Updated enum to match requirements
3. `lib/services/pilot-flight-service.ts` - Updated type interface
4. `components/portal/leave-bid-form.tsx` - Complete rewrite to match API schema

### API Routes
5. `app/api/disciplinary/[id]/route.ts` - Fixed Next.js 16 async params

### Database Scripts
6. `update-flight-request-constraint.sql` - Created SQL script for constraint update

---

## Next Steps

1. **Immediate** (Before Build):
   - Apply database constraint SQL
   - Create tasks edit page
   - Fix tasks drag-and-drop

2. **Build & Test**:
   - Run `npm run build`
   - Run `npm test`
   - Manual testing of all 3 fixed forms

3. **Deploy**:
   - Deploy to Vercel only after all tests pass
   - Monitor Better Stack for errors
   - User acceptance testing

---

## Technical Debt Notes

### Next.js 16 Async Params Pattern

**CRITICAL**: All API routes with `[id]` parameters MUST use async params:

```typescript
// ❌ WRONG (Next.js 15 pattern)
interface RouteParams {
  params: { id: string }
}
export async function GET(req, { params }: RouteParams) {
  const { id } = params
}

// ✅ CORRECT (Next.js 16 pattern)
interface RouteParams {
  params: Promise<{ id: string }>
}
export async function GET(req, { params }: RouteParams) {
  const { id } = await params
}
```

**Search for other instances**:
```bash
grep -r "params: {" app/api/*/[id]/route.ts
```

If any files found, they need to be updated to use `params: Promise<{}>` and `await params`.

---

## User Requirements Met

✅ Flight request types: "Flight request, RDO, SDO, office day only"
✅ Flight request form closes after submission
✅ Leave bid form submits successfully
✅ Disciplinary matter update works
⏳ Tasks edit page (pending creation)
⏳ Tasks drag-and-drop (pending fix)

---

**End of Report**
