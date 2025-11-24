# Manual Testing Guide - Pilot Portal Forms

**Server Running**: ✅ http://localhost:3000
**Date**: November 1, 2025
**Author**: Maurice Rondeau

---

## 🎯 Quick Start

The dev server is now running. Follow this guide to test all 3 pilot portal forms and the admin workflow.

---

## Test Credentials

### Pilot Portal Access
- **Email**: Check your database for existing `an_users` records
- **Password**: The password set for that pilot user
- **Login URL**: http://localhost:3000/portal/login

### Admin Portal Access
- **Email**: Your Supabase Auth admin email
- **Password**: Your admin password
- **Login URL**: http://localhost:3000/auth/login

**Note**: If you need to create test users, use the registration pages or database scripts.

---

## 📝 TEST 1: Leave Request Form

### Steps to Test

1. **Open Pilot Portal**
   ```
   http://localhost:3000/portal/login
   ```

2. **Login as Pilot**
   - Use pilot credentials from `an_users` table
   - Should redirect to `/portal/dashboard`

3. **Navigate to Leave Requests**
   ```
   http://localhost:3000/portal/leave-requests/new
   ```
   OR click "Leave Requests" → "New Request" from sidebar

4. **Fill Out Form**
   - **Request Type**: Select from dropdown (ANNUAL, SICK, RDO, SDO, LSL, LWOP, MATERNITY, COMPASSIONATE)
   - **Start Date**: Choose a future date
   - **End Date**: Choose end date (after start date)
   - **Roster Period**: Auto-calculated based on dates ✅
   - **Reason**: Optional text field

5. **Verify Auto-Calculations**
   - Watch roster period field auto-populate
   - Verify days count shows correctly
   - Check validation messages for invalid dates

6. **Submit Form**
   - Click "Submit Leave Request" button
   - Should see loading state ("Submitting...")
   - Should redirect to leave requests list on success

7. **Verify Submission**
   - Go to `/portal/leave-requests`
   - Should see your new request in the list
   - Status should be "PENDING" (yellow badge)

### ✅ Expected Results
- Form loads without errors
- All fields render correctly
- Auto-calculations work
- Validation prevents invalid dates
- Submission succeeds
- Redirect to list page
- New request appears with PENDING status

---

## ✈️ TEST 2: Flight Request Form

### Steps to Test

1. **Navigate to Flight Requests**
   ```
   http://localhost:3000/portal/flight-requests/new
   ```
   OR click "Flight Requests" → "New Request" from sidebar

2. **Fill Out Form**
   - **Request Type**: Select from dropdown
     - ADDITIONAL_FLIGHT
     - ROUTE_CHANGE
     - SCHEDULE_PREFERENCE
     - PICKUP_REQUEST
   - **Flight Date**: Choose date
   - **Route** (optional): e.g., "LAX-JFK"
   - **Flight Number** (optional): e.g., "FL123"
   - **Description** (required): At least 10 characters

3. **Verify Dynamic Help Text**
   - Change request type
   - Watch help text change based on selection
   - Each type has different guidance

4. **Submit Form**
   - Click "Submit Flight Request" button
   - Should see loading state
   - Should redirect on success

5. **Verify Submission**
   - Go to `/portal/flight-requests`
   - Should see your new request
   - Status should show correctly

### ✅ Expected Results
- Form loads without errors
- Request type dropdown works
- Help text updates dynamically
- Validation requires description (min 10 chars)
- Optional fields can be left empty
- Submission succeeds
- New request appears in list

---

## 💬 TEST 3: Feedback Form (NEWLY IMPLEMENTED)

### Steps to Test

1. **Navigate to Feedback**
   ```
   http://localhost:3000/portal/feedback
   ```
   OR click "Feedback" from sidebar

2. **Fill Out Form**
   - **Category**: Select from dropdown
     - operations
     - training
     - scheduling
     - safety
     - equipment
     - system
     - suggestion
     - other
   - **Subject** (required): 5-200 characters, e.g., "Scheduling System Issue"
   - **Message** (required): 10-5000 characters
   - **Submit Anonymously**: Checkbox (optional)

3. **Test Validation**
   - Try submitting with short subject (< 5 chars) → Should show error
   - Try submitting with short message (< 10 chars) → Should show error
   - Fill valid data → Should submit successfully

4. **Submit Form**
   - Click "Submit Feedback" button
   - Should see loading state
   - Should see success message
   - Form should clear on success

5. **Verify Submission**
   - Check for success toast/message
   - Go to feedback list (if available)
   - Or check database: `pilot_feedback` table

### ✅ Expected Results
- Form loads without errors ✅
- All 8 categories in dropdown ✅
- Subject validation works (5-200 chars) ✅
- Message validation works (10-5000 chars) ✅
- Anonymous checkbox toggles ✅
- **Submit button works** (NOT "Not implemented yet") ✅
- Success message appears ✅
- Data saves to database ✅

---

## 👔 TEST 4: Admin Leave Approval (NEWLY IMPLEMENTED)

### Steps to Test

1. **Logout from Pilot Portal**
   - Click logout button
   - Should return to login page

2. **Login to Admin Portal**
   ```
   http://localhost:3000/auth/login
   ```
   - Use admin Supabase Auth credentials
   - Should redirect to `/dashboard`

3. **Navigate to Leave Approval**
   ```
   http://localhost:3000/dashboard/leave/approve
   ```
   OR click "Leave" → "Approve Requests" from sidebar

4. **Verify Dashboard UI**
   - Should see statistics cards at top:
     - Pending (count)
     - Approved (green count)
     - Denied (red count)
   - Should see table with pending leave requests (if any exist)
   - If no pending requests: Should see "All caught up!" empty state ✅

5. **Test Approval Workflow** (if pending requests exist)
   - Find a pending request in the table
   - Should see pilot info:
     - Name and employee ID
     - Rank badge (Captain/First Officer)
     - Request type badge (ANNUAL, SICK, etc.)
     - Dates and days count
     - Roster period
   - Click "Approve" button
   - Should see loading state ("Processing...")
   - Request should disappear from list
   - Success message should appear
   - Statistics should update

6. **Test Denial Workflow**
   - Find another pending request
   - Click "Deny" button
   - Should open dialog with:
     - Request summary
     - Required comments textarea
     - Cancel and Deny buttons
   - Try clicking "Deny Request" without comments → Should be disabled
   - Type comments (required)
   - Click "Deny Request"
   - Should see loading state
   - Dialog should close
   - Request should disappear from list
   - Success message should appear

### ✅ Expected Results
- Dashboard loads without errors ✅
- Statistics display correctly ✅
- Table shows all pending requests ✅
- Empty state appears when no pending requests ✅
- Approve button works (one-click) ✅
- Deny button opens dialog ✅
- Comments required for denial ✅
- Validation prevents empty comments ✅
- Request disappears after approval/denial ✅
- Stats update in real-time ✅
- Success messages appear ✅

---

## 📊 TEST 5: Admin Feedback Dashboard

### Steps to Test

1. **Navigate to Feedback Dashboard**
   ```
   http://localhost:3000/dashboard/feedback
   ```
   OR click "Feedback" from admin sidebar

2. **Verify Dashboard Features**
   - Should see all feedback submissions (if any)
   - Should see filters:
     - Category dropdown
     - Status dropdown (PENDING/REVIEWED/RESOLVED/DISMISSED)
     - Search box
   - Should see table with feedback details

3. **Test Viewing Feedback**
   - Check if pilot name is hidden for anonymous feedback
   - Check if all fields display correctly:
     - Category
     - Subject
     - Message
     - Status
     - Date submitted

4. **Test Admin Response** (if interface exists)
   - Click on feedback item
   - Add response textarea
   - Submit response
   - Status should update to "REVIEWED"

5. **Test Export** (if button exists)
   - Click "Export CSV" button
   - Should download CSV file with all feedback

### ✅ Expected Results
- Dashboard loads ✅
- Feedback list displays ✅
- Filters work ✅
- Anonymous feedback hides pilot identity ✅
- Admin can respond ✅
- Export works ✅

---

## 🔄 Complete Workflow Test

### End-to-End Leave Request Flow

**As Pilot**:
1. Login to pilot portal
2. Submit leave request (ANNUAL, 7 days)
3. See request in list with PENDING status
4. Logout

**As Admin**:
1. Login to admin portal
2. Go to Leave Approval dashboard
3. See the pilot's request in pending list
4. Review details (pilot name, dates, days, roster period)
5. Click "Approve" OR "Deny" with comments
6. Verify request disappears from pending list
7. Verify stats update

**Verify Database**:
1. Check `leave_requests` table
2. Should see record with:
   - status: 'APPROVED' or 'DENIED'
   - reviewed_by: admin user ID
   - reviewed_at: timestamp
   - review_comments: (if denied)

### ✅ Complete Flow Working
- Pilot submission ✅
- Admin review ✅
- Database update ✅
- Audit trail ✅

---

## 🐛 Common Issues & Solutions

### Issue: Forms not loading
**Solution**: Check browser console for errors, verify server is running

### Issue: "Not implemented yet" error on feedback form
**Solution**: This should NOT happen anymore - feedback action is implemented
If you see this: Clear browser cache, hard refresh (Cmd+Shift+R)

### Issue: Leave approval page shows placeholder
**Solution**: This should NOT happen - page is fully implemented
If you see this: Check you're using latest code, rebuild with `npm run build`

### Issue: Can't login
**Solution**:
- Pilot: Check `an_users` table for credentials
- Admin: Check Supabase Auth users
- Verify environment variables are set

### Issue: Validation errors not showing
**Solution**: Check browser console, verify Zod schemas are loaded

### Issue: Forms submit but no data in database
**Solution**:
- Check Supabase connection
- Verify RLS policies allow INSERT
- Check browser network tab for API errors

---

## 📋 Quick Test Checklist

Use this checklist to verify all forms:

### Leave Request Form
- [ ] Form loads without errors
- [ ] All fields render correctly
- [ ] Request type dropdown has all 8 types
- [ ] Dates can be selected
- [ ] Roster period auto-calculates
- [ ] Days count shows correctly
- [ ] Validation works (end date after start date)
- [ ] Submit button shows loading state
- [ ] Submission succeeds
- [ ] Redirects to list page
- [ ] New request appears with PENDING status

### Flight Request Form
- [ ] Form loads without errors
- [ ] Request type dropdown has 4 types
- [ ] Help text changes based on type
- [ ] Date picker works
- [ ] Optional fields can be empty
- [ ] Description required (min 10 chars)
- [ ] Validation messages appear
- [ ] Submit button works
- [ ] Submission succeeds
- [ ] New request appears in list

### Feedback Form (NEW)
- [ ] Form loads without errors
- [ ] Category dropdown has 8 options
- [ ] Subject field validates (5-200 chars)
- [ ] Message field validates (10-5000 chars)
- [ ] Anonymous checkbox works
- [ ] Submit button enabled/disabled correctly
- [ ] **NOT "Not implemented yet" error**
- [ ] Success message appears
- [ ] Form clears after success
- [ ] Data saved to `pilot_feedback` table

### Admin Leave Approval (NEW)
- [ ] Dashboard loads without errors
- [ ] Statistics cards show correct counts
- [ ] Pending requests table displays
- [ ] Empty state shows when no requests
- [ ] Approve button works (one-click)
- [ ] Deny button opens dialog
- [ ] Dialog shows request summary
- [ ] Comments textarea required for denial
- [ ] Cannot submit denial without comments
- [ ] Request disappears after approval/denial
- [ ] Success message appears
- [ ] Stats update in real-time

### Admin Feedback Dashboard
- [ ] Dashboard loads
- [ ] Feedback list displays
- [ ] Filters work (category, status)
- [ ] Anonymous feedback hides pilot identity
- [ ] Can view feedback details
- [ ] Can add admin response
- [ ] Status updates work
- [ ] Export to CSV works

---

## 📞 Need Help?

If you encounter any issues during testing:

1. **Check Browser Console** (`F12` or `Cmd+Option+I`)
   - Look for JavaScript errors
   - Check network tab for failed API calls

2. **Check Server Logs**
   - Terminal where `npm run dev` is running
   - Look for error messages or stack traces

3. **Verify Database**
   - Check tables exist: `leave_requests`, `flight_requests`, `pilot_feedback`
   - Verify RLS policies allow operations
   - Check recent records were inserted

4. **Common Fixes**
   - Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Clear browser cache
   - Restart dev server
   - Check environment variables in `.env.local`

---

## 🎉 Success Criteria

All tests are successful if:

✅ All 3 pilot forms load without errors
✅ All validations work correctly
✅ All submissions save to database
✅ Admin can view pending leave requests
✅ Admin can approve/deny leave requests
✅ Admin can view and respond to feedback
✅ No "Not implemented yet" errors
✅ No console errors
✅ Cache invalidation works (data updates immediately)

---

**Ready to Test!** 🚀

Server is running at: **http://localhost:3000**

Start with the pilot portal login, then test each form in order. Good luck!
