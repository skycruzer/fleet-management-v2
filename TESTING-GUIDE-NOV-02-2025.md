# Testing Guide - November 2, 2025

**Developer**: Maurice Rondeau
**Build Status**: ✅ Successful (build-final-verification-nov-02.log)
**Ready for Testing**: YES

---

## Critical: Browser Cache Issue

**IMPORTANT**: The flight request form changes will NOT appear unless you hard refresh your browser:

### How to Hard Refresh:
- **Mac**: Press `Cmd + Shift + R`
- **Windows/Linux**: Press `Ctrl + Shift + F5` or `Ctrl + F5`
- **Alternative**: Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

Without a hard refresh, you will still see the OLD request types ("Additional Flight...") because your browser cached the old JavaScript bundle.

---

## 🧪 Testing Checklist

### 1. Disciplinary Form - UUID Empty String Fix ✅

**Test Path**: http://localhost:3000/dashboard/disciplinary

**Steps**:
1. Navigate to disciplinary matters list
2. Click any existing matter to edit
3. **Leave "Assigned To" dropdown EMPTY** (do not select anyone)
4. Leave other optional fields empty
5. Click "Update Matter" button
6. **Expected**: Success message, no errors
7. **Previously**: "invalid input syntax for type uuid: ''" error

**What was fixed**: Form now converts empty strings to `null` for UUID fields

---

### 2. Disciplinary Form - Severity Enum Fix ✅

**Test Path**: http://localhost:3000/dashboard/disciplinary

**Steps**:
1. Navigate to disciplinary matters list
2. Click any existing matter to edit
3. Change "Severity" dropdown to any value: Low, Medium, High, or Critical
4. Click "Update Matter" button
5. **Expected**: Success message, saves correctly
6. **Previously**: "check constraint violation" error

**What was fixed**: Severity values now match database constraint (lowercase: `low`, `medium`, `high`, `critical`)

---

### 3. Tasks Edit Page - 404 Fix ✅

**Test Path**: http://localhost:3000/dashboard/tasks

**Steps**:
1. Navigate to tasks list
2. Click any task to view details
3. Click "Edit Task" button
4. **Expected**: Task edit form appears
5. **Previously**: 404 Not Found error

**What was fixed**: Created missing `app/dashboard/tasks/[id]/edit/page.tsx` file

---

### 4. Flight Request Form - Request Types Fix ✅ (CRITICAL - VERIFY THIS)

**Test Path**: http://localhost:3000/portal/flight-requests/new

**IMPORTANT**: **HARD REFRESH** browser (Cmd+Shift+R) before testing!

**Steps**:
1. **HARD REFRESH** your browser (Cmd+Shift+R or Ctrl+Shift+F5)
2. Navigate to flight request form
3. Click "Request Type" dropdown
4. **Expected**: See ONLY these 4 options:
   - Flight Request
   - Regular Day Off (RDO)
   - Substitute Day Off (SDO)
   - Office Day
5. **Previously**: Showed "Additional Flight", "Route Change", "Schedule Preference", etc.

**If you still see old values**:
1. Clear browser cache completely
2. Restart dev server: Stop `npm run dev`, then `npm run dev` again
3. Try in incognito/private browsing window
4. Try different browser

**What was fixed**:
- `app/portal/(protected)/flight-requests/new/page.tsx` - REQUEST_TYPES array updated
- `lib/validations/flight-request-schema.ts` - Enum values updated
- `lib/services/pilot-flight-service.ts` - Interface types updated
- `components/pilot/FlightRequestForm.tsx` - Default value updated

---

### 5. Flight Request Form - Submission Test

**Test Path**: http://localhost:3000/portal/flight-requests/new

**Prerequisites**: Database CHECK constraint must be applied first (see Database section below)

**Steps**:
1. Select request type: "Flight Request"
2. Select flight date: Tomorrow's date
3. Enter description: "Test flight request submission after fix"
4. Click "Submit Request"
5. **Expected**: Success message → Redirects to flight requests list
6. **Previously**: Form might not close or show validation errors

---

## 🗄️ Database Actions Required

### Flight Requests CHECK Constraint

**File**: `update-flight-request-constraint.sql`

**Action**: Run this SQL in Supabase SQL Editor BEFORE testing flight request submissions

**Steps**:
1. Open Supabase dashboard: https://app.supabase.com/project/wgdmgvonqysflwdiiols
2. Go to "SQL Editor"
3. Copy contents of `update-flight-request-constraint.sql`
4. Paste and execute
5. Verify constraint applied with the verification query in the file

**Why**: Database currently has old enum values in CHECK constraint and will reject new submissions until this is updated.

**SQL**:
```sql
-- Update flight_requests table CHECK constraint to match new enum values
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
  CHECK (request_type IN ('FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'));
```

---

## 📊 Build Verification

```bash
✓ Build successful
✓ TypeScript compilation passed
✓ No type errors
✓ All routes generated
✓ 61 pages built successfully
```

**Build Log**: `build-final-verification-nov-02.log`

---

## 🐛 Known Issues (NOT FIXED YET)

### Pilot Portal Leave Request RLS Policy

**Issue**: Pilots cannot submit leave requests due to Row Level Security policy blocking INSERT operations

**Error**: "new row violates row-level security policy for table 'leave_requests'"

**Status**: NOT FIXED - Requires database administration to update RLS policies

**Impact**: Leave request form will show submission error

---

## 📝 Testing Order

**Recommended order**:

1. ✅ Test disciplinary form (both UUID and severity fixes)
2. ✅ Test tasks edit page (verify no 404)
3. 🔄 **Apply database CHECK constraint** (SQL Editor)
4. ✅ Test flight request form types (HARD REFRESH first!)
5. ✅ Test flight request submission (after constraint applied)

---

## 🚨 If Issues Persist

### Flight Request Form Still Shows Old Types

**Troubleshooting**:
1. **Hard refresh** browser (Cmd+Shift+R)
2. Clear browser cache completely
3. Stop dev server → `npm run dev` again
4. Try incognito/private browsing
5. Check browser DevTools console for errors
6. Verify files were actually updated:
   ```bash
   grep "FLIGHT_REQUEST" app/portal/\(protected\)/flight-requests/new/page.tsx
   grep "FLIGHT_REQUEST" lib/validations/flight-request-schema.ts
   ```

### Disciplinary Form Still Fails

**Check**:
1. Browser console for error message
2. Dev server logs for PostgreSQL error codes
3. Verify severity dropdown shows: Low, Medium, High, Critical (title case labels)
4. Verify form sends lowercase values: `low`, `medium`, `high`, `critical`

### Tasks Edit Still 404

**Check**:
1. File exists: `app/dashboard/tasks/[id]/edit/page.tsx`
2. Dev server restarted after file creation
3. URL format correct: `/dashboard/tasks/[some-uuid]/edit`

---

## ✅ Success Criteria

All these must pass before deployment:

- [ ] Disciplinary form saves with empty "Assigned To"
- [ ] Disciplinary form saves with any severity value
- [ ] Tasks edit page loads (no 404)
- [ ] Flight request form shows ONLY 4 request types
- [ ] Flight request submission succeeds (after DB constraint applied)
- [ ] No TypeScript errors in build
- [ ] No console errors in browser

---

## 🚀 Next Steps After Testing

If all tests pass:

1. ✅ Confirm all fixes working in browser
2. ✅ Database constraint applied successfully
3. ✅ No regression issues found
4. 🚀 Deploy to Vercel production
5. ✅ Verify fixes work in production environment

---

**Last Updated**: November 2, 2025
**Files Modified**: 6
**Database Scripts**: 1 (pending execution)
**Build Status**: ✅ SUCCESSFUL
