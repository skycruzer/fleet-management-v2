# Fleet Management V2 - Manual Testing Checklist
**Date**: October 18, 2025
**Tester**: Maurice (Skycruzer)
**Browser**: Google Chrome
**Dev Server**: http://localhost:3000

---

## 🔐 Test Credentials

### Admin Account
- **Email**: skycruzer@icloud.com
- **Password**: mron2393
- **Role**: Admin
- **Permissions**: Full system access

### Pilot Account
- **Email**: mrondeau@airniugini.com.pg
- **Password**: Lemakot@1972
- **Role**: Pilot/User
- **Permissions**: View-only access

---

## 📋 Testing Protocol

**For each test:**
1. ✅ = Pass (feature works as expected)
2. ⚠️ = Warning (works but has minor issues)
3. ❌ = Fail (critical issue, does not work)
4. 🔄 = Needs Retest

**Document all issues found in the Issues section at the bottom.**

---

## Phase 1: Authentication & Login

### Test 1.1: Login Page Display
- [ ] Navigate to http://localhost:3000/auth/login
- [ ] Page loads without errors
- [ ] Email input field visible
- [ ] Password input field visible
- [ ] "Sign In" button visible
- [ ] No console errors in browser DevTools (F12)

**Result**: ___
**Notes**: ___

---

### Test 1.2: Admin Login
- [ ] Enter email: skycruzer@icloud.com
- [ ] Enter password: mron2393
- [ ] Click "Sign In" button
- [ ] Successfully redirects to /dashboard
- [ ] No errors displayed
- [ ] Dashboard loads within 2 seconds

**Result**: ___
**Notes**: ___

---

## Phase 2: Dashboard Testing (Admin View)

### Test 2.1: Dashboard Display
- [ ] URL is /dashboard
- [ ] Page header shows "Dashboard"
- [ ] Subtitle shows "Fleet overview and key metrics"
- [ ] 4 metric cards visible:
  - [ ] Total Pilots card
  - [ ] Captains card
  - [ ] First Officers card
  - [ ] Compliance Rate card
- [ ] 3 certification status cards visible:
  - [ ] Expired (red)
  - [ ] Expiring Soon (yellow)
  - [ ] Current (green)
- [ ] "Certifications Expiring Soon" alert (if any certs expiring)
- [ ] Quick Actions section with 3 cards:
  - [ ] Add Pilot
  - [ ] Update Certification
  - [ ] View Reports

**Result**: ___
**Notes**: ___

---

### Test 2.2: Dashboard Metrics Accuracy
- [ ] Total Pilots count is 27
- [ ] Numbers match database (check /dashboard/pilots)
- [ ] Compliance Rate percentage is displayed
- [ ] Color coding correct:
  - Green: ≥95%
  - Yellow: 85-94%
  - Red: <85%

**Result**: ___
**Notes**: ___

---

### Test 2.3: Dashboard Console Check
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab
- [ ] **CRITICAL**: NO "Invalid time value" errors
- [ ] **CRITICAL**: NO "Each child in a list should have a unique key" warnings
- [ ] No other React errors

**Result**: ___
**Notes**: ___

---

## Phase 3: Leave Request System

### Test 3.1: Navigate to Leave List
- [ ] Click "Leave" in navigation menu
- [ ] URL changes to /dashboard/leave
- [ ] Page loads successfully
- [ ] Leave request list displays (may be empty)

**Result**: ___
**Notes**: ___

---

### Test 3.2: Submit Leave Request Form
- [ ] Click "New Leave Request" or navigate to /dashboard/leave/new
- [ ] Form loads successfully
- [ ] **Pilot Selection Dropdown**:
  - [ ] Dropdown shows all 27 pilots
  - [ ] Can select a pilot successfully
- [ ] **Leave Type Dropdown**:
  - [ ] Shows 8 leave types:
    - RDO (Rostered Day Off)
    - SDO (Special Day Off)
    - ANNUAL (Annual Leave)
    - SICK (Sick Leave)
    - LSL (Long Service Leave)
    - LWOP (Leave Without Pay)
    - MATERNITY (Maternity Leave)
    - COMPASSIONATE (Compassionate Leave)
  - [ ] Can select leave type successfully

**Result**: ___
**Notes**: ___

---

### Test 3.3: Leave Request Date Selection
- [ ] **Start Date Picker**:
  - [ ] Opens calendar when clicked
  - [ ] Can select a date
- [ ] **End Date Picker**:
  - [ ] Opens calendar when clicked
  - [ ] Can select a date (must be >= start date)
- [ ] **Days Count Auto-Calculation**:
  - [ ] Days count updates automatically
  - [ ] Calculation: (end date - start date + 1)
  - [ ] Example: Oct 20 to Oct 22 = 3 days ✅

**Result**: ___
**Notes**: ___

---

### Test 3.4: Leave Request Auto-Features
- [ ] **Late Request Flag**:
  - [ ] Select start date < 21 days from today
  - [ ] "Late Request" badge appears automatically
  - [ ] Badge is red/yellow warning color
- [ ] **Request Method Dropdown**:
  - [ ] Shows 4 options:
    - EMAIL
    - ORACLE
    - LEAVE_BIDS
    - SYSTEM
  - [ ] Can select request method

**Result**: ___
**Notes**: ___

---

### Test 3.5: Leave Request Submission
- [ ] Fill all required fields:
  - Pilot: (select any pilot)
  - Leave Type: ANNUAL
  - Start Date: (tomorrow)
  - End Date: (day after tomorrow)
  - Request Method: EMAIL
  - Notes: "Test leave request"
- [ ] Click "Submit Request" button
- [ ] **Expected Outcome**:
  - [ ] Success message displayed
  - [ ] Redirected to leave list OR
  - [ ] Conflict warning displayed (if overlapping dates)
  - [ ] Form clears or shows confirmation

**Result**: ___
**Notes**: ___

---

## Phase 4: Admin User Management

### Test 4.1: Navigate to Admin Panel
- [ ] Click "Admin" in navigation menu (should be visible for admin users)
- [ ] URL changes to /dashboard/admin
- [ ] Page loads successfully
- [ ] Shows admin management options

**Result**: ___
**Notes**: ___

---

### Test 4.2: Add User Form
- [ ] Click "Add User" or navigate to /dashboard/admin/users/new
- [ ] Form loads successfully
- [ ] **Full Name Field**:
  - [ ] Input field visible
  - [ ] Try invalid names (should show errors):
    - "A" (too short - min 2 chars)
    - "Test123" (contains numbers - should reject)
    - "Test@User" (special chars - should reject)
  - [ ] Try valid name: "John O'Brien-Smith" (should accept)

**Result**: ___
**Notes**: ___

---

### Test 4.3: Email and Role Validation
- [ ] **Email Field**:
  - [ ] Try invalid email: "notanemail" (should show error)
  - [ ] Try valid email: "test@example.com"
  - [ ] Email converts to lowercase automatically
- [ ] **Role Dropdown**:
  - [ ] Shows 3 options:
    - Admin
    - Manager
    - User
  - [ ] Can select each role
  - [ ] Role descriptions display correctly:
    - Admin: Full system access
    - Manager: Elevated permissions
    - User: Read-only access

**Result**: ___
**Notes**: ___

---

### Test 4.4: Security Warnings Display
- [ ] When "Admin" role selected:
  - [ ] Security warning appears
  - [ ] Warning text: "Admins have full system access"
- [ ] When "Manager" role selected:
  - [ ] Appropriate warning displays
- [ ] Warnings help prevent accidental admin creation

**Result**: ___
**Notes**: ___

---

### Test 4.5: Submit New User
- [ ] Fill form with valid data:
  - Full Name: "Test User"
  - Email: "testuser@example.com"
  - Role: User
- [ ] Click "Create User" button
- [ ] **Expected Outcome**:
  - [ ] Success message OR
  - [ ] Email uniqueness error (if email exists)
  - [ ] User created in database
  - [ ] Audit log entry created

**Result**: ___
**Notes**: ___

---

## Phase 5: Analytics Dashboard

### Test 5.1: Navigate to Analytics
- [ ] Click "Analytics" in navigation OR click "View Reports" from dashboard
- [ ] URL changes to /dashboard/analytics
- [ ] Page loads successfully (may take 1-2 seconds)
- [ ] No errors displayed

**Result**: ___
**Notes**: ___

---

### Test 5.2: Analytics Sections Display
- [ ] **Section 1: Fleet Readiness Overview**
  - [ ] 3 gradient cards visible:
    - Fleet Utilization (shows percentage)
    - Aircraft Availability (shows percentage)
    - Fleet Readiness Score (shows percentage)
  - [ ] Percentages are numeric (0-100%)
  - [ ] Gradient backgrounds visible

- [ ] **Section 2: Pilot Distribution**
  - [ ] Shows Total Pilots
  - [ ] Shows Active Pilots
  - [ ] Shows Captains count
  - [ ] Shows First Officers count

- [ ] **Section 3: Retirement Planning**
  - [ ] Shows pilots retiring in 2 years
  - [ ] Shows pilots retiring in 5 years
  - [ ] Warning icons if numbers are concerning

**Result**: ___
**Notes**: ___

---

### Test 5.3: Analytics Certification & Leave Sections
- [ ] **Section 4: Certification Status**
  - [ ] Total Certifications count
  - [ ] Current certifications (green)
  - [ ] Expiring certifications (yellow)
  - [ ] Expired certifications (red)
  - [ ] Color coding is correct

- [ ] **Section 5: Compliance Rate**
  - [ ] Percentage displayed
  - [ ] Color coded based on value:
    - Green: ≥95%
    - Yellow: 85-94%
    - Red: <85%

- [ ] **Section 6: Category Breakdown**
  - [ ] Scrollable list of certification categories
  - [ ] Each category shows count
  - [ ] Categories are readable

**Result**: ___
**Notes**: ___

---

### Test 5.4: Analytics Leave & Risk Sections
- [ ] **Section 7: Leave Request Analytics**
  - [ ] Total leave requests count
  - [ ] Pending requests (yellow)
  - [ ] Approved requests (green)
  - [ ] Denied requests (red/gray)
  - [ ] Leave type breakdown visible

- [ ] **Section 8: Risk Assessment**
  - [ ] Overall risk score displayed
  - [ ] Progress bar visualization
  - [ ] Risk factors listed
  - [ ] Color coding indicates severity

**Result**: ___
**Notes**: ___

---

### Test 5.5: Analytics Refresh Button
- [ ] "Refresh Data" button visible
- [ ] Click refresh button
- [ ] Loading indicator appears
- [ ] Data updates (numbers may change)
- [ ] No errors during refresh
- [ ] Page doesn't break

**Result**: ___
**Notes**: ___

---

## Phase 6: Pilot Management

### Test 6.1: View Pilot List
- [ ] Navigate to /dashboard/pilots
- [ ] Pilot list table displays
- [ ] Shows all 27 pilots
- [ ] Columns visible:
  - Name
  - Employee ID
  - Rank (Captain/First Officer)
  - Status (Active/Inactive)
  - Certifications count

**Result**: ___
**Notes**: ___

---

### Test 6.2: Filter Pilots
- [ ] **Filter by Rank**:
  - [ ] Select "Captain" - shows only captains
  - [ ] Select "First Officer" - shows only FOs
  - [ ] Select "All" - shows all pilots
- [ ] **Filter by Status**:
  - [ ] Select "Active" - shows only active pilots
  - [ ] Select "Inactive" - shows only inactive pilots
  - [ ] Select "All" - shows all pilots

**Result**: ___
**Notes**: ___

---

### Test 6.3: Add New Pilot Form
- [ ] Navigate to /dashboard/pilots/new
- [ ] Form loads successfully
- [ ] All fields visible:
  - First Name
  - Middle Name (optional)
  - Last Name
  - Employee ID
  - Rank dropdown
  - Status toggle
  - Commencement Date
  - Date of Birth
  - Retirement Age
- [ ] Can fill form without errors

**Result**: ___
**Notes**: ___

---

### Test 6.4: View Pilot Detail
- [ ] Click on any pilot from the list
- [ ] Pilot detail page loads
- [ ] Shows pilot information:
  - Full name
  - Employee ID
  - Rank
  - Status
  - Age
  - Years in service
  - Certifications list
- [ ] Certifications displayed with:
  - Check type
  - Completion date
  - Expiry date
  - Status (red/yellow/green)

**Result**: ___
**Notes**: ___

---

### Test 6.5: Edit Pilot
- [ ] From pilot detail page, click "Edit" button
- [ ] Edit form loads with existing data
- [ ] Can modify fields
- [ ] Click "Save Changes"
- [ ] Changes saved successfully
- [ ] Redirected back to pilot detail
- [ ] Updated data displayed

**Result**: ___
**Notes**: ___

---

## Phase 7: Certification Management

### Test 7.1: View Certifications List
- [ ] Navigate to /dashboard/certifications
- [ ] Certifications list displays
- [ ] Shows recent certifications
- [ ] Columns visible:
  - Pilot name
  - Check type
  - Completion date
  - Expiry date
  - Status (color-coded)

**Result**: ___
**Notes**: ___

---

### Test 7.2: Add Certification Form
- [ ] Navigate to /dashboard/certifications/new
- [ ] Form loads successfully
- [ ] **Pilot Dropdown**:
  - [ ] Shows all 27 pilots
  - [ ] Can select a pilot
- [ ] **Check Type Dropdown**:
  - [ ] Shows all 34 check types
  - [ ] Can select check type
- [ ] **Date Fields**:
  - [ ] Completion date picker works
  - [ ] Expiry date picker works
  - [ ] Can select dates

**Result**: ___
**Notes**: ___

---

### Test 7.3: Submit New Certification
- [ ] Fill all fields:
  - Pilot: (select any)
  - Check Type: (select any)
  - Completion Date: (today)
  - Expiry Date: (6 months from now)
- [ ] Click "Submit" button
- [ ] Success message displayed
- [ ] Certification created
- [ ] Appears in certifications list

**Result**: ___
**Notes**: ___

---

### Test 7.4: Certification Color Coding
- [ ] Find or create certifications with different statuses:
  - [ ] **Expired** (expiry date in past) - should be RED
  - [ ] **Expiring Soon** (expiry ≤30 days) - should be YELLOW
  - [ ] **Current** (expiry >30 days) - should be GREEN
- [ ] Verify color coding is correct
- [ ] Verify status labels match colors

**Result**: ___
**Notes**: ___

---

## Phase 8: Navigation & UI/UX

### Test 8.1: Navigation Menu
- [ ] Navigation menu visible on all pages
- [ ] Menu items accessible:
  - [ ] Dashboard
  - [ ] Pilots
  - [ ] Certifications
  - [ ] Leave
  - [ ] Analytics
  - [ ] Admin (only for admin users)
- [ ] Active page highlighted in menu
- [ ] Menu items clickable
- [ ] Navigation works correctly

**Result**: ___
**Notes**: ___

---

### Test 8.2: Responsive Design
- [ ] Open browser DevTools (F12)
- [ ] Toggle device toolbar (mobile view)
- [ ] Test on different screen sizes:
  - [ ] Mobile (375px width)
  - [ ] Tablet (768px width)
  - [ ] Desktop (1920px width)
- [ ] All pages remain usable
- [ ] No horizontal scrolling issues
- [ ] Text remains readable
- [ ] Buttons remain clickable

**Result**: ___
**Notes**: ___

---

### Test 8.3: Loading States
- [ ] Navigate between pages quickly
- [ ] Loading indicators appear
- [ ] No page crashes during navigation
- [ ] Data loads within reasonable time
- [ ] Skeleton loaders or spinners visible (if implemented)

**Result**: ___
**Notes**: ___

---

## Phase 9: Logout & Pilot Login

### Test 9.1: Admin Logout
- [ ] Click user menu or logout button
- [ ] Logout successfully
- [ ] Redirected to login page OR home page
- [ ] Cannot access /dashboard without re-login
- [ ] Session cleared

**Result**: ___
**Notes**: ___

---

### Test 9.2: Pilot Login
- [ ] Navigate to /auth/login
- [ ] Enter email: mrondeau@airniugini.com.pg
- [ ] Enter password: Lemakot@1972
- [ ] Click "Sign In"
- [ ] Successfully logged in
- [ ] Redirected to dashboard

**Result**: ___
**Notes**: ___

---

### Test 9.3: Pilot View Restrictions
- [ ] **Navigation Menu (Pilot User)**:
  - [ ] Can see: Dashboard, Pilots, Certifications, Leave, Analytics
  - [ ] **CANNOT see**: Admin menu item
- [ ] **Dashboard Access**:
  - [ ] Can view dashboard ✅
  - [ ] Can see metrics (read-only)
- [ ] **Pilot List**:
  - [ ] Can view pilot list ✅
  - [ ] Cannot see "Add Pilot" button (verify)
- [ ] **Admin Panel**:
  - [ ] Navigate directly to /dashboard/admin
  - [ ] Should be denied OR redirected
  - [ ] Cannot access admin functions

**Result**: ___
**Notes**: ___

---

## Phase 10: Error Handling

### Test 10.1: Invalid URLs
- [ ] Navigate to /dashboard/invalid-page
- [ ] 404 page displays OR redirected appropriately
- [ ] No application crash
- [ ] Can navigate back to valid pages

**Result**: ___
**Notes**: ___

---

### Test 10.2: Form Validation Errors
- [ ] Try submitting forms with empty required fields
- [ ] Validation errors display
- [ ] Error messages are clear
- [ ] Form highlights invalid fields
- [ ] Can correct errors and resubmit

**Result**: ___
**Notes**: ___

---

### Test 10.3: Network Error Simulation
- [ ] Open DevTools → Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Navigate to analytics page
- [ ] Loading indicators appear
- [ ] Page eventually loads OR shows timeout error
- [ ] Application doesn't crash

**Result**: ___
**Notes**: ___

---

## 📊 Test Summary

### Overall Results
- **Total Tests Executed**: ___
- **Tests Passed**: ___
- **Tests Failed**: ___
- **Tests with Warnings**: ___

### Critical Issues Found
(List any critical bugs that prevent features from working)

1.
2.
3.

### Non-Critical Issues Found
(List minor issues, UI glitches, or improvements needed)

1.
2.
3.

### Performance Notes
- Dashboard load time: ___
- Analytics page load time: ___
- Form submission speed: ___
- Overall responsiveness: ___

### Browser Console Errors
(Copy any errors from browser DevTools console)

```
(Paste errors here)
```

---

## ✅ Final Checklist

- [ ] All 9 implemented features tested
- [ ] Both admin and pilot logins tested
- [ ] All forms tested (submit, validation, errors)
- [ ] All navigation tested
- [ ] No critical console errors
- [ ] Date calculation bug FIXED (no "Invalid time value")
- [ ] React key warning FIXED (no key warnings)
- [ ] All pages load successfully
- [ ] All API endpoints working (returning 401 or data)
- [ ] Ready for production deployment

---

## 🎯 Sign-Off

**Tester Name**: Maurice (Skycruzer)
**Date Completed**: ___
**Overall Status**: ⬜ PASS / ⬜ FAIL / ⬜ NEEDS FIXES
**Recommendation**: ⬜ DEPLOY / ⬜ FIX ISSUES FIRST

**Signature**: ___

---

**END OF MANUAL TESTING CHECKLIST**
