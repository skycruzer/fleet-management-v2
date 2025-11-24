# Leave Approval Dashboard - Testing Guide

**Created**: October 26, 2025
**Version**: 1.0.0
**Test User**: skycruzer

---

## 🎯 Overview

This guide provides comprehensive testing instructions for the new Leave Request Approval Workflow Dashboard.

## 📋 Pre-Test Checklist

- [x] Dev server running at http://localhost:3000
- [x] All components compiled successfully
- [x] TypeScript validation passed
- [x] ESLint checks passed
- [ ] User has Admin or Manager role (required for approval actions)

## 🔐 Test Credentials

**Username**: `skycruzer`
**Email**: `skycruzer@example.com`
**Password**: _[Your password]_
**Required Role**: Admin or Manager

---

## 🧪 Test Scenarios

### Test 1: Access the Dashboard

**Steps**:
1. Open http://localhost:3000 in your browser
2. Sign in with skycruzer credentials
3. Look for "Leave Approval" in the sidebar under "Requests" section
4. Click "Leave Approval"

**Expected Result**:
- Dashboard loads successfully
- URL changes to `/dashboard/leave/approve`
- Page shows header: "Leave Request Approval"
- Statistics cards display at top
- Crew availability widget visible on right

**Verify**:
- [ ] Dashboard accessible
- [ ] Navigation link highlighted
- [ ] No console errors
- [ ] Data loads properly

---

### Test 2: Statistics Display

**Check the stats cards at the top**:

**Expected Elements**:
1. **Pending Requests** - Count of requests with status 'PENDING'
2. **Eligible Requests** - Count with eligibility status 'eligible'
3. **Conflicts Detected** - Count with conflicts > 0
4. **Crew Minimum Violations** - Count affecting crew minimums

**Verify**:
- [ ] All 4 stats cards visible
- [ ] Numbers are accurate (cross-check with leave requests table)
- [ ] Cards styled correctly (icons, colors, layout)

---

### Test 3: Crew Availability Widget

**Location**: Right sidebar

**Expected Sections**:

1. **Current Status**:
   - Captains available count with progress bar
   - First Officers available count with progress bar
   - Color-coded status (green=safe, yellow=warning, red=critical)

2. **Critical Dates** (if any):
   - Red alert banner
   - List of dates with critical crew shortages
   - Shows which rank is affected

3. **Warning Dates** (if any):
   - Yellow alert banner
   - List of dates approaching minimum crew

**Verify**:
- [ ] Current crew counts accurate
- [ ] Progress bars display correctly
- [ ] Status colors correct (safe ≥10, warning 8-9, critical <8)
- [ ] Alert sections only show when relevant

---

### Test 4: Filter Functionality

**Test each filter**:

#### Status Filter
- [ ] "All" - Shows all requests
- [ ] "Pending" - Shows only PENDING requests
- [ ] "Approved" - Shows only APPROVED requests
- [ ] "Denied" - Shows only DENIED requests

#### Roster Period Filter
- [ ] "All Periods" - Shows all
- [ ] Select specific period (e.g., "RP13/2025") - Shows only that period

#### Rank Filter
- [ ] "All Ranks" - Shows both Captains and First Officers
- [ ] "Captain" - Shows only Captain requests
- [ ] "First Officer" - Shows only First Officer requests

#### Leave Type Filter
- [ ] "All Types" - Shows all types
- [ ] Select specific type (e.g., "ANNUAL", "RDO", "SICK") - Shows only that type

#### Toggle Filters
- [ ] "Conflicts Only" - Shows only requests with conflicts
- [ ] "Late Requests Only" - Shows only requests <21 days advance

**Combined Filters**:
- [ ] Test multiple filters together (e.g., Pending + Captains + RP13/2025)
- [ ] Verify card count updates correctly
- [ ] Verify "No requests found" message when filters yield no results

---

### Test 5: Sort Functionality

**Test each sort option**:

- [ ] **Priority Score** - Highest priority first (recommended)
- [ ] **Seniority** - Lowest seniority number first (highest seniority)
- [ ] **Request Date** - Oldest requests first
- [ ] **Rank** - Captains before First Officers

**Verify**:
- [ ] Cards reorder correctly
- [ ] Sort selection persists when changing filters
- [ ] Visual indication of selected sort option

---

### Test 6: Request Card Display

**Check each card element**:

#### Header Section
- [ ] Pilot name displayed
- [ ] Rank badge (Captain/First Officer)
- [ ] Seniority number shown
- [ ] High priority star badge (if priority > 100)
- [ ] Checkbox for selection (pending requests only)

#### Request Details
- [ ] Leave type displayed (ANNUAL, RDO, SICK, etc.)
- [ ] Roster period shown
- [ ] Start date formatted correctly
- [ ] End date formatted correctly
- [ ] Days count accurate

#### Eligibility Indicators
- [ ] **Eligible** - Green badge with checkmark
- [ ] **Conflicts** - Yellow badge with triangle, shows conflict count
- [ ] **Crew Minimum Violation** - Red badge with X
- [ ] **Late Request** - Orange badge with clock

#### Conflict Details (if present)
- [ ] Conflict section appears for requests with conflicts
- [ ] Shows conflicting pilot names
- [ ] Shows conflict type (EXACT, PARTIAL, ADJACENT, NEARBY)
- [ ] Displays conflict dates

#### Crew Minimum Warning (if present)
- [ ] Red warning banner appears
- [ ] Shows which rank would violate minimum
- [ ] Approve button disabled for violations

#### Action Buttons (Pending Only)
- [ ] Approve button visible (green)
- [ ] Deny button visible (red)
- [ ] Buttons disabled if crew minimum violation
- [ ] Buttons only show for PENDING status

---

### Test 7: Individual Approve/Deny Actions

**Test Single Approval**:

1. Find a pending request with "Eligible" status
2. Click "Approve" button
3. Justification modal should appear
4. Enter justification (min 10 characters)
5. Click "Approve Request"

**Verify**:
- [ ] Modal appears with correct title
- [ ] Justification field validates (10-500 chars)
- [ ] Submit button disabled until valid justification
- [ ] Success toast notification appears
- [ ] Request card updates to APPROVED status
- [ ] Audit log created (check audit logs page)

**Test Single Denial**:

1. Find a pending request
2. Click "Deny" button
3. Enter justification
4. Click "Deny Request"

**Verify**:
- [ ] Modal shows red deny styling
- [ ] Success toast appears
- [ ] Request status updates to DENIED
- [ ] Audit log created

---

### Test 8: Bulk Operations

**Test Bulk Approval**:

1. Filter to show "Pending" requests
2. Select 2-3 eligible requests using checkboxes
3. Click "Bulk Approve" button (top toolbar)
4. Enter justification in modal
5. Click "Approve X Requests"

**Verify**:
- [ ] Selection count updates as you check boxes
- [ ] Bulk action buttons appear when ≥1 selected
- [ ] Modal shows correct count
- [ ] Modal shows action summary
- [ ] All selected requests approved
- [ ] Success toast shows count (e.g., "Successfully approved 3 requests")
- [ ] Individual error toasts if any fail
- [ ] Audit logs created for each

**Test Bulk Denial**:

1. Select 2-3 pending requests
2. Click "Bulk Deny"
3. Enter justification
4. Submit

**Verify**:
- [ ] Red deny styling in modal
- [ ] All selected requests denied
- [ ] Success notification with count
- [ ] Audit trail complete

**Test Bulk Validation**:
- [ ] Try selecting a mix of pending and approved - only pending should be selectable
- [ ] Try selecting 51 requests - should show error (max 50)
- [ ] Try submitting without justification - should show validation error
- [ ] Try justification <10 chars - should show error

---

### Test 9: Conflict Detection

**Find requests with conflicts**:

1. Enable "Conflicts Only" filter
2. Examine conflict warnings on cards

**Verify Conflict Types**:
- [ ] **EXACT** - Same dates, same rank
- [ ] **PARTIAL** - Overlapping dates, same rank
- [ ] **ADJACENT** - Within 3 days, same rank
- [ ] **NEARBY** - Within 7 days, same rank

**Verify Conflict Details**:
- [ ] Conflicting pilot name shown
- [ ] Conflict type labeled
- [ ] Conflict dates displayed
- [ ] Multiple conflicts shown if applicable

---

### Test 10: Crew Minimum Logic

**Test crew minimum violation**:

1. Find a request that would violate crew minimum (red badge)
2. Verify approve button is disabled
3. Hover over disabled button to see tooltip (if implemented)

**Verify**:
- [ ] Red "Crew Minimum Violation" badge visible
- [ ] Warning banner shows affected rank
- [ ] Approve button disabled
- [ ] Deny button still enabled

**Test rank-separated logic**:

1. Check that Captains and First Officers evaluated separately
2. Example: If 11 Captains available and 9 FOs available:
   - Captain leave should be approvable
   - First Officer leave should show violation

**Verify**:
- [ ] Each rank checked independently
- [ ] Minimum of 10 per rank enforced
- [ ] Violations only block affected rank

---

### Test 11: Priority Scoring

**Verify priority calculation**:

Sort by "Priority Score" and examine top requests:

**Priority Factors** (higher = more priority):
- Seniority: Lower number = +50 points per position difference
- Urgency: Days until leave starts (closer = higher)
- Request Type: ANNUAL = +20, SICK = +10
- Conflicts: Each conflict = -15 points

**Verify**:
- [ ] High seniority pilots ranked higher
- [ ] Urgent requests (soon departure) ranked higher
- [ ] Annual leave prioritized over RDO
- [ ] Conflicts reduce priority
- [ ] Star badge shown for priority > 100

---

### Test 12: Late Request Handling

**Test late request detection**:

1. Enable "Late Requests Only" filter
2. Check requests with <21 days advance notice

**Verify**:
- [ ] Orange "Late Request" badge appears
- [ ] Badge shows when start_date - today < 21
- [ ] Late requests still approvable
- [ ] Late requests shown in priority sort

---

### Test 13: Responsive Design

**Test on different screen sizes**:

**Desktop (1920x1080)**:
- [ ] Dashboard uses full width
- [ ] Crew widget on right sidebar
- [ ] Cards in grid layout (2-3 columns)
- [ ] All filters visible in toolbar

**Tablet (768px)**:
- [ ] Crew widget stacks below main content
- [ ] Cards in 2-column grid
- [ ] Filters may wrap to second row

**Mobile (375px)**:
- [ ] Single column layout
- [ ] Crew widget stacks
- [ ] Filters in dropdown/accordion
- [ ] Cards stack vertically
- [ ] Action buttons full width

---

### Test 14: Real-Time Updates

**Test data synchronization**:

1. Open dashboard in Browser A
2. Open same dashboard in Browser B (incognito)
3. Approve a request in Browser A
4. Check if Browser B updates (may need refresh)

**Verify**:
- [ ] Changes reflect after refresh
- [ ] Stats update correctly
- [ ] Crew availability updates
- [ ] No stale data displayed

---

### Test 15: Error Handling

**Test error scenarios**:

**Network Errors**:
1. Disable network (DevTools → Network → Offline)
2. Try to approve a request

**Verify**:
- [ ] Error toast appears
- [ ] User-friendly error message
- [ ] No white screen or crash
- [ ] Can retry after reconnecting

**Authorization Errors**:
1. Sign in as non-Admin/Manager user
2. Try to access `/dashboard/leave/approve`

**Verify**:
- [ ] Redirected or shown access denied
- [ ] No unauthorized actions possible

**Validation Errors**:
- [ ] Try short justification (<10 chars) - shows error
- [ ] Try long justification (>500 chars) - shows error
- [ ] Try selecting 51 requests - shows error

---

### Test 16: Performance

**Test load times**:

- [ ] Dashboard loads in <3 seconds
- [ ] Filtering updates instantly (<100ms)
- [ ] Sorting updates instantly (<100ms)
- [ ] Bulk operations complete in reasonable time (<5s for 10 requests)

**Test with large datasets**:

If you have 50+ pending requests:
- [ ] Dashboard still renders smoothly
- [ ] No lag when scrolling
- [ ] Filters remain responsive

---

### Test 17: Accessibility

**Test keyboard navigation**:

- [ ] Tab through all interactive elements
- [ ] Enter/Space to activate buttons
- [ ] Escape to close modals
- [ ] Arrow keys work in select dropdowns

**Test screen reader**:
- [ ] All buttons have descriptive labels
- [ ] Form fields have labels
- [ ] Status badges have descriptive text

**Test color contrast**:
- [ ] All text readable (WCAG AA standard)
- [ ] Badge colors distinguishable
- [ ] Focus indicators visible

---

### Test 18: Audit Trail Verification

**After approving/denying requests**:

1. Navigate to Dashboard → Administration → Audit Logs
2. Search for recent leave approval actions

**Verify**:
- [ ] Approval actions logged
- [ ] Denial actions logged
- [ ] Bulk operations create multiple logs
- [ ] Logs include justification text
- [ ] Logs show correct user (skycruzer)
- [ ] Logs show correct timestamp
- [ ] Logs show before/after values

---

## 🐛 Bug Report Template

If you find issues during testing:

```markdown
**Bug**: [Brief description]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[If applicable]

**Browser**: [Chrome/Safari/Firefox + version]
**Screen Size**: [Desktop/Tablet/Mobile + resolution]
**User Role**: [Admin/Manager]

**Console Errors** (if any):
```
[Paste errors here]
```

**Additional Context**:
[Any other relevant information]
```

---

## ✅ Test Completion Checklist

### Core Functionality
- [ ] Dashboard accessible
- [ ] Data loads correctly
- [ ] All filters work
- [ ] All sort options work
- [ ] Individual approve/deny work
- [ ] Bulk approve/deny work

### Business Logic
- [ ] Eligibility checking accurate
- [ ] Conflict detection correct
- [ ] Crew minimum enforcement working
- [ ] Priority scoring accurate
- [ ] Late request flagging correct
- [ ] Rank-separated logic working

### User Experience
- [ ] Responsive on all devices
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Success feedback works
- [ ] Loading states visible
- [ ] No performance issues

### Security & Audit
- [ ] Authorization enforced
- [ ] Validation working
- [ ] Audit logs created
- [ ] No unauthorized access
- [ ] Data integrity maintained

---

## 📊 Expected Test Data

Based on current database state:

- **Total Pilots**: 27 (Captains + First Officers)
- **Pending Requests**: 11 (4 in RP13/2025, 7 in RP01/2026)
- **Approved Requests**: 1 (in RP13/2025)
- **Leave Types**: RDO (6), ANNUAL (6)

**Sample Conflicts** (if any exist):
- Check for pilots requesting same dates
- Verify rank-separated conflicts

---

## 🎓 Testing Tips

1. **Start with filters**: Test each filter individually before combining
2. **Use DevTools**: Monitor Network tab for API calls and errors
3. **Check Console**: Watch for React warnings or errors
4. **Test edge cases**: Empty states, maximum selections, validation limits
5. **Verify audit trail**: Always check that actions are logged
6. **Test both ranks**: Ensure Captain and First Officer logic works separately
7. **Test bulk operations**: Verify both success and partial failure scenarios

---

## 📝 Notes for skycruzer

- **Your Role**: Ensure you have Admin or Manager role to test approval actions
- **Test Database**: Uses production Supabase (`wgdmgvonqysflwdiiols`)
- **Data Safety**: All actions create audit logs - you can review/reverse if needed
- **Performance**: Dashboard queries all leave requests - may be slow with 100+ requests
- **Next Steps**: After testing, consider adding E2E Playwright tests for automation

---

## 🚀 Quick Start Test Sequence

**5-Minute Smoke Test**:

1. ✅ Sign in as skycruzer
2. ✅ Navigate to Leave Approval
3. ✅ Verify dashboard loads
4. ✅ Check stats display correctly
5. ✅ Test "Pending" filter
6. ✅ Sort by "Priority Score"
7. ✅ Select 1 request
8. ✅ Approve with justification
9. ✅ Verify success notification
10. ✅ Check audit log created

**If all 10 steps pass → Core functionality works!**

---

**Testing Date**: _______________
**Tester**: skycruzer
**Result**: [ ] Pass | [ ] Fail | [ ] Needs Fixes

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
