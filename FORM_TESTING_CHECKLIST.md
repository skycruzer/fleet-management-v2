# 📋 Complete Form Testing Checklist
## Fleet Management V2 - Manual Form & Button Testing Guide

**Date**: October 27, 2025
**Purpose**: Systematically test ALL forms and buttons in Admin and Pilot Portals
**Tester**: ___________________

---

## 🏢 ADMIN PORTAL TESTING

### Login & Authentication
**URL**: `/auth/login`

- [ ] Email field accepts input
- [ ] Password field accepts input and masks characters
- [ ] "Sign In" button is clickable
- [ ] Successful login with `skycruzer@icloud.com` / `mron2393`
- [ ] Redirects to `/dashboard` after login

---

### 1. Pilots Management

#### 1.1 Pilots List Page
**URL**: `/dashboard/pilots`

- [ ] Page loads successfully
- [ ] Pilot table displays with data
- [ ] "Add Pilot" button is visible and clickable
- [ ] Edit buttons (pencil icons) are clickable for each pilot
- [ ] View buttons work for each pilot
- [ ] Search/filter functionality works (if present)

#### 1.2 Add Pilot Form
**URL**: `/dashboard/pilots/new`

**Form Fields to Test**:
- [ ] Employee ID field (6 digits required)
- [ ] First Name field (required)
- [ ] Middle Name field (optional)
- [ ] Last Name field (required)
- [ ] Rank dropdown (Captain/First Officer)
- [ ] Contract Type dropdown
- [ ] Nationality field
- [ ] Passport Number field
- [ ] Passport Expiry date picker
- [ ] Date of Birth date picker
- [ ] Commencement Date date picker
- [ ] Is Active radio buttons (Yes/No)
- [ ] Captain Qualifications checkboxes (if Captain selected):
  - [ ] Line Captain
  - [ ] Training Captain
  - [ ] Examiner

**Buttons to Test**:
- [ ] "Create Pilot" button (submits form)
- [ ] "Cancel" button (returns to pilot list)

**Validation to Test**:
- [ ] Try submitting empty form (should show errors)
- [ ] Try invalid Employee ID (not 6 digits)
- [ ] Try future commencement date

#### 1.3 Edit Pilot Form ⚠️ **KNOWN ISSUE**
**URL**: `/dashboard/pilots/[id]/edit`

**Critical Test - Rank Update Issue**:
- [ ] Open edit form for a pilot
- [ ] Note current rank (Captain or First Officer)
- [ ] Change rank in dropdown
- [ ] Fill all other required fields
- [ ] Click "Save Changes"
- [ ] ✅ **VERIFY**: Does rank change persist after save?
- [ ] ✅ **VERIFY**: Refresh page - is rank still changed?
- [ ] ✅ **VERIFY**: Go back to pilot list - is rank updated there?

**Other Fields to Test**:
- [ ] Employee ID (disabled/read-only?)
- [ ] Name fields editable
- [ ] Date fields editable
- [ ] Is Active toggle works
- [ ] Captain qualifications appear/disappear when rank changes

**Buttons to Test**:
- [ ] "Save Changes" button
- [ ] "Cancel" button

---

### 2. Certifications Management

#### 2.1 Certifications List Page
**URL**: `/dashboard/certifications`

- [ ] Page loads successfully
- [ ] Certification table displays
- [ ] "Add Certification" button visible and clickable
- [ ] Edit buttons work for each certification
- [ ] Delete buttons work (with confirmation?)
- [ ] Filter by pilot dropdown works (if present)
- [ ] Filter by status works (if present)

#### 2.2 Add Certification Form
**URL**: `/dashboard/certifications/new`

**Form Fields to Test**:
- [ ] Pilot dropdown (select pilot)
- [ ] Check Type dropdown (select certification type)
- [ ] Completion Date picker
- [ ] Expiry Date picker
- [ ] Expiry Roster Period field (e.g., "RP12/2025")
- [ ] Notes textarea (optional)

**Buttons to Test**:
- [ ] "Create Certification" button
- [ ] "Cancel" button

**Validation**:
- [ ] Completion date cannot be in future
- [ ] Expiry date must be after completion date
- [ ] Roster period format validated

#### 2.3 Edit Certification Form ⚠️ **KNOWN ISSUE**
**URL**: `/dashboard/certifications/[id]/edit`

**Critical Test - Expiry Date Update Issue**:
- [ ] Open edit form for a certification
- [ ] Note current expiry date
- [ ] Change expiry date to a different date
- [ ] Click "Save Changes"
- [ ] ✅ **VERIFY**: Does expiry date change persist?
- [ ] ✅ **VERIFY**: Refresh page - is date still changed?
- [ ] ✅ **VERIFY**: Go back to certifications list - is date updated there?

**Fields to Test**:
- [ ] Pilot name (should be read-only)
- [ ] Check type (should be read-only)
- [ ] Expiry date (should be editable)

**Buttons to Test**:
- [ ] "Save Changes" button
- [ ] "Cancel" button

---

### 3. Leave Management

#### 3.1 Leave Requests List
**URL**: `/dashboard/leave-requests`

- [ ] Page loads successfully
- [ ] Leave requests table displays
- [ ] "Submit Leave Request" button visible and clickable
- [ ] Status filters work (Pending/Approved/Denied)
- [ ] View details buttons work
- [ ] Approve/Deny buttons work (if admin)

#### 3.2 Submit Leave Request Form (Admin)
**URL**: `/dashboard/leave-requests/new`

**Form Fields to Test**:
- [ ] Pilot dropdown (select pilot)
- [ ] Leave Type dropdown (Annual, Sick, RDO, SDO, etc.)
- [ ] Start Date picker
- [ ] End Date picker
- [ ] Days Requested (auto-calculated?)
- [ ] Request Date picker
- [ ] Request Method dropdown (Email, System, etc.)
- [ ] Reason textarea

**Buttons to Test**:
- [ ] "Submit Leave Request" button
- [ ] "Cancel" button

**Validation**:
- [ ] Start date cannot be in past
- [ ] End date must be after start date
- [ ] Days requested calculated correctly

#### 3.3 Leave Approval Dashboard
**URL**: `/dashboard/leave/approve`

- [ ] Page loads successfully
- [ ] Pending requests visible
- [ ] Stats cards display correctly (Pending, Approved, Denied)
- [ ] Approve buttons work
- [ ] Deny buttons work
- [ ] View details works

---

### 4. Flight Requests Management

#### 4.1 Flight Requests List
**URL**: `/dashboard/flight-requests`

- [ ] Page loads successfully
- [ ] Flight requests table displays
- [ ] "New Flight Request" button visible (if present)
- [ ] Status filters work
- [ ] View details works

---

### 5. Feedback Admin

#### 5.1 Feedback Dashboard
**URL**: `/dashboard/feedback`

- [ ] Page loads successfully
- [ ] Feedback submissions visible
- [ ] Stats cards display:
  - [ ] Total Submissions
  - [ ] Unreviewed
  - [ ] In Progress
  - [ ] Resolved
- [ ] Category filters work
- [ ] Status update buttons work
- [ ] View feedback details works

---

### 6. Analytics & Settings

#### 6.1 Analytics Page
**URL**: `/dashboard/analytics`

- [ ] Page loads successfully
- [ ] Charts/graphs render correctly
- [ ] Data export button works (if present)
- [ ] Date range filters work (if present)

#### 6.2 Settings Page
**URL**: `/dashboard/settings`

- [ ] Page loads successfully
- [ ] Settings form displays
- [ ] "Save Settings" button works
- [ ] All setting fields are editable

---

## 👨‍✈️ PILOT PORTAL TESTING

### Login & Registration

#### Pilot Login
**URL**: `/portal/login`

- [ ] Email field accepts input
- [ ] Password field accepts input
- [ ] "Sign In" button works
- [ ] Successful login with `mrondeau@airniugini.com.pg` / `Lemakot@1972`
- [ ] Redirects to `/portal/dashboard` after login
- [ ] "Register" link works (if present)

#### Pilot Registration
**URL**: `/portal/register`

- [ ] Registration form displays
- [ ] All required fields present
- [ ] "Register" button works
- [ ] Validation works correctly
- [ ] Success message after registration

---

### 1. Pilot Dashboard

**URL**: `/portal/dashboard`

- [ ] Page loads successfully
- [ ] Pilot name displays correctly
- [ ] Quick stats cards visible
- [ ] Navigation links work
- [ ] Recent activity displayed (if present)

---

### 2. Leave Requests (Pilot)

#### 2.1 Leave Requests List
**URL**: `/portal/leave-requests`

- [ ] Page loads successfully
- [ ] Pilot's leave requests display
- [ ] "Submit Leave Request" button visible and clickable
- [ ] Status badges display correctly (Pending/Approved/Denied)
- [ ] View details works
- [ ] Delete/cancel buttons work (for pending requests)

#### 2.2 Submit Leave Request Form
**URL**: `/portal/leave-requests/new`

**Form Fields to Test**:
- [ ] Pilot dropdown (pre-selected/read-only?)
- [ ] Leave Type dropdown
- [ ] Start Date picker
- [ ] End Date picker
- [ ] Days Requested (auto-calculated)
- [ ] Request Date (auto-filled?)
- [ ] Request Method dropdown
- [ ] Reason textarea

**Buttons to Test**:
- [ ] "Submit Leave Request" button
- [ ] "Cancel"/"Back to Leave Requests" button

**Validation**:
- [ ] Cannot submit with empty required fields
- [ ] Date validation works
- [ ] Overlapping leave warning (if exists)

---

### 3. Flight Requests (Pilot)

#### 3.1 Flight Requests List
**URL**: `/portal/flight-requests`

- [ ] Page loads successfully
- [ ] Pilot's flight requests display
- [ ] "Submit Flight Request" button visible
- [ ] Status display correct

#### 3.2 Submit Flight Request Form
**URL**: `/portal/flight-requests/new`

**Form Fields to Test**:
- [ ] Flight number field
- [ ] Departure/Arrival airports
- [ ] Date fields
- [ ] Time fields
- [ ] Additional details textarea

**Buttons to Test**:
- [ ] "Submit Request" button
- [ ] "Cancel" button

---

### 4. Feedback Form

**URL**: `/portal/feedback`

- [ ] Page loads successfully
- [ ] Category dropdown displays options:
  - [ ] General
  - [ ] Operations
  - [ ] Safety
  - [ ] Training
  - [ ] Scheduling
  - [ ] System/IT
- [ ] Message textarea accepts input (500 char limit?)
- [ ] Character counter works (if present)
- [ ] "Submit Feedback" button works
- [ ] Success message displays after submission

---

### 5. Leave Bids

#### 5.1 Leave Bids List
**URL**: `/portal/leave-bids`

- [ ] Page loads successfully
- [ ] Previous bids display
- [ ] "Submit Leave Bid" button visible
- [ ] Status display correct

#### 5.2 Submit Leave Bid Form
**URL**: `/portal/leave-bids/new`

- [ ] Form loads successfully
- [ ] Can add multiple bid preferences (up to 10?)
- [ ] Priority ranking works
- [ ] Date pickers work
- [ ] "Submit Bid" button works
- [ ] "Cancel" button works

---

### 6. Profile & Certifications

#### 6.1 Pilot Profile
**URL**: `/portal/profile`

- [ ] Page loads successfully
- [ ] Pilot information displays correctly:
  - [ ] Name
  - [ ] Employee ID
  - [ ] Rank
  - [ ] Contract details
  - [ ] Passport information
- [ ] "Edit Profile" button works (if editable)

#### 6.2 Pilot Certifications
**URL**: `/portal/certifications`

- [ ] Page loads successfully
- [ ] Pilot's certifications display
- [ ] Expiry dates visible
- [ ] Status colors correct (Green/Yellow/Red)
- [ ] Expiring certifications highlighted

---

## 🔍 CRITICAL ISSUES TO VERIFY

### Issue #1: Pilot Rank Update Not Persisting
**Location**: `/dashboard/pilots/[id]/edit`

**Test Steps**:
1. Login as admin
2. Go to any pilot's edit page
3. Change rank from "Captain" to "First Officer" (or vice versa)
4. Click "Save Changes"
5. **CHECK**: Does success message appear?
6. **CHECK**: Are you redirected back to pilot detail/list?
7. **CHECK**: Is the rank updated on the list/detail page?
8. **CHECK**: Refresh the browser - is rank still updated?
9. **CHECK**: Edit the pilot again - is the new rank selected in dropdown?

**Expected**: Rank should persist across all checks
**Current Status**: ❌ FAILING - Rank not persisting

---

### Issue #2: Certification Expiry Date Not Updating
**Location**: `/dashboard/certifications/[id]/edit`

**Test Steps**:
1. Login as admin
2. Go to certifications list
3. Click edit on any certification
4. Note the current expiry date
5. Change expiry date to a different date
6. Click "Save Changes"
7. **CHECK**: Does success message appear?
8. **CHECK**: Are you redirected back to certifications list?
9. **CHECK**: Is the expiry date updated in the list?
10. **CHECK**: Refresh the browser - is date still updated?
11. **CHECK**: Edit the certification again - is the new date shown?

**Expected**: Expiry date should persist across all checks
**Current Status**: ❌ FAILING - Date not persisting

---

## 📊 TEST RESULTS SUMMARY

**Date Tested**: _______________
**Tester**: _______________

### Admin Portal Results
- Total Forms Tested: _____ / 9
- Total Buttons Tested: _____ / ~30
- Passing: _____
- Failing: _____

### Pilot Portal Results
- Total Forms Tested: _____ / 6
- Total Buttons Tested: _____ / ~20
- Passing: _____
- Failing: _____

### Critical Issues
- [ ] Pilot Rank Update - ✅ FIXED / ❌ STILL FAILING
- [ ] Certification Expiry Date - ✅ FIXED / ❌ STILL FAILING

---

## 📝 NOTES & OBSERVATIONS

**Bugs Found**:


**UX Issues**:


**Performance Issues**:


**Recommendations**:


---

**Report Completed By**: ___________________
**Date**: ___________________
**Signature**: ___________________
