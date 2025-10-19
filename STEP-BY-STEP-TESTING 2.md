# Fleet Management V2 - Step-by-Step Testing Guide
**Testing From Landing Page**
**Date**: October 18, 2025
**Browser**: Google Chrome
**Dev Server**: http://localhost:3000

---

## 🎯 Starting Point: Landing Page

**Current URL**: http://localhost:3000

---

## Step 1: Landing Page Visual Inspection

### What You Should See:

**Hero Section:**
- ✈️ Plane icon (top left)
- **Title**: "Fleet Management V2" (large, bold)
- **Subtitle**: "Modern fleet management system built with Next.js 15, TypeScript, and Supabase. Comprehensive pilot certification tracking, leave management, and compliance monitoring."
- **Two Buttons**:
  - 🟦 Blue "Get Started" button → /dashboard
  - ⬜ White outline "Documentation" button → /docs

**Feature Cards (6 cards in grid):**
1. **Pilot Management** (Users icon)
   - "Comprehensive pilot profiles with certification tracking..."

2. **Certification Tracking** (FileText icon)
   - "Track 38+ check types with automated expiry alerts..."

3. **Analytics Dashboard** (BarChart3 icon)
   - "Real-time fleet metrics, compliance statistics..."

4. **Security First** (Shield icon)
   - "Built with Supabase Row Level Security (RLS)..."

5. **Modern Stack** (Zap icon)
   - "Next.js 15 with React 19, TypeScript strict mode..."

6. **Aviation Compliant** (Plane icon)
   - "FAA standards with color-coded status indicators..."

**Tech Stack Badges:**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Playwright
- Storybook

### ✅ Verification Checklist:
- [ ] Page loads without errors
- [ ] All text is visible and readable
- [ ] All 6 feature cards display correctly
- [ ] Icons are visible (plane, users, file, chart, shield, zap)
- [ ] Both buttons are visible
- [ ] Tech badges display at bottom
- [ ] **Open DevTools (F12) → Console tab**
- [ ] **CRITICAL**: No console errors
- [ ] No missing images or broken icons

**Status**: ___________

---

## Step 2: Test "Documentation" Button

### Action:
Click the **"Documentation"** button (white outline button)

### Expected Result:
- Navigates to `/docs` OR
- Shows "404 Not Found" (documentation may not be implemented yet)

### If 404:
- ✅ This is OK - documentation page is not yet implemented
- Click browser back button to return to landing page

### If page loads:
- [ ] Documentation page displays
- [ ] Content is readable
- [ ] Can navigate back to home

**Status**: ___________

---

## Step 3: Test "Get Started" Button

### Action:
1. **From landing page** (http://localhost:3000)
2. Click the **"Get Started"** button (blue button)

### Expected Result (Important!):
Since you're NOT logged in, clicking "Get Started" should:
- **Redirect you to `/auth/login`** (login page)
- **NOT go to /dashboard** (dashboard is protected)

### What You Should See:
The **Login Page** should now be visible with:
- Email input field
- Password input field
- "Sign In" button

**Status**: ___________

---

## Step 4: Login Page Inspection

**Current URL**: http://localhost:3000/auth/login

### What You Should See:

**Login Form:**
- [ ] Page title or header (may say "Sign In", "Login", or "Fleet Management")
- [ ] **Email input** field (placeholder or label)
- [ ] **Password input** field (password should be hidden)
- [ ] **"Sign In"** or **"Login"** button
- [ ] Form looks professional and clean

### Visual Check:
- [ ] Form is centered on page
- [ ] Input fields have clear labels or placeholders
- [ ] Button is prominent and clickable
- [ ] No broken styling
- [ ] Page is responsive (try resizing browser)

### ✅ Console Check:
- [ ] **Open DevTools (F12) → Console**
- [ ] No errors displayed
- [ ] No warnings about missing components

**Status**: ___________

---

## Step 5: Test Invalid Login

### Action:
1. **Email**: wrongemail@test.com
2. **Password**: wrongpassword
3. Click "Sign In" button

### Expected Result:
- **Error message appears**: "Invalid email or password" OR similar
- **Stays on login page** (URL remains `/auth/login`)
- **No redirect to dashboard**

### Check:
- [ ] Error message is visible
- [ ] Error message is clear
- [ ] Form doesn't crash
- [ ] Can try logging in again

**Status**: ___________

---

## Step 6: Test Valid Admin Login

### Action:
1. **Email**: skycruzer@icloud.com
2. **Password**: mron2393
3. Click "Sign In" button

### Expected Result:
- **Successful login**
- **Redirects to `/dashboard`**
- **Dashboard page loads**

### If Login Fails:
- Check credentials are typed correctly
- Check caps lock is OFF
- Try copying/pasting credentials

### What You Should See After Login:
**Dashboard Page** (details in next step)

**Status**: ___________

---

## Step 7: Dashboard Page (Admin View)

**Current URL**: http://localhost:3000/dashboard

### Expected Display:

**Page Header:**
- Title: "Dashboard"
- Subtitle: "Fleet overview and key metrics"

**4 Metric Cards (Top Row):**
1. **Total Pilots** 👨‍✈️
   - Number: 27
   - Subtitle: "X active"

2. **Captains** ⭐
   - Number: (total captains)
   - Subtitle: "X training"

3. **First Officers** 👤
   - Number: (total FOs)
   - Subtitle: "Active roster"

4. **Compliance Rate** ✅
   - Percentage: XX%
   - Subtitle: "Excellent" / "Good" / "Needs attention"
   - Color: Green (≥95%) / Yellow (85-94%) / Red (<85%)

**3 Certification Cards (Middle Row):**
1. **Expired** 🔴 (red background)
   - Count of expired certifications

2. **Expiring Soon** 🟡 (yellow background)
   - Count within 30 days
   - Subtitle: "Within 30 days"

3. **Current** 🟢 (green background)
   - Count of current certifications

**Alert Section (if any certifications expiring):**
- ⚠️ Warning icon
- Title: "X Certification(s) Expiring Soon"
- Subtitle: "Review and renew certifications expiring within 30 days"
- List of up to 5 expiring certifications showing:
  - Pilot name
  - Check description
  - Days left

**Quick Actions (Bottom):**
- **Add Pilot** ➕
  - Description: "Add a new pilot to the fleet"
  - Links to `/dashboard/pilots/new`

- **Update Certification** 📋
  - Description: "Record a new certification check"
  - Links to `/dashboard/certifications/new`

- **View Reports** 📊
  - Description: "Access analytics and reports"
  - Links to `/dashboard/analytics`

###✅ CRITICAL Checks:
1. **Open DevTools (F12) → Console**
2. **MUST VERIFY**:
   - [ ] ❌ NO "Invalid time value" error (we fixed this!)
   - [ ] ❌ NO "Each child in a list should have a unique key" warning (we fixed this!)
   - [ ] ✅ No other React errors
   - [ ] ✅ Dashboard loads within 2 seconds

**Status**: ___________

---

## Step 8: Navigation Menu Test

### What You Should See (Admin User):

**Navigation Menu Items:**
- [ ] Dashboard
- [ ] Pilots
- [ ] Certifications
- [ ] Leave
- [ ] Analytics
- [ ] **Admin** (⭐ Only visible for admin users)

### Test Each Menu Item:
1. **Click "Pilots"** → Should go to `/dashboard/pilots`
2. **Click "Certifications"** → Should go to `/dashboard/certifications`
3. **Click "Leave"** → Should go to `/dashboard/leave`
4. **Click "Analytics"** → Should go to `/dashboard/analytics`
5. **Click "Admin"** → Should go to `/dashboard/admin`
6. **Click "Dashboard"** → Should return to `/dashboard`

### Verification:
- [ ] All menu items are clickable
- [ ] URL changes correctly
- [ ] Pages load without errors
- [ ] Active page is highlighted in menu

**Status**: ___________

---

## Step 9: Test Leave Request Form

### Action:
1. From navigation menu, click **"Leave"**
2. URL should be `/dashboard/leave`
3. Click **"New Leave Request"** button (or navigate to `/dashboard/leave/new`)

### Expected Form Fields:

**Pilot Selection:**
- [ ] Dropdown menu
- [ ] Shows all 27 pilots
- [ ] Can select a pilot

**Leave Type:**
- [ ] Dropdown with 8 options:
  - RDO (Rostered Day Off)
  - SDO (Special Day Off)
  - ANNUAL (Annual Leave)
  - SICK (Sick Leave)
  - LSL (Long Service Leave)
  - LWOP (Leave Without Pay)
  - MATERNITY (Maternity Leave)
  - COMPASSIONATE (Compassionate Leave)

**Date Selection:**
- [ ] Start Date picker (calendar)
- [ ] End Date picker (calendar)
- [ ] **Days Count** auto-calculates (end - start + 1)

**Request Method:**
- [ ] Dropdown with 4 options:
  - EMAIL
  - ORACLE
  - LEAVE_BIDS
  - SYSTEM

**Notes:**
- [ ] Text area for additional notes

**Submit Button:**
- [ ] "Submit Request" button visible

### Test Auto-Features:

**Test 1: Days Count Auto-Calculation**
- Select Start Date: Oct 20, 2025
- Select End Date: Oct 22, 2025
- **Expected**: Days count shows **3 days**
- [ ] Auto-calculates correctly

**Test 2: Late Request Flag**
- Select Start Date: (tomorrow or next week - < 21 days from today)
- **Expected**: "Late Request" badge appears (red/yellow)
- [ ] Late request flag appears automatically

**Test 3: Submit Form**
- Fill all fields with valid data
- Click "Submit Request"
- **Expected**: Success message OR conflict warning
- [ ] Form submits without crashes

**Status**: ___________

---

## Step 10: Test Admin User Management

### Action:
1. Click **"Admin"** in navigation menu
2. URL should be `/dashboard/admin`
3. Click **"Add User"** or navigate to `/dashboard/admin/users/new`

### Expected Form:

**Full Name Field:**
- [ ] Input field visible
- [ ] Test validation:
  - Type "A" → Should show error (too short)
  - Type "Test123" → Should show error (no numbers allowed)
  - Type "John O'Brien" → Should accept ✅

**Email Field:**
- [ ] Input field visible
- [ ] Test validation:
  - Type "notanemail" → Should show error
  - Type "test@example.com" → Should accept ✅
  - Email converts to lowercase automatically

**Role Dropdown:**
- [ ] Shows 3 options:
  - Admin
  - Manager
  - User
- [ ] Can select each role
- [ ] Role descriptions display:
  - Admin: "Full system access"
  - Manager: "Elevated permissions"
  - User: "Read-only access"

**Security Warnings:**
- [ ] When "Admin" selected → Security warning appears
- [ ] Warning text explains admin privileges

**Submit Button:**
- [ ] "Create User" button visible

**Test Submission:**
- Fill form with:
  - Name: "Test User"
  - Email: "newuser@test.com"
  - Role: User
- Click "Create User"
- **Expected**: Success message OR email uniqueness error
- [ ] Form submits correctly

**Status**: ___________

---

## Step 11: Test Analytics Dashboard

### Action:
1. Click **"Analytics"** in navigation menu OR
2. From main dashboard, click **"View Reports"** quick action
3. URL should be `/dashboard/analytics`

### Expected Sections (8 total):

**1. Fleet Readiness Overview (3 gradient cards):**
- [ ] Fleet Utilization percentage
- [ ] Aircraft Availability percentage
- [ ] Fleet Readiness Score percentage
- [ ] Gradient backgrounds visible

**2. Pilot Distribution:**
- [ ] Total Pilots count
- [ ] Active Pilots count
- [ ] Captains count
- [ ] First Officers count

**3. Retirement Planning:**
- [ ] Pilots retiring in 2 years (with count)
- [ ] Pilots retiring in 5 years (with count)
- [ ] Warning icons if concerning

**4. Certification Status:**
- [ ] Total Certifications
- [ ] Current (green)
- [ ] Expiring (yellow)
- [ ] Expired (red)
- [ ] Color coding correct

**5. Compliance Rate:**
- [ ] Percentage displayed
- [ ] Color coded:
  - Green: ≥95%
  - Yellow: 85-94%
  - Red: <85%

**6. Category Breakdown:**
- [ ] Scrollable list
- [ ] Each category shows count
- [ ] Categories readable

**7. Leave Request Analytics:**
- [ ] Total requests count
- [ ] Pending (yellow)
- [ ] Approved (green)
- [ ] Denied (red/gray)
- [ ] Leave type breakdown

**8. Risk Assessment:**
- [ ] Overall risk score
- [ ] Progress bar visualization
- [ ] Risk factors listed
- [ ] Color coding indicates severity

**Refresh Button:**
- [ ] "Refresh Data" button visible
- [ ] Click to refresh
- [ ] Loading indicator appears
- [ ] Data updates
- [ ] No crashes

**Console Check:**
- [ ] Open DevTools → Console
- [ ] No errors during page load
- [ ] No errors when clicking refresh

**Status**: ___________

---

## Step 12: Test Pilot Management

### Action:
1. Click **"Pilots"** in navigation
2. URL: `/dashboard/pilots`

### Pilot List Page:

**Expected Display:**
- [ ] Table with all 27 pilots
- [ ] Columns:
  - Name
  - Employee ID
  - Rank (Captain/First Officer)
  - Status (Active/Inactive)
  - Certifications count
- [ ] "Add New Pilot" button visible

**Filters:**
- [ ] Rank filter: All / Captain / First Officer
- [ ] Status filter: All / Active / Inactive
- [ ] Filters work correctly

**Test Add Pilot:**
1. Click "Add New Pilot" OR navigate to `/dashboard/pilots/new`
2. Form should load with fields:
   - [ ] First Name
   - [ ] Middle Name (optional)
   - [ ] Last Name
   - [ ] Employee ID
   - [ ] Rank dropdown
   - [ ] Status toggle
   - [ ] Commencement Date
   - [ ] Date of Birth
   - [ ] Retirement Age
3. Can fill form without errors

**Test View Pilot Detail:**
1. Click on any pilot from the list
2. Pilot detail page loads
3. Shows:
   - [ ] Full pilot information
   - [ ] Age calculation
   - [ ] Years in service
   - [ ] Certifications list with color coding
4. "Edit" button visible

**Test Edit Pilot:**
1. Click "Edit" button
2. Edit form loads with existing data
3. Can modify fields
4. Click "Save Changes"
5. Changes saved successfully

**Status**: ___________

---

## Step 13: Test Certification Management

### Action:
1. Click **"Certifications"** in navigation
2. URL: `/dashboard/certifications`

### Certifications List:

**Expected Display:**
- [ ] Table with certifications
- [ ] Columns:
  - Pilot name
  - Check type
  - Completion date
  - Expiry date
  - Status (color-coded)
- [ ] "Add Certification" button

**Color Coding Verification:**
- [ ] RED = Expired (expiry date in past)
- [ ] YELLOW = Expiring Soon (≤30 days)
- [ ] GREEN = Current (>30 days)

**Test Add Certification:**
1. Click "Add Certification" OR navigate to `/dashboard/certifications/new`
2. Form displays:
   - [ ] Pilot dropdown (all 27 pilots)
   - [ ] Check Type dropdown (all 34 check types)
   - [ ] Completion date picker
   - [ ] Expiry date picker
3. Fill all fields
4. Click "Submit"
5. Success message
6. New certification appears in list

**Status**: ___________

---

## Step 14: Logout and Pilot Login

### Logout:
1. Find logout button (usually in navigation or user menu)
2. Click logout
3. Should redirect to `/auth/login` or `/`
4. Cannot access `/dashboard` without login

### Pilot Login:
1. At login page
2. **Email**: mrondeau@airniugini.com.pg
3. **Password**: Lemakot@1972
4. Click "Sign In"
5. Should login successfully

### Verify Pilot Restrictions:

**Navigation Menu (Pilot User):**
- [ ] ✅ CAN see: Dashboard, Pilots, Certifications, Leave, Analytics
- [ ] ❌ CANNOT see: Admin menu item

**Access Control:**
1. Try to access `/dashboard/admin` directly in browser
2. Should be:
   - [ ] Denied with error message OR
   - [ ] Redirected to dashboard OR
   - [ ] Shows 403 Forbidden

**Dashboard View:**
- [ ] Can view dashboard (read-only)
- [ ] Can see metrics
- [ ] Cannot add/edit/delete (verify no "Add" buttons or limited access)

**Status**: ___________

---

## Step 15: Performance & Responsiveness

### Performance Tests:

**Page Load Times:**
- [ ] Dashboard: < 2 seconds
- [ ] Analytics: < 3 seconds (data-heavy)
- [ ] Forms: < 1 second
- [ ] Navigation between pages: Instant

**Network Throttling:**
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Navigate to analytics page
4. Page should:
   - [ ] Show loading indicator
   - [ ] Eventually load (may take 10-30 seconds)
   - [ ] Not crash
5. Reset throttling to "No throttling"

**Responsive Design:**
1. Open DevTools → Device toolbar (Cmd+Shift+M or Ctrl+Shift+M)
2. Test viewports:
   - [ ] Mobile (375px): Usable, no horizontal scroll
   - [ ] Tablet (768px): Good layout
   - [ ] Desktop (1920px): Optimal

**Status**: ___________

---

## ✅ Final Verification Checklist

### All Systems Check:
- [ ] Landing page loads ✅
- [ ] Login system works ✅
- [ ] Dashboard displays without errors ✅
- [ ] **CRITICAL**: No date calculation errors ✅
- [ ] **CRITICAL**: No React key warnings ✅
- [ ] Leave request form works ✅
- [ ] Admin user management works ✅
- [ ] Analytics dashboard loads ✅
- [ ] Pilot management works ✅
- [ ] Certification management works ✅
- [ ] Navigation between pages smooth ✅
- [ ] Both admin and pilot logins tested ✅
- [ ] Role-based access control working ✅
- [ ] No console errors ✅
- [ ] Performance acceptable ✅

---

## 🎯 Test Summary

**Testing Completed**: ___________
**Overall Status**: 🟢 PASS / 🟡 PASS WITH WARNINGS / 🔴 FAIL

**Critical Issues Found**: ___

**Non-Critical Issues**: ___

**Recommendations**:
- [ ] Ready for production deployment
- [ ] Needs minor fixes before deployment
- [ ] Requires significant fixes

---

**Tester**: Maurice (Skycruzer)
**Date**: October 18, 2025
**Signature**: ___________

---

**END OF STEP-BY-STEP TESTING**
