# Safari Testing Guide - Unified Authentication

**Date**: October 26, 2025
**Status**: ✅ Ready for Manual Testing
**Progress**: 16/20 tasks completed (80%)

---

## 🎉 Migration Complete!

The database migration has been successfully completed:
- ✅ **1 pilot migrated** to Supabase Auth
- ✅ **auth_user_id linked** to auth.users table
- ✅ **Password reset email sent** to: `mrondeau@airniugini.com.pg`
- ✅ **Email confirmed** in Supabase Auth

---

## 📋 Test Accounts

### Test Account #1: Migrated Pilot (Primary Test Account)

```
Email: mrondeau@airniugini.com.pg
Name: Maurice Rondeau
Rank: Captain
Employee ID: 2393
Status: ✅ APPROVED & MIGRATED
Auth User ID: a1418a40-bde1-4482-ae4b-20905ffba49c
Password: Must be reset via password reset email
```

**Action Required**:
1. Check email inbox for password reset link
2. Click link and set new password
3. Use new password for testing

---

### Test Account #2: Admin User (For Cross-Portal Testing)

```
Email: skycruzer@icloud.com
Role: admin
Status: ✅ ACTIVE (in an_users table)
```

**Note**: This account exists in `an_users` but NOT in `pilot_users`, so it should:
- ✅ Access `/dashboard` (admin portal)
- ❌ Be denied `/portal` (pilot portal)

---

### Test Account #3: Admin User #2

```
Email: admin@airniugini.com
Role: admin
Status: ✅ ACTIVE
```

---

## 🧪 Manual Testing Checklist

### Test 1: Pilot Portal Authentication ⏳

**Objective**: Verify pilot can access pilot portal only

**Steps**:
1. Open Safari and navigate to: `http://localhost:3000/portal/login`
2. Login with: `mrondeau@airniugini.com.pg` (use password from reset email)
3. **Expected**: Successful login → redirect to `/portal/dashboard`
4. Verify you see:
   - Pilot portal sidebar with "Maurice Rondeau" name
   - Captain rank displayed
   - Employee ID: 2393
   - Dashboard statistics

**Pass Criteria**:
- ✅ Login successful
- ✅ Redirected to `/portal/dashboard`
- ✅ Personal info displayed correctly
- ✅ No errors in browser console

---

### Test 2: Pilot Blocked from Admin Dashboard ⏳

**Objective**: Verify pilot CANNOT access admin dashboard

**Steps**:
1. While logged in as pilot (mrondeau@airniugini.com.pg)
2. Navigate to: `http://localhost:3000/dashboard`
3. **Expected**:
   - Redirect to `/portal/dashboard`
   - Toast notification appears: "You need admin or fleet manager access to view the dashboard"

**Pass Criteria**:
- ✅ Redirected away from `/dashboard`
- ✅ Sent to `/portal/dashboard` instead
- ✅ Toast notification visible
- ✅ Cannot access admin features

---

### Test 3: Admin Blocked from Pilot Portal ⏳

**Objective**: Verify admin CANNOT access pilot portal (unless also a pilot)

**Steps**:
1. Logout from pilot account
2. Navigate to: `http://localhost:3000/auth/login`
3. Login with: `skycruzer@icloud.com` (admin account)
4. **Expected**: Successful login → `/dashboard` (admin portal)
5. Navigate to: `http://localhost:3000/portal/dashboard`
6. **Expected**:
   - Redirect to `/portal/login`
   - Error message: "You are not registered as a pilot"

**Pass Criteria**:
- ✅ Admin can access `/dashboard`
- ✅ Admin blocked from `/portal/*` routes
- ✅ Redirected to `/portal/login` with error
- ✅ No unauthorized access

---

### Test 4: Leave Request Workflow (Pilot) ⏳

**Objective**: Verify pilot can submit and manage leave requests

**Steps**:
1. Login as pilot: `mrondeau@airniugini.com.pg`
2. Navigate to: Leave Requests section
3. Submit new leave request:
   - Type: ANNUAL
   - Start Date: Future date
   - End Date: Future date + 7 days
   - Reason: "Testing leave request workflow"
4. **Expected**: Request created with status PENDING
5. View leave requests list
6. **Expected**: New request appears in list
7. Cancel the PENDING request
8. **Expected**: Request deleted successfully

**Pass Criteria**:
- ✅ Leave request form loads
- ✅ Can submit new request
- ✅ Request appears in list with PENDING status
- ✅ Can cancel PENDING requests
- ✅ No errors during workflow

---

### Test 5: Flight Request Workflow (Pilot) ⏳

**Objective**: Verify pilot can submit flight requests

**Steps**:
1. While logged in as pilot
2. Navigate to: Flight Requests section
3. Submit new flight request:
   - Type: ADDITIONAL_FLIGHT
   - Flight Date: Future date
   - Description: "Testing flight request workflow"
   - Reason: "Additional duty"
4. **Expected**: Request created with status PENDING
5. View flight requests list
6. **Expected**: New request appears
7. Cancel the request
8. **Expected**: Request deleted

**Pass Criteria**:
- ✅ Flight request form loads
- ✅ Can submit new request
- ✅ Request visible in list
- ✅ Can cancel PENDING requests
- ✅ Proper error handling

---

### Test 6: Public Routes (Unauthenticated) ⏳

**Objective**: Verify public routes accessible without auth

**Steps**:
1. Logout completely (or use incognito window)
2. Test these URLs:
   - `http://localhost:3000/` → ✅ Should load homepage
   - `http://localhost:3000/auth/login` → ✅ Should load admin login
   - `http://localhost:3000/portal/login` → ✅ Should load pilot login
   - `http://localhost:3000/portal/register` → ✅ Should load registration
3. Try protected route: `http://localhost:3000/dashboard`
4. **Expected**: Redirect to `/auth/login?redirect=/dashboard`
5. Try pilot route: `http://localhost:3000/portal/dashboard`
6. **Expected**: Redirect to `/portal/login?redirect=/portal/dashboard`

**Pass Criteria**:
- ✅ All public routes accessible
- ✅ Protected routes redirect to login
- ✅ Redirect preserves intended destination
- ✅ No unauthorized access

---

## 🔍 What to Check During Testing

### Browser Console
- Open Safari Developer Tools (Option + Command + C)
- Check Console tab for:
  - ❌ No auth errors
  - ❌ No 403 Forbidden errors
  - ❌ No RLS policy violations
  - ✅ Successful API calls (200 status)

### Network Tab
- Check Network tab for:
  - API calls to `/api/portal/*` → Should return 200 for pilots
  - API calls to `/api/*` (admin) → Should return 403 for pilots
  - Proxy middleware timing visible in headers

### Visual Checks
- Toast notifications appear and dismiss
- User info displays correctly
- No UI glitches or layout issues
- Forms validate properly
- Error messages are clear and helpful

---

## 📊 Testing Progress Tracker

Use this checklist to track your testing:

```
[ ] Test 1: Pilot Portal Authentication
[ ] Test 2: Pilot Blocked from Admin Dashboard
[ ] Test 3: Admin Blocked from Pilot Portal
[ ] Test 4: Leave Request Workflow
[ ] Test 5: Flight Request Workflow
[ ] Test 6: Public Routes (Unauthenticated)
```

---

## 🐛 Bug Report Template

If you find issues, document them like this:

```markdown
**Bug**: [Brief description]
**Test**: [Which test number]
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Console Errors**: [Copy any errors]
**Screenshot**: [If applicable]
```

---

## ✅ Post-Testing Actions

After completing all tests:

1. **Document Results**
   - Note which tests passed/failed
   - Document any bugs found
   - Update `TESTING_STATUS.md`

2. **Decision Point**
   - If all tests pass → Ready for deployment
   - If tests fail → Fix issues and retest

3. **Deployment Preparation**
   - Update environment variables for production
   - Run final build: `npm run build`
   - Deploy to Vercel when approved

---

## 🔧 Quick Troubleshooting

### Issue: "Password reset email not received"
**Solution**: Check spam folder or manually reset password in Supabase dashboard

### Issue: "Cannot access pilot portal after login"
**Solution**: Verify `registration_approved = true` in database

### Issue: "Toast notification not showing"
**Solution**: Check URL for query parameters, verify component loaded

### Issue: "401 Unauthorized on API calls"
**Solution**: Check authentication state, try logout/login

---

## 📱 Testing on Different Devices (Optional)

After Safari testing on Mac, you can also test on:
- **iPhone Safari**: Open http://192.168.1.225:3000 (use network IP)
- **iPad Safari**: Same network URL
- **Other browsers**: Chrome, Firefox (for cross-browser compatibility)

---

## 🎯 Success Criteria

Testing is complete when:
- ✅ All 6 tests pass without errors
- ✅ No console errors during workflows
- ✅ Authentication separation working correctly
- ✅ Pilots cannot access admin dashboard
- ✅ Admins cannot access pilot portal
- ✅ Leave and flight requests work properly
- ✅ No data corruption or loss

---

**Ready to test!** The application is running at: `http://localhost:3000`

**Last Updated**: October 26, 2025 23:18 AEST
