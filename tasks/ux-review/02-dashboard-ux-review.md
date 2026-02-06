# Admin Dashboard UX Review

**Reviewer**: Dashboard UX Reviewer (Agent)
**Date**: February 7, 2026
**Scope**: All pages under `app/dashboard/` and their components

---

## Executive Summary

The admin dashboard is a comprehensive fleet management tool with strong functional coverage (47+ pages), solid accessibility foundations (aria-labels, sr-only text), and good use of Suspense boundaries and ErrorBoundary patterns. However, there are meaningful UX issues across information hierarchy, navigation consistency, form patterns, data-heavy views, and feedback loops that, if addressed, would significantly improve admin productivity and reduce error rates.

**Critical issues**: 5 | **High priority**: 12 | **Medium priority**: 14 | **Quick wins**: 10

---

## 1. Main Dashboard (`app/dashboard/page.tsx`, `components/dashboard/`)

### Current State

- Two-column layout (7/5 split at xl) with roster periods, alerts, staffing, certifications, quick actions, retirement, and compliance cards
- Each widget wrapped in ErrorBoundary + Suspense with skeleton fallbacks
- "Linear-inspired" clean design language

### Issues Found

#### CRITICAL: Information Hierarchy Is Inverted

**File**: `components/dashboard/dashboard-content.tsx:30-37`

- Roster Periods carousel is positioned at the very top, occupying ~264px of vertical space before the admin sees any actionable data (alerts, staffing shortages)
- The Urgent Alert Banner sits _below_ the roster periods, which defeats its purpose as an urgent notification
- **Recommendation**: Move UrgentAlertBanner to the absolute top. Roster periods can move below or become a collapsible section

#### HIGH: Quick Actions Card Has Low Discoverability

**File**: `components/dashboard/dashboard-content.tsx:67-97`

- Quick Actions (Add Pilot, Update Certification, Generate Reports, Pilot Requests) are buried at the bottom of the left column
- On xl screens they sit below a tall staffing card + certifications banner
- Only 4 actions; missing common tasks like "Approve Pending Requests" or "View Expiring Certifications"
- **Recommendation**: Either elevate Quick Actions higher (above or alongside staffing) or add a floating action button / command palette shortcut. Also add "Pending Requests (N)" as a quick action

#### MEDIUM: No "Last Updated" Timestamp on Dashboard

- Server-rendered data with Redis caching means admins can't tell data freshness
- No manual refresh button visible on the main dashboard (unlike Analytics page which has one)
- **Recommendation**: Add a subtle "Last updated X min ago" with a refresh icon in the page header

#### MEDIUM: ActionCard Description Not Shown

**File**: `components/dashboard/dashboard-content.tsx:143-145`

- The `description` prop is passed but only used in `aria-label` — visually, only the `title` text renders inside the card
- Users lose context on what each action does
- **Recommendation**: Show description text below title (even at xs font size) or add tooltips

---

## 2. Navigation / Sidebar (`components/layout/professional-sidebar-client.tsx`)

### Issues Found

#### CRITICAL: No Mobile Navigation

**File**: `professional-sidebar-client.tsx:199-371`

- Sidebar is a `fixed` 240px left panel with no responsive behavior
- No hamburger menu, no mobile overlay, no slide-out drawer
- On viewports < 768px, the sidebar likely overlaps or hides content entirely
- **Recommendation**: Implement a responsive sidebar with mobile drawer (Sheet component), triggered by a hamburger icon in a mobile top bar

#### HIGH: No Keyboard Shortcut Hints in Nav Items

- The global search has Cmd+K, but individual nav items have no shortcut hints
- Admin power users benefit from keyboard shortcuts (e.g., `G then P` for Pilots, `G then R` for Requests)
- **Recommendation**: Add optional keyboard shortcut tooltips or Cmd+K search result improvements

#### HIGH: "Audit Logs" and "Reports" Use Same Icon

**File**: `professional-sidebar-client.tsx:88,112`

- Both use `ScrollText` icon — visually identical in the nav
- **Recommendation**: Use distinct icons (e.g., `ClipboardList` for Audit Logs, keep `ScrollText` for Reports)

#### MEDIUM: No Badge Counts in Sidebar

- The sidebar supports badges (`NavItem.badge`) but no section populates them
- Pending requests count, expiring certifications count, or unread notifications would add at-a-glance value
- **Recommendation**: Populate badges for Requests (pending count), Certifications (expiring count)

#### LOW: Logout Button Has No Confirmation

**File**: `professional-sidebar-client.tsx:363-369`

- Single click logs out immediately with no confirmation dialog
- Accidental clicks cause immediate session loss
- **Recommendation**: Add a confirmation dialog or at minimum an "Are you sure?" tooltip

---

## 3. Data-Heavy Pages

### 3a. Certifications Page (`app/dashboard/certifications/page.tsx`)

#### CRITICAL: No Pagination — All 607 Certifications Rendered at Once

**File**: `certifications/page.tsx:566`

- `filteredCertifications.map(...)` renders ALL rows in a single table
- With 607+ records this causes significant DOM size, slow renders, and poor scroll performance
- No virtualization or pagination implemented
- **Recommendation**: Add server-side or client-side pagination (20-50 per page). The audit-logs page already has good pagination — follow that pattern

#### HIGH: No Column Sorting

- Table headers are static text — no click-to-sort capability
- Unlike the RequestsTable which has sort buttons on columns
- **Recommendation**: Add sortable column headers (at minimum: Pilot Name, Expiry Date, Status)

#### MEDIUM: Delete After Router.refresh But No Data Re-fetch

**File**: `certifications/page.tsx:371-384`

- After deletion, calls `router.refresh()` but the data is fetched client-side via `useState`
- Router refresh may not trigger re-fetch of client state
- The `fetchCertifications()` call is missing after delete success
- **Recommendation**: Call `fetchCertifications()` after successful delete (same pattern as the dialog close handler)

### 3b. Audit Logs Page (`app/dashboard/audit-logs/page.tsx`)

#### HIGH: Inconsistent Visual Language

- Uses raw `<table>` elements with custom Tailwind instead of the `Table` component used elsewhere
- `text-3xl font-bold` stat cards vs the rest of the app's more subtle sizing
- Container uses `container mx-auto px-4 py-8` while most pages use `space-y-6` pattern
- **Recommendation**: Migrate to shared Table component and match dashboard spacing conventions

#### MEDIUM: Pagination Links Could Reset Filters

**File**: `audit-logs/page.tsx:226`

- `new URLSearchParams({ ...params, page: ... })` spreads `params` which might include `undefined` values that become string "undefined" in URLs
- **Recommendation**: Filter out undefined params before constructing URLSearchParams

### 3c. Pilots Page (`app/dashboard/pilots/page.tsx`)

#### LOW: Single Action Button

- Only "Add Pilot" — no bulk import, no export, no filtering visible on the page-level shell
- Content is deferred to `PilotsPageContent` component
- Acceptable if the child component handles filtering, but the page shell looks sparse

---

## 4. Form Pages

### 4a. Leave Request Form (`app/dashboard/leave/new/page.tsx`)

#### HIGH: Raw HTML `<select>` Instead of Design System Components

**File**: `leave/new/page.tsx:232-248, 256-274, 354-369`

- Uses native `<select>` with custom Tailwind classes instead of the `Select` / `SelectTrigger` / `SelectContent` components from the design system
- Same issue in `certifications/new/page.tsx:194-208`
- Creates visual inconsistency — native selects look different across OS/browsers and don't match the dark theme
- **Recommendation**: Replace all raw `<select>` elements with the shadcn/ui Select component for consistency

#### HIGH: Emoji-Based Loading Spinners

**File**: `leave/new/page.tsx:162, 410` and `certifications/new/page.tsx:128, 307`

- Uses `⏳` emoji for loading states instead of proper Loader2 spinner
- Emojis render differently across platforms and look unprofessional in a fleet management tool
- **Recommendation**: Replace with `<Loader2 className="h-4 w-4 animate-spin" />` (already used in certification-form-dialog.tsx)

#### MEDIUM: No Unsaved Changes Warning

- Users filling out long forms get no warning if they navigate away
- Back button and cancel button both immediately navigate without checking for dirty state
- **Recommendation**: Add `beforeunload` handler and/or route-change interception for dirty forms

#### MEDIUM: Error Banner Uses Light Theme Colors

**File**: `leave/new/page.tsx:188-190`

- `bg-red-50` is a light-mode-only background color that will look wrong on dark theme
- Should use theme-aware colors like `bg-destructive/10`
- **Recommendation**: Replace all `bg-red-50`, `text-red-600`, `bg-yellow-50` with semantic theme tokens

### 4b. Certification Form Dialog (`components/certifications/certification-form-dialog.tsx`)

#### GOOD: Well-Implemented Dialog Pattern

- Uses shadcn Form, controlled fields, Zod validation, proper reset on open/close
- CSRF token inclusion
- TanStack Query cache invalidation on success
- This is the gold standard form pattern for this codebase

#### LOW: Notes Field Not Saved to Database

**File**: `certification-form-dialog.tsx:184-189`

- Comment says "completion_date and notes are UI-only — not stored in pilot_checks table"
- Users see and fill in Notes, but they're silently discarded
- Confusing UX — either remove the field or actually persist it
- **Recommendation**: Either remove Notes/completion_date fields or add DB columns to persist them

---

## 5. Reports Page (`app/dashboard/reports/reports-client.tsx`)

#### HIGH: 6-Column Tab Layout Will Break on Smaller Screens

**File**: `reports-client.tsx:36`

- `grid-cols-6` makes each tab very narrow — text truncates or wraps on screens < 1200px
- Tab labels like "Flight Requests" and "Certifications" are too long for small grid cells
- **Recommendation**: Use a scrollable horizontal tab list or a 2-row grid on smaller screens. Consider using `Tabs` with overflow-x-auto

#### MEDIUM: No Report History or Saved Reports

- Each report generation is one-shot — no history of previously generated reports
- Admins generating weekly reports must re-configure filters every time
- **Recommendation**: Add "Saved Report Configurations" or "Recent Reports" section

#### MEDIUM: Help Card at Bottom Feels Redundant

**File**: `reports-client.tsx:172-194`

- Static "Report Features" card at the bottom listing Preview, PDF Export, Email, Filtering
- These features are self-evident from the tabs above
- **Recommendation**: Remove or convert to contextual tooltips within each report form

---

## 6. Analytics Page (`app/dashboard/analytics/page.tsx`)

#### HIGH: Uses `alert()` for Error Feedback

**File**: `analytics/page.tsx:172`

- `alert('Failed to export analytics data')` — uses browser alert for errors
- Breaks the toast notification pattern used everywhere else
- **Recommendation**: Replace with `toast({ variant: 'destructive', ... })`

#### HIGH: Duplicate Content with Planning Page

- Analytics page at `/dashboard/analytics` duplicates similar KPIs that also exist on `/dashboard/planning?tab=analytics`
- Two separate code paths maintaining similar data visualizations
- **Recommendation**: Clarify which is canonical. Consider redirecting one to the other, or differentiating their scopes (e.g., Analytics = historical trends, Planning = forward-looking)

#### MEDIUM: No Real Charts or Visualizations

- Despite being called "Analytics Dashboard", all data is displayed as card grids and colored stat boxes
- No line charts, bar charts, or trend visualizations
- Risk Assessment uses a simple progress bar
- **Recommendation**: Add Recharts or similar for time-series data (leave trends, certification expiry timeline, compliance history)

#### MEDIUM: Inconsistent Typography vs Rest of App

- Page uses `text-3xl font-bold` for h1 while all other pages use `text-xl font-semibold tracking-tight lg:text-2xl`
- Section headers use emoji prefixes (`👥`, `⏰`, `📂`) which don't match the rest of the app's Linear-inspired clean aesthetic
- **Recommendation**: Match the dashboard header pattern and remove emoji prefixes from headers

---

## 7. Request Management (`app/dashboard/requests/page.tsx`)

#### GOOD: Multi-View Pattern (Table/Cards/Calendar)

- ViewModeToggle lets admins switch between Table, Cards, and Calendar views
- URL-based state preservation (`?view=table&tab=leave`)
- Server-side filtering with Suspense boundaries
- This is one of the best-implemented pages

#### MEDIUM: Unauthorized State Shows Bare "Unauthorized" Text

**File**: `requests/page.tsx:59`

- `return <div>Unauthorized</div>` — no styling, no redirect, no explanation
- Other pages properly `redirect('/auth/login')`
- **Recommendation**: Redirect to login with a flash message

#### MEDIUM: Calendar View for Flight Requests Is Odd

**File**: `requests/page.tsx:343-348`

- Flight Requests tab shows `LeaveCalendarClient` — same calendar component as Leave tab
- Flight requests (e.g., training flights, ferry flights) don't have the same calendar semantics as leave
- **Recommendation**: Consider a different view for flight requests in calendar mode, or disable calendar view for flights

---

## 8. Global Search (`components/search/global-search.tsx`)

#### MEDIUM: Only Navigates to Pages, Not Records

- Search only indexes static page routes (16 entries)
- Can't search for a specific pilot name, certification, or request
- **Recommendation**: Add server-side search that queries pilots, certifications, and requests by name/ID

#### LOW: No Search Result Preview

- Results show only title text — no subtitle, no description, no breadcrumb path
- **Recommendation**: Add category subtitle and path hint (e.g., "Operations > Leave Requests")

---

## 9. Common Patterns

### Empty States

- **Good**: PilotRequirementsCard has a proper empty state with illustration and CTA
- **Good**: RequestsTable has a dashed border empty state
- **Bad**: Certifications page has no specialized empty state for zero filtered results (just "No certifications found" text in table)

### Loading States

- **Good**: Suspense + skeleton fallbacks on dashboard, pilots, requests
- **Bad**: Emoji spinners (`⏳`) on form pages instead of proper Loader2 component
- **Bad**: Certifications page shows only "Loading certifications..." text (no skeleton)

### Toast Notifications

- **Good**: Certifications CRUD uses toast for success/error
- **Bad**: Analytics export uses `alert()` instead of toast
- **Inconsistent**: Some toasts have `title` + `description`, others only `description`

### Error Boundaries

- **Good**: Dashboard wraps each widget in ErrorBoundary with reload button
- **Missing**: No error boundaries on Analytics, Reports, or Certifications pages

---

## Priority Summary

### Critical (Fix ASAP)

1. **No mobile navigation** — sidebar blocks mobile entirely
2. **Dashboard information hierarchy** — alerts below roster periods
3. **Certifications: no pagination** — 607+ rows in DOM
4. **Analytics: `alert()` for errors** — breaks UX pattern
5. **Raw HTML selects** in dark theme forms — visual inconsistency

### High Priority

1. Reports tab layout breaks on small screens (grid-cols-6)
2. Emoji spinners instead of Loader2 on form pages
3. Audit logs page uses different visual language than rest of app
4. No sidebar badge counts for pending items
5. Quick Actions low discoverability on dashboard
6. Duplicate Analytics vs Planning/Analytics pages
7. No column sorting on certifications table
8. Audit Logs + Reports share identical icons in nav
9. Light-theme-only colors in error states (bg-red-50)

### Quick Wins (< 1 hour each)

1. Move UrgentAlertBanner above roster periods
2. Replace `⏳` emoji with Loader2 spinner (4 locations)
3. Replace `alert()` with toast in analytics export
4. Add `fetchCertifications()` after delete success
5. Differentiate Audit Logs and Reports sidebar icons
6. Fix unauthorized redirect on requests page
7. Remove emoji prefixes from analytics section headers
8. Add "Last updated" timestamp to dashboard header
9. Show ActionCard descriptions visually
10. Add logout confirmation dialog

---

## Files Reviewed

| File                                                      | Lines        | Status   |
| --------------------------------------------------------- | ------------ | -------- |
| `app/dashboard/page.tsx`                                  | 37           | Reviewed |
| `components/dashboard/dashboard-content.tsx`              | 149          | Reviewed |
| `components/dashboard/pilot-requirements-card.tsx`        | 514          | Reviewed |
| `components/layout/professional-sidebar-client.tsx`       | 373          | Reviewed |
| `app/dashboard/certifications/page.tsx`                   | 663          | Reviewed |
| `app/dashboard/certifications/new/page.tsx`               | 336          | Reviewed |
| `components/certifications/certification-form-dialog.tsx` | 389          | Reviewed |
| `app/dashboard/analytics/page.tsx`                        | 656          | Reviewed |
| `app/dashboard/reports/reports-client.tsx`                | 197          | Reviewed |
| `app/dashboard/requests/page.tsx`                         | 364          | Reviewed |
| `app/dashboard/requests/[id]/page.tsx`                    | 344          | Reviewed |
| `components/requests/requests-table.tsx`                  | 818          | Reviewed |
| `app/dashboard/leave/new/page.tsx`                        | 440          | Reviewed |
| `app/dashboard/audit-logs/page.tsx`                       | 306          | Reviewed |
| `app/dashboard/planning/page.tsx`                         | 91           | Reviewed |
| `components/search/global-search.tsx`                     | 287          | Reviewed |
| `components/leave/leave-requests-client.tsx`              | 80 (partial) | Reviewed |
