# Final Review System - Browser Testing Guide

**Test Date**: October 26, 2025
**Feature**: Week 3 - Final Review System (21-Day Alert)
**URL**: http://localhost:3000/dashboard/leave/final-review

---

## Prerequisites

### 1. Dev Server Running
```bash
npm run dev
```
Server should be running on: http://localhost:3000

### 2. Admin Login Credentials
- **Email**: admin@fleetmanagement.com
- **Password**: [Your admin password]

### 3. Expected Database State
- **RP13/2025**: 5 total requests (4 pending, 1 approved)
- **RP01/2026**: 7 total requests (7 pending, 0 approved)

---

## Test Scenarios

### Scenario 1: Dashboard Access and Authentication

**Steps**:
1. Open http://localhost:3000/dashboard/leave/final-review
2. You should be redirected to /auth/login (if not logged in)
3. Enter admin credentials
4. Click "Sign In"
5. Should redirect to final review dashboard

**Expected Results**:
- ✅ Redirect to login page when unauthenticated
- ✅ Successful login redirects to dashboard
- ✅ Dashboard loads without errors

**What to Look For**:
- No console errors in browser DevTools
- Smooth page transition
- Proper authentication flow

---

### Scenario 2: Statistics Cards Display

**Steps**:
1. View the top statistics section
2. Check all stat cards

**Expected Results**:
- ✅ "Total Alerts Triggered" card displays count
- ✅ "Critical Alerts" card displays count with red styling
- ✅ "Total Pending Requests" card displays sum
- ✅ "Roster Periods Requiring Action" card displays count
- ✅ "Nearest Deadline" card displays closest deadline

**What to Look For**:
- Correct numerical values matching database
- Proper color coding (red for critical)
- Clear, readable text
- Responsive layout

---

### Scenario 3: Critical Alerts Section

**Steps**:
1. Scroll to "Critical Alerts Requiring Action" section
2. Examine each alert card

**Expected Results**:
For each roster period requiring action:
- ✅ Roster period label (e.g., "RP01/2026")
- ✅ Urgency badge with correct color:
  - 🔴 Red = Critical (overdue)
  - 🟠 Orange = Urgent (≤3 days)
  - 🟡 Yellow = Warning (≤7 days)
  - 🔵 Blue = Normal (>7 days)
- ✅ Start date displayed
- ✅ Review deadline displayed
- ✅ Days until deadline (or "OVERDUE")
- ✅ Pending request counts:
  - Total pending
  - Captains pending
  - First Officers pending
- ✅ Checkbox for selection
- ✅ "View Details" link

**What to Look For**:
- Accurate date calculations
- Correct urgency level based on days until deadline
- Proper rank separation (Captains vs First Officers)
- Professional card styling

---

### Scenario 4: All Roster Periods Table

**Steps**:
1. Scroll to "All Roster Periods" section
2. Examine the table

**Expected Results**:
Table columns:
- ✅ Select checkbox column
- ✅ Roster Period (e.g., "RP01/2026")
- ✅ Start Date
- ✅ Days Until Start
- ✅ Alert Triggered (Yes/No)
- ✅ Pending Requests count
- ✅ Captains Pending count
- ✅ First Officers Pending count
- ✅ Actions column (Generate Report button)

**What to Look For**:
- Sortable columns
- Accurate data in each cell
- Checkboxes work properly
- Hover states on rows
- Responsive table design

---

### Scenario 5: Period Selection and Bulk Actions

**Steps**:
1. Click checkbox next to one or more roster periods
2. Observe "Generate Reports" and "Send Emails" buttons
3. Click "Select All" (if available)
4. Click "Deselect All" (if available)

**Expected Results**:
- ✅ Checkboxes toggle correctly
- ✅ Selected count updates in real-time
- ✅ Buttons enable/disable based on selection
- ✅ Visual feedback for selected rows
- ✅ "Generate Reports" button shows count (e.g., "Generate Reports (2)")
- ✅ "Send Emails" button shows count

**What to Look For**:
- Smooth checkbox interactions
- Correct selection state management
- Disabled state for buttons when no selection
- Clear visual indication of selected items

---

### Scenario 6: Generate Reports Function

**Steps**:
1. Select one or more roster periods
2. Click "Generate Reports" button
3. Wait for response

**Expected Results**:
- ✅ Loading state shown on button
- ✅ API call to `/api/leave/final-review/generate-reports`
- ✅ Success message displayed
- ✅ Reports generated (or error message if email service not configured)

**What to Look For**:
- Network request in DevTools (POST to API)
- Proper loading indicators
- Success/error toast notifications
- Response time (should be quick)

**Note**: PDF generation is placeholder - actual PDF conversion requires email service configuration.

---

### Scenario 7: Send Emails Function

**Steps**:
1. Select one or more roster periods
2. Click "Send Emails" button
3. Wait for response

**Expected Results**:
- ✅ Loading state shown on button
- ✅ API call to `/api/leave/final-review/send-emails`
- ✅ Success message displayed
- ✅ Mock email sent confirmation (or error if service not configured)

**What to Look For**:
- Network request in DevTools (POST to API)
- Proper loading indicators
- Success/error notifications
- Response payload shows recipients

**Note**: Email sending is placeholder until email service provider (Resend/SendGrid) is configured.

---

### Scenario 8: Individual Report Generation

**Steps**:
1. Find a roster period in the table
2. Click "Generate Report" button in Actions column
3. Observe response

**Expected Results**:
- ✅ Individual report generated for that period
- ✅ Success notification
- ✅ Report data returned

**What to Look For**:
- Quick response time
- Proper error handling
- Report includes all required data

---

### Scenario 9: View Period Details Link

**Steps**:
1. Click "View Details" link on a critical alert card
2. Should navigate to period details

**Expected Results**:
- ✅ Navigation to leave request details page
- ✅ Shows all leave requests for that roster period
- ✅ Allows approval/denial actions

**What to Look For**:
- Correct period filtering
- All requests displayed
- Proper navigation flow

---

### Scenario 10: Responsive Design

**Steps**:
1. Resize browser window to mobile size (375px width)
2. Resize to tablet size (768px width)
3. Resize to desktop size (1440px width)

**Expected Results**:
- ✅ Mobile: Cards stack vertically, table scrolls horizontally
- ✅ Tablet: 2-column grid for cards, table readable
- ✅ Desktop: Full layout with all columns visible
- ✅ No horizontal scrolling on any size
- ✅ Touch-friendly buttons on mobile

**What to Look For**:
- Smooth transitions between breakpoints
- Readable text at all sizes
- No content overflow
- Proper spacing and padding

---

### Scenario 11: Empty State

**Steps**:
1. If no pending requests exist in database, check empty state

**Expected Results**:
- ✅ "No critical alerts" message displayed
- ✅ Helpful text explaining why
- ✅ Suggestion to check back later

**What to Look For**:
- Clear messaging
- Professional empty state design
- No errors when no data

---

### Scenario 12: Date Calculations Accuracy

**Steps**:
1. Check roster period start dates
2. Verify review deadlines (21 days before start)
3. Check "days until deadline" calculations

**Expected Results**:
For **RP12/2025**:
- ✅ Start Date: October 11, 2025
- ✅ Review Deadline: September 20, 2025 (21 days before)

For **RP01/2026**:
- ✅ Start Date: February 1, 2026 (calculated from anchor)
- ✅ Review Deadline: January 11, 2026 (21 days before)

**Calculation Logic**:
```
Anchor: RP12/2025 starts October 11, 2025
Each period = 28 days
RP01/2026 = RP12/2025 + (2 periods × 28 days) = Oct 11 + 56 days = Dec 6, 2025
```

**What to Look For**:
- Accurate date arithmetic
- Correct urgency levels based on days
- Proper handling of year boundaries

---

### Scenario 13: Urgency Level Color Coding

**Steps**:
1. Find roster periods with different urgency levels
2. Verify color coding matches deadline proximity

**Expected Color Coding**:
- 🔴 **Critical (Red)**: Deadline passed (daysUntilDeadline < 0)
- 🟠 **Urgent (Orange)**: 3 days or less (daysUntilDeadline ≤ 3)
- 🟡 **Warning (Yellow)**: 7 days or less (daysUntilDeadline ≤ 7)
- 🔵 **Normal (Blue)**: More than 7 days (daysUntilDeadline > 7)

**What to Look For**:
- Consistent color scheme across dashboard
- Clear visual hierarchy
- Accessible color contrast ratios

---

### Scenario 14: Performance Testing

**Steps**:
1. Open browser DevTools → Network tab
2. Reload the dashboard page
3. Check performance metrics

**Expected Results**:
- ✅ Initial page load < 2 seconds
- ✅ API calls < 500ms response time
- ✅ No memory leaks
- ✅ Smooth scrolling and interactions

**What to Look For**:
- Minimal network requests
- Efficient data fetching
- No unnecessary re-renders
- Fast time to interactive (TTI)

---

### Scenario 15: Error Handling

**Steps**:
1. Disconnect from internet (simulate network failure)
2. Try to generate reports
3. Reconnect and retry

**Expected Results**:
- ✅ Error message displayed clearly
- ✅ No application crash
- ✅ Retry mechanism available
- ✅ Graceful degradation

**What to Look For**:
- User-friendly error messages
- Proper error boundaries
- Network error handling
- Fallback UI states

---

## Browser Compatibility Testing

### Browsers to Test
- ✅ Chrome (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)

### Mobile Browsers
- ✅ Safari iOS
- ✅ Chrome Android

---

## Console Checks

Open browser DevTools → Console and verify:

### No Errors
- ✅ No red errors in console
- ✅ No uncaught exceptions
- ✅ No 404s for resources

### Expected Warnings (Acceptable)
- ⚠️ Next.js 15 async params warnings (existing issue, not related to Week 3)
- ⚠️ Webpack cache warnings (performance optimization)

---

## Network API Testing

Open DevTools → Network tab and verify:

### GET Requests
- ✅ `/dashboard/leave/final-review` → 200 OK
- ✅ Initial data fetching successful

### POST Requests (When Testing Actions)
- ✅ `POST /api/leave/final-review/generate-reports` → 200 OK
- ✅ `POST /api/leave/final-review/send-emails` → 200 OK

### Request Payloads
```json
// Generate Reports Request
{
  "periods": ["RP01/2026", "RP13/2025"]
}

// Send Emails Request
{
  "periods": ["RP01/2026"],
  "recipients": [
    {
      "email": "rostering@fleetmanagement.com",
      "name": "Rostering Team",
      "role": "rostering_manager"
    }
  ]
}
```

---

## Accessibility Testing

### Keyboard Navigation
1. Tab through all interactive elements
2. Press Enter/Space on buttons
3. Use arrow keys in table

**Expected Results**:
- ✅ Logical tab order
- ✅ Visible focus indicators
- ✅ All actions accessible via keyboard

### Screen Reader Testing
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate through dashboard

**Expected Results**:
- ✅ Proper heading hierarchy
- ✅ Button labels announced
- ✅ Form inputs labeled
- ✅ Table structure readable

---

## Known Issues

### Non-Week-3 Issues (Pre-existing)
1. **Async params warning**: Route `/dashboard/leave/[id]` and `/api/leave-stats/[pilotId]/[year]` need params await
2. **Audit logs relationship error**: Database schema mismatch (not affecting Week 3)

### Week 3 Limitations
1. **Email service**: Placeholder implementation - requires email provider configuration
2. **PDF generation**: HTML output ready, actual PDF conversion needs library integration

---

## Test Completion Checklist

**Core Functionality**:
- [ ] Dashboard loads successfully
- [ ] Authentication working
- [ ] Statistics cards display correctly
- [ ] Critical alerts section shows data
- [ ] All roster periods table populated
- [ ] Period selection works
- [ ] Urgency color coding accurate
- [ ] Date calculations correct

**Interactions**:
- [ ] Checkboxes toggle properly
- [ ] Generate Reports button functional
- [ ] Send Emails button functional
- [ ] Individual report generation works
- [ ] View Details navigation works

**Quality**:
- [ ] Responsive design works on all screen sizes
- [ ] No console errors
- [ ] Network requests successful
- [ ] Performance acceptable
- [ ] Error handling graceful

**Accessibility**:
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

---

## Reporting Issues

If you find any issues during testing:

1. **Screenshot**: Capture the issue
2. **Console**: Copy any error messages
3. **Network**: Check DevTools Network tab for failed requests
4. **Steps**: Document exact steps to reproduce
5. **Environment**: Note browser, OS, screen size

---

## Next Steps After Testing

### If All Tests Pass
- ✅ Mark Week 3 as complete
- ✅ Proceed to Week 4 or email service integration
- ✅ Deploy to staging environment

### If Issues Found
- 🔧 Document issues
- 🔧 Prioritize by severity
- 🔧 Fix critical issues first
- 🔧 Re-test after fixes

---

**Happy Testing!** 🚀

If you have any questions or need clarification on any test scenario, feel free to ask.
