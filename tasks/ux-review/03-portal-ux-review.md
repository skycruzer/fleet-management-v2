# Pilot Portal UX Review

**Reviewer**: Portal UX Reviewer Agent
**Date**: 2026-02-07
**Scope**: `app/portal/`, `components/portal/`, `components/layout/pilot-portal-sidebar.tsx`

---

## Executive Summary

The pilot portal is a self-service interface for airline crew members to manage leave requests, view certifications, check profiles, and submit feedback. The portal has a solid functional foundation but exhibits several UX issues that impact pilot workflows — particularly on mobile devices where pilots are most likely to access the system. The most critical issues involve **inconsistent visual design language across pages**, **mobile navigation friction**, and **redundant request management pages** that create confusion about where pilots should go to manage their requests.

---

## 1. Navigation & Layout

### File: `components/layout/pilot-portal-sidebar.tsx`

**What works well:**

- Clean sidebar with icon + label + description for each nav item
- Mobile hamburger menu with animated slide-in drawer and backdrop overlay
- Active state highlighting using `bg-primary` fill
- Notification bell integrated into both mobile header and desktop sidebar
- Logout button is prominently placed at the bottom

**UX Issues:**

| #   | Severity     | Issue                                                     | Details                                                                                                                                                                                                                                                                                           |
| --- | ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | **Critical** | Redundant request pages create confusion                  | There are THREE places to manage requests: `/portal/leave-requests`, `/portal/flight-requests`, AND `/portal/requests` (unified "My Requests" with tabs). Pilots will be confused about which to use. The sidebar links to the first two separately, while "My Requests" exists as a hidden page. |
| N2  | **High**     | No "My Requests" link in sidebar                          | The consolidated `/portal/requests` page (with Leave + RDO/SDO tabs) exists but has NO sidebar navigation entry. Pilots can only reach it if they know the URL.                                                                                                                                   |
| N3  | **Medium**   | Feedback split into two sidebar items                     | "Feedback" and "Feedback History" are separate sidebar items. This could be a single "Feedback" page with tabs, reducing nav clutter.                                                                                                                                                             |
| N4  | **Medium**   | No sidebar link to Notifications page                     | Notifications are only reachable via the bell icon dropdown's "View All" link. There's no dedicated sidebar nav entry for `/portal/notifications`.                                                                                                                                                |
| N5  | **Medium**   | Dashboard link uses Cloud icon                            | The dashboard link uses a `Cloud` icon, which doesn't communicate "dashboard" or "home". `Home`, `LayoutDashboard`, or `Gauge` from lucide would be more intuitive.                                                                                                                               |
| N6  | **Low**      | Sidebar `pilotRank` prop is never passed                  | The layout passes `pilotName` and `employeeId` but NOT `pilotRank`. The sidebar displays "Pilot" as fallback instead of the actual rank ("Captain" or "First Officer"). This is a missed personalization opportunity.                                                                             |
| N7  | **Low**      | Mobile sidebar uses `motion.aside` with fixed initial `x` | The sidebar initializes with `x: isDesktop ? 0 : -240` but `isDesktop` starts as `false` (SSR). On desktop, there's a brief flash where the sidebar animates in from left on first render.                                                                                                        |

### File: `app/portal/(protected)/layout.tsx`

**What works well:**

- Force-dynamic prevents stale session data
- Forced password change redirect on `must_change_password`
- Clean layout with ErrorBoundary and QueryProvider

**UX Issues:**

| #   | Severity   | Issue                                  | Details                                                                                                                                                                                                            |
| --- | ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1  | **Medium** | No breadcrumbs or page title indicator | The main content area has no secondary navigation. On mobile (after closing the sidebar), there's no indication of which page the pilot is on besides the page's own header.                                       |
| L2  | **Low**    | Content area has `pt-16 lg:pt-0`       | Mobile content has 16px top padding for the fixed header. This is correct but could cause issues with sticky headers inside child pages (certifications page has its own `sticky top-0` header that will overlap). |

---

## 2. Authentication Flow

### File: `app/portal/(public)/login/page.tsx`

**What works well:**

- Clean, focused login card on dark background
- Password visibility toggle
- Loading state with spinner
- Clear error message styling with icon
- Staff ID + Password (appropriate for enterprise portal)
- `autoComplete` attributes set correctly for browsers/password managers
- Helpful footer: "Contact your administrator if you need account access"

**UX Issues:**

| #   | Severity   | Issue                                              | Details                                                                                                                                                                                                                                             |
| --- | ---------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Medium** | No link to registration or forgot-password         | Comment says "No registration or forgot-password — admin manages accounts" but registration (`/portal/register`) and forgot-password (`/portal/forgot-password`) pages DO exist. Pilots have no way to discover these features from the login page. |
| A2  | **Low**    | Login uses `staffId` but registration uses `email` | Login authenticates with Staff ID while registration collects email as primary identifier. This inconsistency may confuse pilots about which credential to use.                                                                                     |
| A3  | **Low**    | No "Remember me" option                            | For a portal pilots access frequently, a "remember me" checkbox would reduce friction. Session management already uses Redis cookies.                                                                                                               |

### File: `app/portal/(public)/forgot-password/page.tsx`

**What works well:**

- Beautiful aviation-themed design with animated clouds and gradient orbs
- Clear success message after submission
- Security-conscious: doesn't reveal whether email exists

**UX Issues:**

| #   | Severity   | Issue                                       | Details                                                                                                                                                                                                                                                                               |
| --- | ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A4  | **Medium** | Visual design inconsistency with login page | Forgot-password uses elaborate Framer Motion animations, gradient backgrounds, and a completely different visual language than the minimal login page. The registration page uses yet ANOTHER style (light gradient). Three different visual treatments for three related auth pages. |
| A5  | **Low**    | Heavy animation for a utility page          | Floating clouds and pulsing orbs are visually impressive but may feel out of place for a "forgot password" flow. On low-end mobile devices, these animations consume battery and may cause jank.                                                                                      |

### File: `app/portal/(public)/register/page.tsx`

**What works well:**

- Comprehensive registration form with Zod validation
- Clear required field indicators
- Rank selection (Captain/First Officer)
- Success state with redirect countdown

**UX Issues:**

| #   | Severity   | Issue                                 | Details                                                                                                                                                                                                                  |
| --- | ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A6  | **Medium** | Different background style than login | Uses `bg-gradient-to-br from-blue-50 to-indigo-100` (light theme) while login uses `bg-[#0a0e1a]` (dark theme). Navigating between login and register feels like switching applications.                                 |
| A7  | **Low**    | No password strength indicator        | Registration requires complex passwords (uppercase, lowercase, number, special char) but provides no visual feedback on password strength as the user types. Requirements are only shown as small text below the fields. |

### File: `app/portal/change-password/page.tsx`

**What works well:**

- Clean design consistent with login page
- Three separate password fields with individual visibility toggles
- Client-side validation (length, match, different from old)
- Info banner explaining why password change is required

**No significant UX issues.** This page is well-designed.

---

## 3. Dashboard

### File: `app/portal/(protected)/dashboard/page.tsx`

**What works well:**

- Personalized welcome: "Welcome, Captain John Doe"
- Certification status alerts with severity tiers (expired > critical > warning)
- Alert cards show individual certification details with expiry countdown
- Roster period display and retirement info card
- Leave bid status card

**UX Issues:**

| #   | Severity   | Issue                                             | Details                                                                                                                                                                                                                                                        |
| --- | ---------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **High**   | No quick action buttons for primary workflows     | The dashboard shows stats but has NO quick action buttons to "Submit Leave Request", "Submit RDO/SDO Request", or "View Certifications". Pilots must navigate via the sidebar for every action.                                                                |
| D2  | **High**   | Certification alerts are verbose and overwhelming | When a pilot has multiple expired + critical + warning certifications, the dashboard becomes a wall of large alert cards. Each alert card lists individual certifications with details. This pushes the stats cards and other content far down the page.       |
| D3  | **Medium** | Only 2 stat cards                                 | Dashboard only shows "Leave Requests" and "RDO/SDO Requests" pending counts in a 2-column grid. Missing: total certifications status, upcoming schedule, leave balance, or days until next check.                                                              |
| D4  | **Medium** | Stat cards are not clickable                      | The Leave Requests and RDO/SDO stat cards show numbers but aren't linked to their respective pages. Pilots can't click through to see details.                                                                                                                 |
| D5  | **Medium** | Emoji use in alert headings                       | Alert titles include emoji: "Warning: Upcoming Certifications", "Critical: Certifications Expiring Soon", "Expired Certifications". This reads unprofessionally for an aviation fleet management system.                                                       |
| D6  | **Low**    | Dashboard padding inconsistency                   | Header uses `px-8 py-6` while main content uses `px-8 py-8`. The `min-h-screen` wrapper has no background, but the loading skeleton has `bg-gradient-to-br from-blue-50 via-white to-indigo-50`, creating a visual mismatch between loaded and loading states. |

---

## 4. Leave Request Creation

### File: `app/portal/(protected)/leave-requests/new/page.tsx`

**What works well:**

- Clean form layout with Card component
- 8 leave types with descriptive labels
- Late request auto-detection (< 21 days)
- Medical certificate upload for sick leave
- Character counter for reason field
- Success state with redirect

**UX Issues:**

| #   | Severity   | Issue                                               | Details                                                                                                                                                                                                                                       |
| --- | ---------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **High**   | Native HTML date inputs on mobile                   | Uses `<Input type="date">` which renders differently across browsers and is notoriously poor on mobile. A dedicated date picker component would provide a more consistent cross-device experience.                                            |
| F2  | **Medium** | No date range validation                            | Start date and end date have no min/max constraints. A pilot can select an end date before the start date or select dates in the past. The Zod schema may catch this server-side, but client-side instant feedback would be better UX.        |
| F3  | **Medium** | Default leave type is "ANNUAL" but not communicated | The form defaults to "ANNUAL" leave type via `defaultValues`, but the Select component shows the value without explaining this is the default. Pilots may accidentally submit Annual Leave when they meant another type.                      |
| F4  | **Medium** | Success state redirect is too fast                  | After showing "Request Submitted!", there's a 1.5s delay before redirect. The success card is brief and the pilot may not have time to read the confirmation text, especially on slower connections where the redirect takes additional time. |
| F5  | **Low**    | Dual navigation paths to same feature               | This dedicated `/leave-requests/new` page exists, but the leave requests LIST page also has an inline dialog/modal to create requests. Two different UX patterns for the same action.                                                         |

---

## 5. Leave Requests List & Management

### File: `app/portal/(protected)/leave-requests/page.tsx`

**What works well:**

- TanStack Query with automatic refetch on window focus
- Status filter buttons with counts
- Leave type color-coded badges
- Edit and cancel actions for pending requests
- Inline leave bid history section
- Dialog-based create and edit forms

**UX Issues:**

| #   | Severity   | Issue                                     | Details                                                                                                                                                                                                                                     |
| --- | ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **High**   | Page combines two distinct features       | Leave Requests and Leave Bids are fundamentally different features (immediate requests vs. annual preference planning). Combining them on one page with a simple scroll separator makes the page very long and conflates two mental models. |
| R2  | **High**   | `confirm()` for cancellation              | Uses native `window.confirm()` for delete confirmation, which is jarring and looks different on every browser/OS. A styled dialog would be more consistent with the rest of the UI.                                                         |
| R3  | **Medium** | Filter buttons wrap awkwardly on mobile   | 6 filter buttons (All, Submitted, In Review, Approved, Denied, Withdrawn) with counts use `flex-wrap` and `gap-2`. On small screens, these will wrap unpredictably and look messy.                                                          |
| R4  | **Medium** | No sort options                           | Requests are displayed in whatever order the API returns them. No ability to sort by date, status, or type. For pilots with many requests, finding a specific one requires scrolling.                                                       |
| R5  | **Medium** | Hardcoded color classes (not theme-aware) | Uses `text-gray-600`, `bg-gray-50`, `text-gray-700` instead of theme tokens (`text-muted-foreground`, `bg-muted`). These won't adapt to dark mode.                                                                                          |
| R6  | **Low**    | Loading state is minimal                  | Loading shows a simple "Loading leave requests..." text in a card. The custom `RequestsSkeleton` component from `loading-skeletons.tsx` is never used here.                                                                                 |

---

## 6. RDO/SDO Requests

### File: `app/portal/(protected)/flight-requests/page.tsx`

**What works well:**

- Same pattern as leave requests (consistent)
- TanStack Query with auto-refetch
- Safe date formatting with fallback
- Edit link to dedicated edit page
- Delete spinner animation on the trash icon

**UX Issues:**

| #   | Severity   | Issue                                              | Details                                                                                                                                                                                                               |
| --- | ---------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RD1 | **Medium** | Different status terminology                       | Leave requests use "SUBMITTED / IN_REVIEW / APPROVED / DENIED / WITHDRAWN". Flight requests use "SUBMITTED / UNDER_REVIEW / APPROVED / DENIED". The inconsistency ("IN_REVIEW" vs "UNDER_REVIEW") may confuse pilots. |
| RD2 | **Medium** | Edit navigates to new page while leave uses dialog | Leave request editing opens a dialog. RDO/SDO editing navigates to `/portal/flight-requests/[id]/edit`. Two different patterns for the same kind of action.                                                           |
| RD3 | **Low**    | Same hardcoded color issues as leave requests      | `text-gray-600`, `bg-gray-50` etc. not theme-aware.                                                                                                                                                                   |

---

## 7. Unified "My Requests" Page

### File: `app/portal/(protected)/requests/page.tsx`

**What works well:**

- Clean tab navigation between Leave and RDO/SDO
- Parallel data fetching for both request types

**UX Issues:**

| #   | Severity     | Issue                                        | Details                                                                                                                                                                                                                                                                             |
| --- | ------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MR1 | **Critical** | Not accessible from sidebar navigation       | This page exists but has NO sidebar link. Pilots cannot discover or navigate to it.                                                                                                                                                                                                 |
| MR2 | **High**     | Silent error swallowing                      | Both fetch calls in `useEffect` have `catch` blocks that silently discard errors. If the API fails, the pilot sees an empty list with no error message or retry option.                                                                                                             |
| MR3 | **Medium**   | Uses raw useEffect instead of TanStack Query | The leave-requests and flight-requests pages use TanStack Query, but this unified page uses raw `useEffect` + `useState`. No auto-refetch on window focus, no caching, no loading error states.                                                                                     |
| MR4 | **Medium**   | Redundant with dedicated pages               | This page fetches the same data as the dedicated leave-requests and flight-requests pages but uses different components (`LeaveRequestsList` from `components/pilot/` vs the inline rendering in the dedicated pages). This creates maintenance burden and potential inconsistency. |

---

## 8. Profile Page

### File: `app/portal/(protected)/profile/page.tsx`

**What works well:**

- Server Component for fast initial render
- Clean 2-column card grid layout
- Comprehensive information display (personal, employment, contact, passport, professional)
- Captain-specific qualifications section
- "Contact Fleet Management" CTA for update requests
- Multiple fallback paths for data (pilot_id -> employee_id -> pilot_users only)

**UX Issues:**

| #   | Severity   | Issue                                                 | Details                                                                                                                                                                                                        |
| --- | ---------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Medium** | Phone number uses Calendar icon                       | Line 472: `<InfoRow icon={Calendar} label="Phone Number" .../>` — the phone number row incorrectly uses the `Calendar` icon instead of `Phone`.                                                                |
| P2  | **Medium** | Read-only profile with no self-service editing        | Pilots cannot update ANY of their information. The only option is to navigate to the Feedback page to contact fleet management. Even basic fields like phone number or address could be self-service editable. |
| P3  | **Medium** | Info notice card uses light-mode-only colors          | The "Update Required?" card uses `border-blue-200 bg-blue-50` which are hardcoded light-mode colors. Will look wrong in dark mode.                                                                             |
| P4  | **Low**    | Inconsistent "bg-primary/50/10" class                 | Line 547: `bg-primary/50/10` is not valid Tailwind. This likely renders as just `bg-primary` or is ignored. Should be `bg-primary/10`.                                                                         |
| P5  | **Low**    | Passport section shows nothing when both fields empty | If a pilot has no licence_number AND no passport_number, the card shows italic text "No passport or licence information available" — but the card is still rendered, taking up space with minimal value.       |

---

## 9. Certifications Page

### File: `app/portal/(protected)/certifications/page.tsx`

**What works well:**

- Excellent status filter system (clickable stat cards + filter buttons)
- Search across code, description, and category
- Card/list view toggle
- Circular progress indicators in list view
- Linear progress bars in card view
- Grouped by category with sorted display
- Good accessibility: `role="button"`, `aria-label`, `aria-pressed` on stat cards
- Clear empty states with filter-aware messaging

**UX Issues:**

| #   | Severity   | Issue                                     | Details                                                                                                                                                                                                                                                                                                               |
| --- | ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Medium** | Duplicate filter UI                       | Status can be filtered via BOTH the clickable stat cards at the top AND the filter buttons in the search bar. Two competing filter mechanisms for the same data. If a pilot clicks a stat card, the filter buttons below don't visually sync (the stat card doesn't show "pressed" state when filter button is used). |
| C2  | **Medium** | Background doesn't match portal theme     | Uses `bg-gradient-to-br from-blue-50 via-white to-indigo-50` (light gradient) while the rest of the portal uses the `bg-background` theme token. This page looks noticeably different from dashboard/leave-requests pages.                                                                                            |
| C3  | **Medium** | Own sticky header conflicts with layout   | The page has its own `sticky top-0 z-10` header. Since the mobile top bar from the layout is `fixed top-0`, these headers will overlap on mobile, with the certifications header appearing beneath the mobile nav bar.                                                                                                |
| C4  | **Low**    | List view is information-dense for mobile | The list view shows status icon + name + badge + expiry info + circular progress chart all in one horizontal row. On mobile, this will either wrap poorly or overflow.                                                                                                                                                |

---

## 10. Feedback System

### File: `app/portal/(protected)/feedback/page.tsx`

**What works well:**

- Category dropdown with relevant aviation-specific options
- Character counters on subject (200) and message (2000)
- Clear form button
- Success message with scroll-to-top
- Guidelines card below the form

**UX Issues:**

| #   | Severity   | Issue                                         | Details                                                                                                                     |
| --- | ---------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| FB1 | **Medium** | Uses native `<select>` and `<textarea>`       | Uses raw HTML elements instead of the Shadcn `Select` and `Textarea` components used everywhere else. Visual inconsistency. |
| FB2 | **Medium** | Same background mismatch                      | Uses `bg-gradient-to-br from-blue-50 via-white to-indigo-50` — inconsistent with other portal pages.                        |
| FB3 | **Medium** | Success message uses green-300/green-400 text | Light green text on light green background may have insufficient contrast for accessibility.                                |
| FB4 | **Low**    | No confirmation before clearing form          | "Clear Form" button immediately resets all fields with no confirmation. A pilot who accidentally clicks it loses all input. |

---

## 11. Notifications

### File: `app/portal/(protected)/notifications/page.tsx`

**What works well:**

- Mark individual and mark-all-as-read
- Delete individual notifications
- Unread indicator with blue left border
- Read notifications shown at reduced opacity
- Notification type badges with color coding

### File: `components/portal/notification-bell.tsx`

**What works well:**

- 30-second polling for new notifications
- Badge count with 9+ cap
- Popover dropdown with recent items
- Good screen reader text

**UX Issues:**

| #   | Severity   | Issue                                                 | Details                                                                                                                                                                                                      |
| --- | ---------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NT1 | **Medium** | Polling at 30s intervals regardless of tab visibility | The notification bell polls every 30 seconds even when the browser tab is in the background. This wastes API calls and battery on mobile. Should use `document.visibilityState` to pause polling.            |
| NT2 | **Medium** | No real-time updates                                  | Relies on 30-second polling. If a leave request gets approved while the pilot is on the portal, they won't see it for up to 30 seconds. WebSocket or Server-Sent Events would provide instant notifications. |
| NT3 | **Low**    | Notification actions not confirmation-protected       | Delete button immediately deletes with no undo option. Bulk "Mark All as Read" also has no confirmation or undo.                                                                                             |

---

## 12. Error Handling

### File: `app/portal/error.tsx`

**What works well:**

- Clean error card with icon
- "Try Again" and "Go to Dashboard" actions
- Dev-only error digest display
- Help text with support email

**UX Issues:**

| #   | Severity   | Issue                                         | Details                                                                                                                                                     |
| --- | ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | **Medium** | Support email is placeholder                  | Uses `support@example.com` — this is clearly a placeholder that was never updated. Pilots will see an unusable support link.                                |
| E2  | **Medium** | Background gradient doesn't match portal      | Uses CSS variables for background gradient that may not match the dark portal theme.                                                                        |
| E3  | **Low**    | `error.message` might expose internal details | The error message is displayed directly to the user. Stack traces or database errors could leak through. Should sanitize to generic messages in production. |

---

## 13. Mobile-Specific Issues

| #   | Severity   | Issue                                          | Details                                                                                                                                                                                   |
| --- | ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | **High**   | Leave requests header is not mobile-responsive | The header row on `/portal/leave-requests` has title on left and TWO action buttons (New Leave Request + Submit Leave Bid) on the right. On mobile, these will overflow or stack poorly.  |
| M2  | **High**   | Request cards don't optimize for touch         | Edit (pencil) and Delete (trash) buttons are `size="icon"` (40x40px). While meeting minimum touch target, they're placed close together with no margin, creating misclick risk on mobile. |
| M3  | **Medium** | Dashboard uses `px-8` on all screen sizes      | 32px horizontal padding is excessive on mobile screens (320-375px wide), wasting valuable screen real estate. Should be `px-4 md:px-8`.                                                   |
| M4  | **Medium** | Certification list view unusable on mobile     | The horizontal layout of status icon + name + badge + expiry + circular chart doesn't wrap gracefully on narrow screens.                                                                  |
| M5  | **Medium** | Profile 2-column grid on small tablets         | The `lg:grid-cols-2` breakpoint works well for desktop/mobile but at medium tablet sizes (768-1023px), the single-column layout may feel like it wastes space.                            |
| M6  | **Low**    | No pull-to-refresh pattern                     | Mobile users instinctively pull down to refresh. The portal relies on TanStack Query's window focus refetch, which doesn't work when simply returning to an already-visible tab.          |

---

## 14. Design Consistency Issues

| #   | Severity   | Issue                                  | Details                                                                                                                                                                                                                                             |
| --- | ---------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS1 | **High**   | Three different page background styles | Dashboard: `bg-background` (theme token). Certifications/Feedback: `bg-gradient-to-br from-blue-50 via-white to-indigo-50` (light gradient). Auth pages: `bg-[#0a0e1a]` (dark navy). Pages within the same portal look like different applications. |
| DS2 | **High**   | Hardcoded colors vs. theme tokens      | Many pages use `text-gray-600`, `bg-gray-50`, `text-gray-700` instead of `text-muted-foreground`, `bg-muted`, etc. This breaks dark mode support and theme consistency.                                                                             |
| DS3 | **Medium** | Inconsistent page header patterns      | Dashboard: border-bottom header strip. Certifications: sticky header with gradient icon. Feedback: sticky header. Leave requests: simple h1 + subtitle. No consistent page header pattern.                                                          |
| DS4 | **Medium** | Mixed container strategies             | Some pages use `container mx-auto p-6`, others use `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`, others use `px-8 py-8` directly. Content width varies between pages.                                                                                   |
| DS5 | **Low**    | Inconsistent heading sizes             | Dashboard: `text-xl lg:text-2xl`. Leave requests: `text-3xl`. Certifications: `text-xl`. Profile: `text-3xl`. No consistent h1 sizing.                                                                                                              |

---

## Prioritized Recommendations

### P0 - Critical (Fix immediately)

1. **Resolve the redundant requests pages** — Either remove `/portal/requests` or make it the primary page and add it to sidebar navigation. Remove the separate leave-requests and flight-requests pages, OR remove the unified page. Don't keep both.
2. **Fix `support@example.com` placeholder** in error page
3. **Unify auth page visual design** — Login, register, forgot-password should share the same design language

### P1 - High Priority (Fix this sprint)

4. **Add quick action buttons to dashboard** — "Submit Leave Request" and "Submit RDO/SDO" CTAs
5. **Make stat cards clickable/linkable** on dashboard
6. **Add responsive classes to mobile-problematic layouts** — Especially leave requests header and certification list view
7. **Replace `window.confirm()` with styled Dialog** for destructive actions
8. **Standardize page backgrounds** to use theme tokens (`bg-background`)
9. **Collapse certification alerts** on dashboard — Show summary count with expandable details instead of full cards
10. **Fix silent error handling** in My Requests page

### P2 - Medium Priority (Fix next sprint)

11. **Standardize page header pattern** across all portal pages
12. **Replace hardcoded gray colors** with theme tokens throughout
13. **Consolidate filter UI** on certifications page (choose one mechanism)
14. **Add date validation** to leave request form (end >= start, no past dates)
15. **Fix phone number Calendar icon** on profile page
16. **Add login links** to registration and forgot-password from login page
17. **Pause notification polling** when tab is hidden
18. **Combine Feedback and Feedback History** into one page with tabs
19. **Use consistent form components** (Shadcn Select/Textarea) on feedback page
20. **Standardize status terminology** — "IN_REVIEW" vs "UNDER_REVIEW" should be unified

### P3 - Nice to Have (Backlog)

21. Pass `pilotRank` to sidebar for proper rank display
22. Add password strength indicator to registration
23. Add sort options to request lists
24. Add pull-to-refresh pattern for mobile
25. Consider self-service profile editing for basic fields
26. Add "Remember me" to login
27. Use proper date picker component instead of native `input[type=date]`
28. Add undo capability for notification deletion
29. Remove emoji from dashboard alert headings

---

## Files Reviewed

| File                                                 | Lines | Assessment                                    |
| ---------------------------------------------------- | ----- | --------------------------------------------- |
| `app/portal/(protected)/layout.tsx`                  | 74    | Good                                          |
| `app/portal/(public)/layout.tsx`                     | 25    | Good                                          |
| `app/portal/(public)/login/page.tsx`                 | 155   | Good (minor issues)                           |
| `app/portal/(public)/register/page.tsx`              | 343   | Good (visual inconsistency)                   |
| `app/portal/(public)/forgot-password/page.tsx`       | 268   | Fair (heavy animations, visual inconsistency) |
| `app/portal/change-password/page.tsx`                | 230   | Excellent                                     |
| `app/portal/error.tsx`                               | 92    | Fair (placeholder email)                      |
| `app/portal/(protected)/dashboard/page.tsx`          | 338   | Fair (missing quick actions, verbose alerts)  |
| `app/portal/(protected)/dashboard/loading.tsx`       | 77    | Good                                          |
| `app/portal/(protected)/leave-requests/page.tsx`     | 648   | Fair (dual-feature page, confirm())           |
| `app/portal/(protected)/leave-requests/new/page.tsx` | 387   | Good (minor date issues)                      |
| `app/portal/(protected)/flight-requests/page.tsx`    | 390   | Good (consistent with leave)                  |
| `app/portal/(protected)/requests/page.tsx`           | 136   | Poor (unreachable, silent errors)             |
| `app/portal/(protected)/profile/page.tsx`            | 631   | Good (wrong icon, read-only)                  |
| `app/portal/(protected)/certifications/page.tsx`     | 684   | Good (duplicate filter UI)                    |
| `app/portal/(protected)/notifications/page.tsx`      | 266   | Good (minor issues)                           |
| `app/portal/(protected)/feedback/page.tsx`           | 238   | Fair (inconsistent components)                |
| `components/layout/pilot-portal-sidebar.tsx`         | 329   | Good                                          |
| `components/portal/notification-bell.tsx`            | 174   | Good (polling concern)                        |
| `components/portal/loading-skeletons.tsx`            | 254   | Good (well-designed but underused)            |
