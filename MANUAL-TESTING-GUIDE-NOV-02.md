# Manual Testing Guide - November 2, 2025
**Developer**: Maurice Rondeau
**Purpose**: Step-by-step manual testing of remaining fixes
**Dev Server**: http://localhost:3000

---

## ✅ Test 1: Flight Request Form Types (ALREADY VERIFIED)

**Status**: ✅ **COMPLETE** - No manual testing needed

**Result**: Automated test confirmed showing correct types: FLIGHT_REQUEST, RDO, SDO, OFFICE_DAY

---

## ⚠️ Test 2: Disciplinary Form UUID Empty String Fix

### Prerequisites
- Dev server running on http://localhost:3000
- Admin credentials: skycruzer@icloud.com / mron2393
- Browser DevTools open (F12)

### Test Steps

1. **Open Browser and DevTools**:
   ```
   - Open Chrome or Safari
   - Press F12 (or Cmd+Option+I on Mac) to open DevTools
   - Go to Network tab
   - Check "Preserve log"
   ```

2. **Login to Admin Portal**:
   ```
   URL: http://localhost:3000/auth/login
   Email: skycruzer@icloud.com
   Password: mron2393
   ```

3. **Navigate to Disciplinary Matters**:
   ```
   URL: http://localhost:3000/dashboard/disciplinary
   ```

4. **Click First Disciplinary Matter**:
   ```
   - Click the first row in the table
   - Should navigate to matter detail/edit page
   ```

5. **Clear "Assigned To" Field**:
   ```
   - Find the "Assigned To" dropdown
   - Select the empty option (first option, no value)
   - This simulates the UUID empty string error
   ```

6. **Submit Form and Observe**:
   ```
   - Click "Save" or "Update" button
   - Watch Network tab in DevTools
   - Look for PATCH request to /api/disciplinary/[id]
   ```

7. **Check Results**:

   **If Successful (✅)**:
   - Network tab shows: `PATCH /api/disciplinary/... 200`
   - Success toast appears
   - No error message
   - Matter updated successfully

   **If Failed (❌)**:
   - Network tab shows: `PATCH /api/disciplinary/... 500` or `400`
   - Click the PATCH request in Network tab
   - Go to "Response" tab
   - Copy the error message

   **Expected Errors We Fixed**:
   - ❌ OLD: `"invalid input syntax for type uuid: \"\""`
   - ✅ NEW: Should not see this error anymore

8. **Document Results**:
   ```
   - Screenshot of Network tab
   - Copy error response (if any)
   - Note whether fix worked or not
   ```

### What the Fix Does

**File Modified**: `app/api/disciplinary/[id]/route.ts` (lines 120-135)

**Before Fix**:
```typescript
// API route received empty string "" for UUID fields
const result = await updateMatter(id, body) // Passed "" to database
// Database rejected: "invalid input syntax for type uuid: \"\""
```

**After Fix**:
```typescript
// API route sanitizes data first
const sanitizedBody = {
  ...body,
  assigned_to: body.assigned_to === '' ? null : body.assigned_to, // Converts "" to null
  // ... 11 more fields sanitized
}
const result = await updateMatter(id, sanitizedBody) // Passes null instead of ""
// Database accepts null for optional UUID fields
```

---

## ⚠️ Test 3: Tasks Edit Page 404

### Prerequisites
- Dev server running
- Admin credentials: skycruzer@icloud.com / mron2393
- **MUST HAVE**: At least one task in the database

### Step 0: Check if Tasks Exist

1. **Check Supabase Database**:
   ```
   - Go to https://app.supabase.com/project/wgdmgvonqysflwdiiols/editor
   - Select "tasks" table
   - Check if there are any rows
   ```

2. **If No Tasks**:
   ```
   - Cannot test edit page without tasks
   - Need to create at least one test task
   - Either:
     a) Create task via UI (if /dashboard/tasks has "Create" button)
     b) Insert via SQL in Supabase SQL editor
   ```

### Test Steps (Only if Tasks Exist)

1. **Login to Admin Portal**:
   ```
   URL: http://localhost:3000/auth/login
   Email: skycruzer@icloud.com
   Password: mron2393
   ```

2. **Navigate to Tasks Page**:
   ```
   URL: http://localhost:3000/dashboard/tasks
   ```

3. **Check Task List**:
   ```
   - Do you see any tasks in the table?
   - If NO: Stop here, need to create tasks first
   - If YES: Continue to next step
   ```

4. **Click First Task**:
   ```
   - Click first row in tasks table
   - Should navigate to task detail page
   - Note the URL (e.g., /dashboard/tasks/[id])
   ```

5. **Click "Edit" Button or Navigate to Edit URL**:
   ```
   - Either click "Edit Task" button
   - Or manually add "/edit" to URL
   - Example: http://localhost:3000/dashboard/tasks/[id]/edit
   ```

6. **Check Results**:

   **If Successful (✅)**:
   - Edit page loads
   - Form with task fields appears
   - URL contains "/edit"
   - No 404 error

   **If Failed (❌)**:
   - Page redirects to /dashboard/tasks
   - OR shows "Not Found" page
   - Browser console shows errors
   - Check browser console for errors

7. **If Failed, Check RLS Policies**:
   ```
   - Go to Supabase
   - Project: wgdmgvonqysflwdiiols
   - Database > Tables > tasks
   - Click "RLS Policies"
   - Check if there's a SELECT policy for authenticated users
   ```

### What Might Be Wrong

**Possible Issues**:

1. **No Tasks in Database**:
   - Solution: Create test tasks first

2. **RLS Policy Blocking SELECT**:
   - Check: Supabase > tasks table > RLS Policies
   - Fix: Add policy allowing authenticated users to SELECT

3. **Foreign Key Constraints Failing**:
   - `assigned_user` (an_users table)
   - `created_user` (an_users table)
   - `category` (task_categories table)
   - `related_pilot` (pilots table)
   - If these tables are missing data, SELECT will fail

4. **`getTaskById` Service Function Error**:
   - Check dev server logs for error messages
   - Service may be blocked at database level

### Create Test Task (If Needed)

**Option 1: Via Supabase SQL Editor**:
```sql
-- Get a valid user ID first
SELECT id FROM an_users LIMIT 1;

-- Create test task (replace USER_ID with actual ID)
INSERT INTO tasks (
  title,
  description,
  status,
  priority,
  created_by,
  assigned_to
) VALUES (
  'Test Task for Edit Page',
  'This is a test task created to verify edit page functionality',
  'pending',
  'medium',
  'USER_ID', -- Replace with actual user ID
  'USER_ID'  -- Replace with actual user ID
);
```

**Option 2: Via UI** (if create button exists):
- Navigate to /dashboard/tasks
- Click "Create Task" or "New Task" button
- Fill form and submit

---

## 📊 Testing Checklist

### Before Starting
- [ ] Dev server running (http://localhost:3000)
- [ ] Admin credentials ready
- [ ] Pilot portal credentials ready (for flight requests)
- [ ] Browser DevTools open (Network tab)

### Test 1: Flight Request Types
- [✅] ALREADY VERIFIED - Skip

### Test 2: Disciplinary Form UUID
- [ ] Login as admin
- [ ] Navigate to disciplinary matters
- [ ] Edit a matter
- [ ] Clear "Assigned To" field
- [ ] Submit form
- [ ] Check Network tab for 200 or 500 response
- [ ] Document result

### Test 3: Tasks Edit Page
- [ ] Check if tasks exist in database
- [ ] If no tasks, create test task
- [ ] Login as admin
- [ ] Navigate to tasks
- [ ] Click first task
- [ ] Navigate to edit page
- [ ] Check if edit page loads or 404s
- [ ] Document result

### After Testing
- [ ] Document all results in FINAL-TEST-RESULTS-NOV-02-2025.md
- [ ] Update status of each fix
- [ ] Note any new issues discovered
- [ ] Decide if ready for deployment

---

## 🎯 Expected Results

### Disciplinary Form UUID
- ✅ **SHOULD WORK**: Form submits successfully with empty assigned_to field
- ❌ **SHOULD NOT SEE**: "invalid input syntax for type uuid: \"\""

### Tasks Edit Page
- ✅ **SHOULD WORK**: Edit page loads at /dashboard/tasks/[id]/edit
- ❌ **SHOULD NOT SEE**: 404 error or redirect to /dashboard/tasks

---

## 📝 How to Report Results

After testing, update `FINAL-TEST-RESULTS-NOV-02-2025.md` with:

1. **Test 2 (Disciplinary Form)**:
   ```markdown
   **Manual Test Result**: [PASS/FAIL]
   **HTTP Status**: [200/400/500]
   **Error Message**: [If any]
   **Screenshot**: [Path to screenshot if saved]
   ```

2. **Test 3 (Tasks Edit)**:
   ```markdown
   **Manual Test Result**: [PASS/FAIL/CANNOT TEST]
   **Reason**: [If cannot test, why?]
   **URL Reached**: [Final URL after navigation]
   **Error Message**: [If any]
   ```

---

**Note**: This manual testing is required because automated Puppeteer tests failed due to DOM interaction issues, not because the fixes don't work.

**Next Step**: Follow this guide to manually test the remaining 2 fixes, then update the final test results document.
