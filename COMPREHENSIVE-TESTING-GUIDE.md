# Comprehensive Testing Guide - Fleet Management V2

**Fleet Management V2 - B767 Pilot Management System**
**Date**: October 24, 2025
**Status**: Professional UI Integration Testing
**App URL**: http://localhost:3000

---

## Testing Overview

This guide provides a comprehensive checklist for manually testing the Fleet Management V2 application after the professional UI integration. Follow each section systematically to ensure all functionality works correctly.

---

## 1. Authentication Testing

### Login Flow
- [ ] Navigate to http://localhost:3000
- [ ] Verify landing page loads correctly
- [ ] Click "Login" or navigate to /auth/login
- [ ] **Test Valid Login**:
  - Enter valid credentials (admin user)
  - Click "Sign In" button
  - Verify successful redirect to /dashboard
  - Verify no error messages appear
- [ ] **Test Invalid Login**:
  - Enter invalid credentials
  - Verify appropriate error message appears
  - Verify user remains on login page
- [ ] **Test Empty Fields**:
  - Click "Sign In" with empty fields
  - Verify validation messages appear

### Session Persistence
- [ ] Log in successfully
- [ ] Refresh the page (F5 or Cmd+R)
- [ ] Verify user remains logged in
- [ ] Verify dashboard loads correctly

### Logout Flow
- [ ] Click user menu in header (top-right)
- [ ] Click "Logout" option
- [ ] Verify redirect to login page or home page
- [ ] Verify session is cleared
- [ ] Try to navigate to /dashboard
- [ ] Verify redirect back to login page

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 2. Professional UI Component Testing

### A. Professional Sidebar Testing

**Visual Verification**:
- [ ] Sidebar appears on left side (fixed position)
- [ ] Dark slate-900 background color
- [ ] Logo with gradient aviation icon (Plane) appears at top
- [ ] Logo has blue-to-indigo gradient background
- [ ] "Fleet Management" text displays correctly

**Navigation Items**:
- [ ] All navigation items display:
  - Dashboard
  - Pilots
  - Certifications
  - Renewal Planning
  - Leave Requests
  - Flight Requests
  - Tasks
  - Disciplinary
  - Audit Logs
  - Analytics
  - Settings
- [ ] Icons display correctly for each item
- [ ] Hover effects work (background color change)
- [ ] Active page highlights correctly with background color

**Badge Notifications**:
- [ ] "Certifications" item shows warning badge (number)
- [ ] Badge displays correct count (e.g., "12" for expiring certs)
- [ ] Badge has amber/yellow color

**Support CTA**:
- [ ] Support section appears at bottom
- [ ] "Need Help?" heading displays
- [ ] "Contact Support" button appears
- [ ] Button has gradient background (primary to accent)
- [ ] Hover effect works on button

**Animations**:
- [ ] Sidebar slides in smoothly on page load
- [ ] Navigation items have smooth hover transitions
- [ ] Active indicator animates smoothly when changing pages

**Responsive Behavior**:
- [ ] Sidebar hidden on mobile (<1024px width)
- [ ] Mobile navigation appears instead
- [ ] Sidebar appears on desktop (≥1024px width)

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

### B. Professional Header Testing

**Visual Verification**:
- [ ] Header appears at top of page (sticky position)
- [ ] White background in light mode
- [ ] Dark background in dark mode
- [ ] Bottom border appears

**Search Bar**:
- [ ] Search input displays with magnifying glass icon
- [ ] Placeholder text: "Search..."
- [ ] Input accepts text
- [ ] Hover/focus styles work

**Theme Toggle**:
- [ ] Sun/Moon icon displays
- [ ] Click toggles between light and dark mode
- [ ] Theme changes apply immediately
- [ ] Icon switches (Sun ↔ Moon)
- [ ] All components update colors correctly

**Notifications Dropdown**:
- [ ] Bell icon displays
- [ ] Badge shows unread count (e.g., "2")
- [ ] Badge has red background
- [ ] Click opens dropdown menu
- [ ] Dropdown animates smoothly (fade + slide)
- [ ] Notification items display:
  - Icons (colored based on type)
  - Titles and descriptions
  - Timestamps
  - "View all notifications" link at bottom
- [ ] Click outside closes dropdown
- [ ] Escape key closes dropdown

**User Menu Dropdown**:
- [ ] User avatar/icon displays
- [ ] User name displays
- [ ] Click opens dropdown menu
- [ ] Dropdown animates smoothly
- [ ] Menu items display:
  - Profile
  - Settings
  - Logout
- [ ] Each menu item has correct icon
- [ ] Hover effects work
- [ ] Click outside closes dropdown
- [ ] Escape key closes dropdown

**Responsive Behavior**:
- [ ] Header hidden on mobile (<1024px width)
- [ ] Header appears on desktop (≥1024px width)
- [ ] All elements fit correctly on different screen sizes

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

### C. Hero Stats Cards Testing

**Visual Verification**:
- [ ] 4 stat cards display in a grid
- [ ] Responsive grid: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
- [ ] Cards have rounded corners and borders
- [ ] White background in light mode, dark in dark mode

**Card 1: Total Pilots**:
- [ ] Users icon with gradient background (primary blue)
- [ ] "Total Pilots" label
- [ ] Number displays correctly (e.g., "27")
- [ ] Trend indicator shows: "↑ +2 vs last month" (green)
- [ ] Hover effect: card lifts and scales slightly

**Card 2: Certifications**:
- [ ] Award icon with gradient background (success green)
- [ ] "Certifications" label
- [ ] Number displays correctly (e.g., "607")
- [ ] Trend indicator shows: "↑ +12 renewed this month" (green)
- [ ] Hover effect works

**Card 3: Compliance Rate**:
- [ ] CheckCircle icon with gradient background (accent gold)
- [ ] "Compliance Rate" label
- [ ] Percentage displays correctly (e.g., "94.2%")
- [ ] Trend indicator shows: "↑ +2.1% improvement" (green)
- [ ] Hover effect works

**Card 4: Leave Requests**:
- [ ] Calendar icon with gradient background (warning yellow)
- [ ] "Leave Requests" label
- [ ] Number displays correctly (e.g., "8 pending")
- [ ] Trend indicator shows: "↓ -3 vs last week" (green for decrease)
- [ ] Hover effect works

**Animations**:
- [ ] Cards fade in with staggered delay (sequential appearance)
- [ ] Hover animations are smooth (60fps)
- [ ] No layout shift during animation

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

### D. Compliance Overview Testing

**Layout**:
- [ ] Component displays in 3-column grid (desktop)
- [ ] Responsive: Stacks on mobile, 2 columns on tablet
- [ ] White background card with rounded corners

**Circular Compliance Badge** (Left Section):
- [ ] Large circular progress indicator displays
- [ ] SVG circle animates on load
- [ ] Percentage displays in center (e.g., "94.2%")
- [ ] "Overall Compliance" label below
- [ ] Circle color matches compliance level:
  - Green: >95%
  - Yellow: 85-95%
  - Red: <85%

**Category Breakdown** (Middle Section):
- [ ] "Category Breakdown" heading displays
- [ ] 5 categories display with progress bars:
  1. **Medical Certificates**: 26/27 (green, "excellent")
  2. **License Renewals**: 25/27 (blue, "good")
  3. **Type Ratings**: 27/27 (green, "excellent")
  4. **Proficiency Checks**: 23/27 (yellow, "warning")
  5. **Simulator Training**: 24/27 (blue, "good")
- [ ] Each category shows:
  - Label with icon
  - Progress bar (animated)
  - Count (completed/total)
  - Status badge (excellent/good/warning)
- [ ] Progress bar colors match status
- [ ] Progress bars animate on load

**Action Items** (Right Section):
- [ ] "Action Items" heading displays
- [ ] Alert box with yellow background
- [ ] Alert icon displays
- [ ] 3 action items display:
  1. "5 Medical Certificates expiring in 30 days" (high priority, red badge)
  2. "3 Proficiency Checks overdue" (high priority, red badge)
  3. "2 License Renewals due next month" (medium priority, yellow badge)
- [ ] Priority badges display correctly
- [ ] "View All" link at bottom

**Animations**:
- [ ] Component fades in smoothly
- [ ] SVG circle animates (stroke-dasharray)
- [ ] Progress bars animate from 0 to target value
- [ ] Staggered animation for action items

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 3. Dashboard Page Testing

### Page Load
- [ ] Dashboard page loads at /dashboard
- [ ] Page title: "Dashboard"
- [ ] Subtitle: "Fleet overview and key metrics"
- [ ] No console errors
- [ ] No visual glitches

### Component Order
Verify components appear in this order:
1. [ ] Professional Header (top)
2. [ ] Page title and subtitle
3. [ ] Hero Stats Cards (4 cards)
4. [ ] Compliance Overview (3 sections)
5. [ ] Roster Period Carousel (existing widget)
6. [ ] Original Metrics Grid (4 cards: Total Pilots, Captains, First Officers, Compliance Rate)
7. [ ] Certifications Overview (3 cards: Expired, Expiring Soon, Current)
8. [ ] Expiring Certifications Alert (if any certs expiring)
9. [ ] Quick Actions (3 cards)

### Existing Widgets Verification
- [ ] **Roster Period Carousel**:
  - Carousel displays correctly
  - Navigation arrows work
  - Current roster period highlighted
- [ ] **Original Metrics Grid**:
  - 4 metric cards display
  - Icons and values correct
  - Colored backgrounds correct
- [ ] **Certifications Overview**:
  - 3 cards display (Expired, Expiring Soon, Current)
  - Counts accurate
  - Color coding correct (red, yellow, green)
- [ ] **Expiring Certifications Alert**:
  - Alert appears if certifications expiring within 30 days
  - Yellow alert box with AlertTriangle icon
  - Lists up to 5 certifications
  - Shows "+X more" if more than 5
- [ ] **Quick Actions**:
  - 3 action cards display
  - Cards are clickable
  - Hover effects work
  - Links navigate correctly:
    - "Add Pilot" → /dashboard/pilots/new
    - "Update Certification" → /dashboard/certifications/new
    - "View Reports" → /dashboard/analytics

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 4. Navigation Testing

### Sidebar Navigation
Test each navigation link:

- [ ] **Dashboard** (/dashboard)
  - Clicks navigates to dashboard page
  - Active indicator highlights correctly
- [ ] **Pilots** (/dashboard/pilots)
  - Navigates to pilots list page
  - Page loads correctly
- [ ] **Certifications** (/dashboard/certifications)
  - Navigates to certifications page
  - Badge shows correct expiring count
- [ ] **Renewal Planning** (/dashboard/renewal-planning)
  - Navigates to renewal planning page
  - Page loads correctly
- [ ] **Leave Requests** (/dashboard/leave)
  - Navigates to leave requests page
  - Page loads correctly
- [ ] **Flight Requests** (/dashboard/flight-requests)
  - Navigates to flight requests page
  - Page loads correctly
- [ ] **Tasks** (/dashboard/tasks)
  - Navigates to tasks page
  - Page loads correctly
- [ ] **Disciplinary** (/dashboard/disciplinary)
  - Navigates to disciplinary records page
  - Page loads correctly
- [ ] **Audit Logs** (/dashboard/audit-logs)
  - Navigates to audit logs page
  - Page loads correctly
- [ ] **Analytics** (/dashboard/analytics)
  - Navigates to analytics page
  - Page loads correctly
- [ ] **Settings** (/dashboard/admin)
  - Navigates to settings/admin page
  - Page loads correctly

### Browser Navigation
- [ ] Back button works correctly
- [ ] Forward button works correctly
- [ ] Direct URL navigation works
- [ ] Refresh preserves authentication state

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 5. Feature Functionality Testing

### A. Pilots Management
- [ ] Navigate to /dashboard/pilots
- [ ] Pilots list displays correctly
- [ ] Search functionality works
- [ ] Filter functionality works
- [ ] Sort functionality works
- [ ] Click pilot row navigates to detail page
- [ ] "Add Pilot" button works
- [ ] Edit pilot functionality works
- [ ] Delete pilot functionality works (if applicable)

### B. Certifications Management
- [ ] Navigate to /dashboard/certifications
- [ ] Certifications list displays correctly
- [ ] Filter by pilot works
- [ ] Filter by check type works
- [ ] Date range filters work
- [ ] "Add Certification" button works
- [ ] Edit certification functionality works
- [ ] Color coding correct (red/yellow/green)

### C. Renewal Planning
- [ ] Navigate to /dashboard/renewal-planning
- [ ] Renewal planning page loads correctly
- [ ] Roster period selector works
- [ ] Generate renewal plan functionality works
- [ ] Export to PDF works
- [ ] Date exclusions work (December 20 - January 6)

### D. Leave Requests
- [ ] Navigate to /dashboard/leave
- [ ] Leave requests list displays correctly
- [ ] Filter by status works (Pending, Approved, Rejected)
- [ ] Filter by pilot works
- [ ] Create new leave request works
- [ ] Approve leave request works
- [ ] Reject leave request works
- [ ] Eligibility alerts display correctly
- [ ] Final review alerts display correctly (22 days before)

### E. Flight Requests
- [ ] Navigate to /dashboard/flight-requests
- [ ] Flight requests list displays correctly
- [ ] Submit new flight request works
- [ ] Status updates work

### F. Tasks
- [ ] Navigate to /dashboard/tasks
- [ ] Tasks list displays correctly
- [ ] Create new task works
- [ ] Mark task as complete works
- [ ] Filter by status works

### G. Disciplinary Records
- [ ] Navigate to /dashboard/disciplinary
- [ ] Disciplinary records list displays correctly
- [ ] Create new record works
- [ ] View record details works

### H. Audit Logs
- [ ] Navigate to /dashboard/audit-logs
- [ ] Audit logs display correctly
- [ ] Filter by user works
- [ ] Filter by action type works
- [ ] Date range filter works

### I. Analytics
- [ ] Navigate to /dashboard/analytics
- [ ] Analytics dashboard loads correctly
- [ ] Charts display correctly
- [ ] Date range selector works
- [ ] Export functionality works

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 6. Responsive Design Testing

### Desktop Testing (≥1024px)
- [ ] Professional Sidebar displays
- [ ] Professional Header displays
- [ ] All components fit correctly
- [ ] No horizontal scrolling
- [ ] Grid layouts work (2, 3, 4 columns)

### Tablet Testing (768px - 1023px)
- [ ] Sidebar hidden
- [ ] Header hidden
- [ ] Mobile navigation displays
- [ ] Components stack appropriately
- [ ] Grid layouts adjust (2 columns)
- [ ] Touch interactions work

### Mobile Testing (<768px)
- [ ] Sidebar hidden
- [ ] Header hidden
- [ ] Mobile navigation displays and works
- [ ] All components stack vertically
- [ ] Text remains readable
- [ ] Buttons are tappable (minimum 44px)
- [ ] No horizontal scrolling

**Test Browsers**:
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 7. Dark Mode Testing

### Theme Toggle
- [ ] Toggle to dark mode
- [ ] All components update colors correctly
- [ ] Text remains readable
- [ ] Contrast meets accessibility standards

### Component-Specific Dark Mode
- [ ] **Sidebar**: Dark slate-900 background
- [ ] **Header**: Dark background, light text
- [ ] **Hero Stats**: Dark cards, light text
- [ ] **Compliance Overview**: Dark card, light text
- [ ] **Forms**: Dark inputs, light text
- [ ] **Tables**: Dark rows, light text
- [ ] **Modals**: Dark background, light text
- [ ] **Dropdowns**: Dark background, light text

### Persistence
- [ ] Toggle to dark mode
- [ ] Refresh page
- [ ] Verify dark mode persists

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 8. Animation Performance Testing

### Smooth Animations (60fps)
- [ ] Sidebar slide-in animation smooth
- [ ] Hero stats fade-in animation smooth
- [ ] Compliance circle animation smooth
- [ ] Hover effects smooth (lift, scale)
- [ ] Dropdown animations smooth
- [ ] Page transitions smooth

### No Layout Shift
- [ ] Hero stats cards don't cause layout shift
- [ ] Compliance overview doesn't cause layout shift
- [ ] Sidebar doesn't cause layout shift

### Performance Check
- [ ] Open DevTools → Performance tab
- [ ] Record page load
- [ ] Verify no frame drops
- [ ] Verify no jank during animations

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 9. Accessibility Testing

### Keyboard Navigation
- [ ] Tab key navigates through all interactive elements
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape key closes dropdowns/modals
- [ ] Sidebar navigation accessible via keyboard

### Screen Reader Testing
- [ ] Page title announced
- [ ] Headings announced correctly
- [ ] Buttons have accessible labels
- [ ] Form fields have labels
- [ ] Error messages announced
- [ ] Navigation landmarks present

### ARIA Attributes
- [ ] `aria-label` attributes present where needed
- [ ] `aria-expanded` attributes correct for dropdowns
- [ ] `aria-hidden` correct for decorative icons
- [ ] `role` attributes correct

### Color Contrast
- [ ] Text meets WCAG AA standards (4.5:1)
- [ ] Large text meets WCAG AA standards (3:1)
- [ ] Interactive elements have visible focus states

**Tool**: Use browser DevTools → Lighthouse → Accessibility audit

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 10. Error Handling Testing

### Network Errors
- [ ] Disconnect internet
- [ ] Try to load dashboard
- [ ] Verify appropriate error message
- [ ] Verify app doesn't crash

### API Errors
- [ ] Simulate API error (e.g., wrong credentials)
- [ ] Verify error message displays
- [ ] Verify user can recover

### Form Validation Errors
- [ ] Submit form with invalid data
- [ ] Verify validation messages display
- [ ] Verify field highlighting works

### 404 Errors
- [ ] Navigate to /non-existent-page
- [ ] Verify 404 page displays
- [ ] Verify "Back to Home" link works

### ErrorBoundary Testing
- [ ] Trigger component error (if possible)
- [ ] Verify ErrorBoundary catches error
- [ ] Verify fallback UI displays
- [ ] Verify other components continue working

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 11. Data Integrity Testing

### Pilot Data
- [ ] Pilot list shows correct count (27 pilots)
- [ ] Pilot names display correctly
- [ ] Ranks display correctly (Captain, First Officer)
- [ ] Seniority numbers correct (1-27)

### Certification Data
- [ ] Certification count correct (607 certifications)
- [ ] Check types display correctly (34 types)
- [ ] Expiry dates calculate correctly
- [ ] Color coding accurate (red/yellow/green)

### Leave Requests
- [ ] Leave requests display correctly
- [ ] Status accurate (Pending, Approved, Rejected)
- [ ] Roster period calculations correct
- [ ] Eligibility logic correct (minimum 10 per rank)

### Dashboard Metrics
- [ ] Total pilots count correct
- [ ] Captains count correct
- [ ] First Officers count correct
- [ ] Compliance rate calculated correctly
- [ ] Expired certifications count correct
- [ ] Expiring certifications count correct

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 12. Browser Console Testing

### Console Errors
- [ ] Open DevTools → Console
- [ ] Navigate through all pages
- [ ] Verify no JavaScript errors
- [ ] Verify no React warnings

### Network Requests
- [ ] Open DevTools → Network
- [ ] Verify no failed requests (400, 500 errors)
- [ ] Verify API responses correct
- [ ] Verify assets load correctly

### Performance
- [ ] Open DevTools → Performance
- [ ] Record page load
- [ ] Verify no long tasks (>50ms)
- [ ] Verify First Contentful Paint <2s
- [ ] Verify Time to Interactive <3s

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 13. Security Testing

### Authentication
- [ ] Verify JWT tokens stored securely (httpOnly cookies)
- [ ] Verify tokens refresh correctly
- [ ] Verify expired tokens handled correctly
- [ ] Verify logout clears all tokens

### Protected Routes
- [ ] Try accessing /dashboard without login
- [ ] Verify redirect to /auth/login
- [ ] Verify post-login redirect back to intended page

### Input Validation
- [ ] Try SQL injection in forms (e.g., `'; DROP TABLE pilots;--`)
- [ ] Verify input sanitized
- [ ] Try XSS attack in forms (e.g., `<script>alert('XSS')</script>`)
- [ ] Verify HTML escaped

### CSP Headers
- [ ] Open DevTools → Console
- [ ] Verify no CSP violations
- [ ] Verify no inline scripts

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 14. Database Connection Testing

### Supabase Connection
- [ ] Verify app connects to Supabase
- [ ] Verify data loads correctly
- [ ] Verify CRUD operations work
- [ ] Verify real-time updates work (if applicable)

### Test Connection Script
```bash
node test-connection.mjs
```

Expected output:
```
✅ Connection successful
✅ Authentication working
✅ Database accessible
✅ Pilots table: 27 records
✅ Certifications table: 607 records
```

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## 15. Production Build Testing

### Build Process
```bash
npm run build
```

Expected:
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build size reasonable (<5MB)

### Production Server
```bash
npm run start
```

- [ ] Server starts successfully
- [ ] App loads correctly in production mode
- [ ] All features work in production
- [ ] Performance optimized (minified, compressed)

**Status**: ☐ Pass / ☐ Fail / ☐ Issues Found

---

## Testing Summary

### Overall Test Results

| Category | Status | Issues Found |
|----------|--------|--------------|
| Authentication | ☐ Pass / ☐ Fail | |
| Professional Sidebar | ☐ Pass / ☐ Fail | |
| Professional Header | ☐ Pass / ☐ Fail | |
| Hero Stats | ☐ Pass / ☐ Fail | |
| Compliance Overview | ☐ Pass / ☐ Fail | |
| Dashboard Page | ☐ Pass / ☐ Fail | |
| Navigation | ☐ Pass / ☐ Fail | |
| Feature Functionality | ☐ Pass / ☐ Fail | |
| Responsive Design | ☐ Pass / ☐ Fail | |
| Dark Mode | ☐ Pass / ☐ Fail | |
| Animations | ☐ Pass / ☐ Fail | |
| Accessibility | ☐ Pass / ☐ Fail | |
| Error Handling | ☐ Pass / ☐ Fail | |
| Data Integrity | ☐ Pass / ☐ Fail | |
| Browser Console | ☐ Pass / ☐ Fail | |
| Security | ☐ Pass / ☐ Fail | |
| Database Connection | ☐ Pass / ☐ Fail | |
| Production Build | ☐ Pass / ☐ Fail | |

### Critical Issues (Must Fix Before Production)
1.
2.
3.

### High Priority Issues (Should Fix Soon)
1.
2.
3.

### Medium Priority Issues (Nice to Have)
1.
2.
3.

### Low Priority Issues (Future Enhancements)
1.
2.
3.

---

## Automated Testing Recommendations

### E2E Tests with Playwright
Create test files for critical user flows:

**e2e/professional-ui.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Professional UI Integration', () => {
  test('should display professional sidebar', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify sidebar visible
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // Verify logo
    await expect(page.getByText('Fleet Management')).toBeVisible()

    // Verify navigation items
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pilots' })).toBeVisible()
  })

  test('should display hero stats with animations', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for animations to complete
    await page.waitForTimeout(1000)

    // Verify 4 stat cards
    const statCards = page.locator('[data-testid="hero-stat-card"]')
    await expect(statCards).toHaveCount(4)

    // Verify hover effect
    await statCards.first().hover()
    // Check transform applied (visual regression test)
  })

  test('should display compliance overview', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify circular progress
    const complianceBadge = page.locator('[data-testid="compliance-badge"]')
    await expect(complianceBadge).toBeVisible()

    // Verify percentage
    await expect(page.getByText(/\d+\.\d+%/)).toBeVisible()
  })
})
```

**e2e/navigation.spec.ts**:
```typescript
test.describe('Sidebar Navigation', () => {
  test('should navigate to all pages', async ({ page }) => {
    await page.goto('/dashboard')

    // Test each navigation link
    await page.click('text=Pilots')
    await expect(page).toHaveURL('/dashboard/pilots')

    await page.click('text=Certifications')
    await expect(page).toHaveURL('/dashboard/certifications')

    // ... test all links
  })
})
```

### Visual Regression Tests
Use Playwright's screenshot comparison:

```typescript
test('should match professional sidebar screenshot', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForTimeout(1000) // Wait for animations

  const sidebar = page.locator('aside')
  await expect(sidebar).toHaveScreenshot('professional-sidebar.png')
})
```

### Run Tests
```bash
# Run all E2E tests
npm test

# Run specific test file
npx playwright test e2e/professional-ui.spec.ts

# Run with UI
npm run test:ui

# Run headed (see browser)
npm run test:headed

# Debug mode
npm run test:debug
```

---

## Quick Start Testing

**For rapid verification, follow this condensed checklist**:

1. **Login** → Verify successful authentication
2. **Dashboard** → Verify all new components display correctly
3. **Sidebar** → Click each navigation link, verify pages load
4. **Header** → Test theme toggle, notifications, user menu
5. **Animations** → Verify smooth, no jank
6. **Responsive** → Resize browser, verify mobile layout
7. **Dark Mode** → Toggle, verify colors correct
8. **Console** → Verify no errors

**Expected time**: 15-20 minutes for quick verification

---

## Conclusion

This comprehensive testing guide covers all aspects of the Fleet Management V2 application with the professional UI integration. Follow each section systematically, document any issues found, and prioritize fixes based on severity.

**Remember**:
- Test on multiple browsers
- Test on multiple devices (desktop, tablet, mobile)
- Test with different user roles (admin, manager, pilot)
- Document any unexpected behavior
- Take screenshots of visual issues

**Testing Status**: ☐ Not Started / ☐ In Progress / ☐ Completed

**Tested By**: _________________
**Date**: _________________
**Sign-off**: _________________

---

**Fleet Management V2 - B767 Pilot Management System**
*Professional UI Testing Complete* ✈️
