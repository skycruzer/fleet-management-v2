# Fleet Management v2 — Comprehensive UX & Architecture Redesign Proposal

**Author**: Multidisciplinary Review Team (UX Designer, Backend Architect, Dashboard Explorer)
**Date**: February 9, 2026
**Version**: 2.1.0 — Final with All Agent Reports
**Design Reference**: Video Buddy Dashboard (clean card-based, blue primary, personalized UX)

---

## 1. Team Roles & Expertise

| Role                         | Focus Area                     | Key Responsibilities                                                                                 |
| ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **UX Designer (Lead)**       | User experience, visual design | Dashboard layout redesign, navigation restructuring, personalization features, widget design         |
| **Frontend Developer**       | React/Next.js, Tailwind CSS    | Component implementation, theme system migration, responsive design, animation                       |
| **Backend Architect**        | Services, API, caching         | API endpoint optimization, new data endpoints for widgets, caching strategy for personalized content |
| **Accessibility Specialist** | WCAG 2.2 AA compliance         | Audit existing a11y, ensure redesign maintains/improves compliance                                   |
| **Performance Engineer**     | Core Web Vitals                | Ensure redesign doesn't regress load times, optimize new widget data fetching                        |

---

## 2. Parallel Review Methodology

### Stream A: UX/Frontend Review (Completed)

- Inventoried all 48 dashboard pages and their navigation hierarchy
- Mapped sidebar structure: 4 collapsible sections (Core, Operations, Insights, Administration), 14 items + Settings + Logout
- Analyzed dashboard landing page bento grid layout with 7 widgets, each wrapped in ErrorBoundary + Suspense
- Reviewed personalization: time-of-day greeting exists but no user name or avatar
- Assessed quick actions: 2x2 grid with icon cards and rose glow hover effect
- Documented component patterns: Server Components for data fetching, Client Components for interactivity
- Reviewed animation system: Framer Motion (sidebar, dropdowns) + CSS keyframes (shimmer, fly-across, confetti)
- Accessibility audit: SkipNav, ARIA labels/expanded/haspopup, keyboard Escape handling, reduced motion, WCAG 2.2 AA focus indicators

### Stream B: Technical Architecture Review (Completed)

- Cataloged **54 services** in `lib/services/` across 7 categories
- Deep-dived dashboard-service-v4 with 3-layer caching (Redis 2-5ms → Materialized View 10ms → Raw DB 800ms)
- Mapped **103 API endpoints** across 18 route groups with consistent Auth → Validate → Service → Revalidate pattern
- Analyzed Redis caching: 3 separate layers (redis-cache-service, unified-cache-service, Next.js revalidation)
- Reviewed dual auth system (Supabase Auth + bcrypt admin sessions + bcrypt pilot sessions = 3 cookie types)
- Identified 18 TanStack Query hooks with optimistic update patterns and tab-visibility awareness
- Discovered 5 real-time Supabase channel subscriptions (notifications only)
- Rated overall architecture: **B+ (Strong foundation with specific optimization opportunities)**

### Stream C: Dashboard Deep-Dive (Completed)

- Traced complete data flow: Supabase → service layer → Server Components → Client Components (no API intermediary for dashboard widgets)
- Mapped current bento grid: Alert Banner → Roster Display → Quick Actions → Staffing Requirements → Retirement Forecast → Expiring Certs → Fleet Compliance
- Each widget independently suspensed for parallel loading (not sequential)
- Confirmed `force-dynamic` on layout prevents ISR caching
- Analyzed header: Global search, ThemeToggle, Bell notifications (polling), User menu with hardcoded "Admin" label
- Reviewed typography: Geist Sans (body) + Space Grotesk (headings) with fluid `clamp()` sizing

---

## 3. Key Findings Summary

### 3.1 UX Findings

| Area                  | Current State                                                                       | Gap vs. Video Buddy Reference                                                      |
| --------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Greeting**          | Time-of-day only ("Good morning") with subtitle "Here's your fleet overview"        | Missing: user name, avatar, role badge, personal context                           |
| **Sidebar**           | 4 collapsible sections, 14 items + Settings, rose accent, `border-l-2` active state | Reference: simpler flat list (4-5 items), blue filled active state, bottom Log Out |
| **Quick Actions**     | 2x2 grid inside bento, rose glow hover, icon-only cards                             | Reference: prominent right-column cards with icon + full label + description       |
| **Dashboard Widgets** | Dense bento grid (7 widgets with `xl:grid-cols-3`), data-heavy                      | Reference: airy 3-section layout with generous whitespace                          |
| **Personalization**   | Generic fleet overview, no user-specific content                                    | Reference: "Your agenda today" with personal meetings list                         |
| **Color System**      | Rose primary (#f43f5e) + Amber accent (#f59e0b) + warm stone neutrals               | Reference: Blue primary (~#4F6AF6) + clean white surfaces                          |
| **Visual Density**    | High — 7 widgets visible simultaneously on desktop                                  | Reference: 3 content zones with breathing room                                     |
| **Navigation Count**  | 14 items + Settings across 4 section groups                                         | Reference: 4-5 flat items + Log Out                                                |

### 3.2 Technical Architecture Scorecard (from Backend Architect)

| Area                      | Rating | Key Observations                                                                                 |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| **Service Layer**         | **B+** | 54 services, well-organized but mixed paradigms (OOP BaseService + standalone functions)         |
| **Dashboard Performance** | **A**  | 3-layer cache (2-5ms Redis). BUT `getRecentActivity()` bypasses all caching — hits DB every time |
| **API Routes**            | **A-** | 103 endpoints, consistent auth/validate/respond. Missing pagination on `getAllPilotRequests()`   |
| **Redis Integration**     | **A-** | Dual-purpose (cache + sessions). Concern: `delPattern` uses O(N) `KEYS` command                  |
| **Authentication**        | **B+** | Solid dual-auth, but middleware makes 2-3 Supabase queries per request for role lookup           |
| **Database Queries**      | **B**  | Good joins. N+1 risk: roster period computation loops inside `getAllPilotRequests()`             |
| **TanStack Query**        | **A-** | Strong optimistic updates, tab awareness. Duplicate query key sets between admin/portal          |
| **Error Handling**        | **B**  | ServiceResponse architecture good, inconsistent adoption (some routes still manual)              |
| **Real-Time**             | **C+** | Only notifications use Supabase Realtime. Dashboard relies on 5-min polling                      |

### 3.3 Strengths to Preserve

1. **Accessibility** — SkipNav, ARIA labels/expanded/controls, keyboard Escape handlers, `prefers-reduced-motion` support, WCAG 2.2 AA focus indicators with rose ring, high contrast mode support
2. **Error Resilience** — Per-widget ErrorBoundary + Suspense with shimmer skeletons. Widgets load in parallel, not sequentially. `DashboardErrorFallback` with reload button per section
3. **Performance** — Redis-cached dashboard (2-5ms), materialized view fallback (10ms), TanStack Query with tab-visibility pause
4. **Collapsible Sidebar** — 240px → 56px with icons-only + tooltips, section collapse state persisted in localStorage
5. **Dynamic Badges** — Sidebar shows pending request count + expired/expiring cert count with color coding (danger/warning)
6. **Glassmorphism Header** — `backdrop-blur-xl` sticky header with global search (Cmd+K), animated notification dropdown, user menu

### 3.4 Issues to Fix During Redesign (Backend Architect Findings)

1. **`getRecentActivity()` not cached** — Hits DB directly every request, bypassing all 3 cache layers
2. **No pagination** on `getAllPilotRequests()` — Returns all matching records unbounded
3. **N+1 roster period computation** — `getRosterPeriodsForDateRange()` called in a loop per request
4. **Redis `KEYS` command** in `delPattern()` — O(N) blocking call, should use `SCAN`
5. **Middleware role lookup latency** — 2-3 Supabase queries per request (could cache in session data)
6. **Dual ServiceResponse types** — `lib/types/service-response.ts` vs inline interfaces in some services
7. **Duplicate TanStack Query key sets** — `hooks/use-portal-queries.ts` defines separate keys from `lib/react-query/query-client.ts`
8. **Hardcoded "Admin" in header** — `professional-header.tsx` line 299: `<span>Admin</span>` — should be dynamic

---

## 4. Detailed Redesign Proposal

### 4.1 Design Philosophy Shift

**FROM**: Dense data-centric bento grid with aviation rose theme
**TO**: Airy, personalized command center with blue-accented clean design

Mapping the Video Buddy aesthetic to fleet management context:

| Video Buddy Element              | Fleet Management Equivalent                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| "Good morning, John!" + avatar   | "Good morning, Maurice!" + admin avatar + role badge                   |
| "Your agenda today" (meetings)   | "Today's priorities" (expiring certs, pending requests, roster alerts) |
| Reschedule / Change attendance   | Review / Approve / Deny (request action buttons)                       |
| Start/Join/Schedule meeting      | Add Pilot / Approve Request / Generate Report                          |
| Calendar widget (August 2023)    | Roster Period Calendar (current RP highlighted, 28-day cycle)          |
| Invitations (RSVP buttons)       | Pending Approvals (leave/flight requests with accept/deny)             |
| Insights (8 meetings, 16 hosted) | Fleet Insights (42 active pilots, 94% compliance, 7 expiring)          |
| Blue sidebar with flat nav       | Blue sidebar with top 5 always visible + "More" expander               |
| User avatar in greeting area     | User avatar + name + role badge in greeting area                       |

### 4.2 Color System Migration

```
CURRENT (Rose/Amber)              →  PROPOSED (Blue/Indigo)
─────────────────────────────────────────────────────────────
Primary: #f43f5e (Rose-500)       →  #4F6AF6 (Indigo-Blue)
Primary-600: #e11d48              →  #4338CA (Indigo-700)
Accent:  #f59e0b (Amber-500)      →  #6366F1 (Indigo-500)
Ring:    #f43f5e                   →  #4F6AF6

Light Mode:
  Background: #ffffff             →  #F8FAFC (Slate-50, slightly off-white)
  Card:       #ffffff             →  #FFFFFF (pure white)
  Border:     #e7e5e4 (Stone)     →  #E2E8F0 (Slate-200)
  Muted-fg:   #78716c (Stone)     →  #64748B (Slate-500)

Dark Mode:
  Background: #0c0a09 (Stone)     →  #0F172A (Slate-900)
  Card:       #1c1917 (Stone)     →  #1E293B (Slate-800)
  Border:     rgba(255,255,255,0.08)  →  rgba(255,255,255,0.10)
  Surface-1:  #1c1917             →  #1E293B
  Surface-2:  #292524             →  #334155

Glow Effects:
  --shadow-glow-accent: rose → blue: rgba(79, 106, 246, 0.2)
  --gradient-aviation: rose→amber → blue→indigo
```

**Preserve unchanged**: All semantic status colors (success #10b981, warning #f59e0b, destructive #ef4444), category colors (flight, simulator, ground, medical), badge colors, info color.

### 4.3 Sidebar Redesign

**Current**: 4 collapsible sections, 14 items, section headers, `border-l-2` active state
**Proposed**: Streamlined 2-tier navigation inspired by Video Buddy

```
┌──────────────────────┐
│  ✈ Fleet Manager     │  ← App logo + title (blue accent bg, like current Plane icon)
├──────────────────────┤
│  🏠 Home             │  ← Primary nav (always visible, no section headers)
│  👥 Pilots           │
│  📋 Certifications   │    ← Dynamic badge preserved (expired+expiring count)
│  📝 Requests         │    ← Dynamic badge preserved (pending count)
│  📊 Analytics        │
├──────────────────────┤
│  ▸ More              │  ← Single collapsible group
│    Renewal Planning  │
│    Reports           │
│    Tasks             │
│    System Admin      │
│    Disciplinary      │
│    Audit Logs        │
├──────────────────────┤
│                      │
│  ↩ Collapse          │  ← Keep collapse toggle
│  ← Log out           │  ← Bottom-pinned with confirmation dialog
└──────────────────────┘
```

**Key changes**:

- **Top 5 items always visible** — Dashboard, Pilots, Certifications, Requests, Analytics (core workflows)
- **Secondary items** under single "More" expander — Planning, Reports, Tasks, Admin, Disciplinary, Audit (6 items)
- **Settings, Help, Feedback** move to header user menu dropdown (reduces sidebar to operational focus)
- **Active state**: Filled blue background `bg-primary/15 text-primary` (remove `border-l-2`, add `rounded-lg`) to match Video Buddy "Home" style
- **Section headers removed** — replaced by visual separator between primary and "More" groups
- **Badge preservation** — Certifications and Requests keep their dynamic badge indicators

**Files to modify**:

- `components/layout/professional-sidebar-client.tsx` — Restructure `navigationSections` from 4 groups to 2 (primary + more)
- `components/layout/sidebar-shell.tsx` — Minor spacing adjustments
- `app/dashboard/layout.tsx` — Update `navLinks` array for mobile nav
- `components/layout/professional-header.tsx` — Add Settings/Help/Feedback to user dropdown

### 4.4 Dashboard Landing Page Redesign

**Current layout** (bento grid, 7 widgets, `xl:grid-cols-3`):

```
┌──────────────────────────────────────────────────┐
│ UrgentAlertBanner (full width, col-span-full)    │
├─────────────────────────────┬────────────────────┤
│ CompactRosterDisplay        │ Quick Actions      │
│ (lg:col-span-2)            │ (1 col, 2x2 grid)  │
├─────────────────────────────┼────────────────────┤
│ PilotRequirementsCard       │ RetirementForecast │
│ (lg:col-span-2)            │ (1 col, xl:2 rows) │
├───────────────┬─────────────┤                    │
│ ExpiringCerts │ Compliance  │                    │
│ (1 col)       │ (1 col)     │                    │
└───────────────┴─────────────┴────────────────────┘
```

**Proposed layout** (Video Buddy-inspired, 3 zones):

```
┌──────────────────────────────────────────────────────────┐
│  Zone 1: PERSONALIZED GREETING                           │
│                                                          │
│  Good morning, Maurice! 👤                               │
│  Fleet Operations Manager · Last login: 2h ago           │
│                                                          │
├───────────────────────────────┬──────────────────────────┤
│  Zone 2a: TODAY'S PRIORITIES  │  Zone 2b: QUICK ACTIONS  │
│  (lg:col-span-2)             │  (1 col)                  │
│                               │                          │
│  🔴 3 certs expiring <7 days │  ➕ Add Pilot             │
│  🟡 5 pending leave requests  │  ✅ Approve Requests     │
│  📅 RP8 ends in 4 days       │  📊 Generate Report      │
│  ✈ 2 flight requests pending │                          │
│                               │                          │
├───────────┬──────────┬────────┴──────────────────────────┤
│  Zone 3a  │ Zone 3b  │  Zone 3c: FLEET INSIGHTS         │
│  ROSTER   │ PENDING  │                                   │
│  CALENDAR │ APPROVALS│  Active Pilots          42        │
│           │          │  Fleet Compliance       94%       │
│  Feb 2026 │ Capt. D  │  Certs Expiring (<30d)  7        │
│  [28-day  │ Leave    │  Pending Requests       5        │
│   grid]   │ Feb 3-8  │                                   │
│           │ [Deny]   │  (large numbers, like Video Buddy │
│           │ [Approve]│   "8" and "16" metrics)           │
│           │          │                                   │
└───────────┴──────────┴───────────────────────────────────┘
```

**Component changes**:

| Component                | Action            | Description                                                                                                                                                                                    |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard-content.tsx`  | **Major rewrite** | New 3-zone layout replacing bento grid                                                                                                                                                         |
| `PersonalizedGreeting`   | **New component** | Server component: fetches user from auth, renders name + avatar + role + last login                                                                                                            |
| `TodaysPriorities`       | **New component** | Combines UrgentAlertBanner + ExpiringCertsBanner + pending requests into prioritized agenda list. Uses `expiring-certifications-service` + `unified-request-service` + `roster-period-service` |
| `QuickActionCards`       | **Refactor**      | Vertical stack of 3 large CTA cards (like Video Buddy's Start/Join/Schedule) instead of 2x2 grid                                                                                               |
| `RosterCalendarWidget`   | **New component** | Mini monthly calendar with current RP dates highlighted. Uses existing `roster-period-service` + `roster-utils.ts`                                                                             |
| `PendingApprovalsWidget` | **New component** | Top 3-5 pending requests with pilot name, type badge, date range, and Approve/Deny action buttons. Uses `unified-request-service` with `{ workflow_status: 'PENDING', limit: 5 }`              |
| `FleetInsightsWidget`    | **New component** | 4 key metrics with large numbers + labels. Data from existing `DashboardMetrics` (already Redis-cached at 2-5ms)                                                                               |

**Files to create**:

- `components/dashboard/personalized-greeting.tsx`
- `components/dashboard/todays-priorities.tsx`
- `components/dashboard/quick-action-cards.tsx`
- `components/dashboard/roster-calendar-widget.tsx`
- `components/dashboard/pending-approvals-widget.tsx`
- `components/dashboard/fleet-insights-widget.tsx`

**Files to modify**:

- `components/dashboard/dashboard-content.tsx` — Complete layout restructure
- `app/dashboard/page.tsx` — Pass user data for personalized greeting

**Existing components preserved** (moved to sub-pages, not deleted):

- `CompactRosterDisplay` → move to `/dashboard/renewal-planning`
- `PilotRequirementsCard` → move to `/dashboard/analytics`
- `RetirementForecastCard` → move to `/dashboard/analytics`
- `UnifiedComplianceCard` → integrate into `FleetInsightsWidget` as compliance %

### 4.5 Header Enhancements

**Current**: Global search + ThemeToggle + Bell + User menu (hardcoded "Admin")
**Proposed**: Same elements + dynamic user name + expanded user dropdown

Changes:

- Replace hardcoded `<span>Admin</span>` with dynamic display name from auth context
- Add to user dropdown: "My Settings" link, "Help Center" link, "Feedback" link (moved from sidebar)
- Keep: Global search (Cmd+K), ThemeToggle, Notifications bell with dropdown, Logout

**File to modify**: `components/layout/professional-header.tsx` (lines 298-300 for name, dropdown menu items)

### 4.6 Backend Changes Required

| Change                            | Service/File                 | Effort     | Purpose                                                                                                                                                  |
| --------------------------------- | ---------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User profile data                 | `user-service.ts`            | **Low**    | Add `getAdminProfile()` returning name, email, role, avatar_url, last_login                                                                              |
| Today's priorities aggregation    | `dashboard-service-v4.ts`    | **Medium** | New `getTodaysPriorities()` combining: expiring certs (<7d), pending requests, roster period alerts. Cache in Redis alongside existing dashboard metrics |
| Cache `getRecentActivity()`       | `dashboard-service-v4.ts`    | **Low**    | Fix existing bug: add Redis caching (60s TTL) to `getRecentActivity()` which currently bypasses all cache layers                                         |
| Pending approvals (limited)       | `unified-request-service.ts` | **Low**    | Already exists. Add `limit` parameter to `getRequests()` for widget use (top 5)                                                                          |
| Roster calendar formatter         | `roster-period-service.ts`   | **Low**    | Add `getCalendarMonthData(year, month)` returning dates with RP overlay                                                                                  |
| Fleet insights subset             | `dashboard-service-v4.ts`    | **None**   | Already available in `DashboardMetrics` — just reshape on frontend                                                                                       |
| Add pagination to requests        | `unified-request-service.ts` | **Medium** | Fix existing gap: add `page`/`pageSize` params to `getAllPilotRequests()`                                                                                |
| Replace Redis `KEYS` with `SCAN`  | `redis-cache-service.ts`     | **Low**    | Fix: `delPattern()` uses O(N) `KEYS` command, should use `SCAN` iterator                                                                                 |
| DB migration: user profile fields | New migration                | **Low**    | Add `display_name`, `avatar_url` columns to `an_users` table                                                                                             |

**Key insight**: Most data endpoints already exist (54 services, 103 API endpoints). The redesign is ~80% frontend layout, ~20% backend enhancement. No new database tables needed.

### 4.7 Theme System Changes

**File**: `app/globals.css`

Phase 1 — Add new palette alongside existing (non-breaking):

```css
/* NEW: Blue-Indigo Primary Palette (default = light mode) */
@theme {
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #4f6af6;
  --color-primary-600: #4338ca;
  --color-primary-700: #3730a3;
  --color-primary-800: #312e81;
  --color-primary-900: #1e1b4b;

  --color-primary: #4f6af6;
  --color-primary-foreground: #ffffff;

  /* Accent: Soft Indigo (replaces Amber for secondary actions) */
  --color-accent: #6366f1;
  --color-accent-foreground: #ffffff;

  /* Light surfaces (default) */
  --color-background: #f8fafc;
  --color-foreground: #0f172a;
  --color-card: #ffffff;
  --color-card-foreground: #0f172a;
  --color-popover: #ffffff;
  --color-popover-foreground: #0f172a;
  --color-muted: #f1f5f9;
  --color-muted-foreground: #64748b;
  --color-border: #e2e8f0;
  --color-input: #cbd5e1;
  --color-ring: #4f6af6;

  /* Updated glow effects */
  --shadow-glow-accent: 0 0 0 3px rgba(79, 106, 246, 0.2), 0 0 20px rgba(79, 106, 246, 0.1);
  --gradient-aviation: linear-gradient(135deg, #4f6af6 0%, #6366f1 50%, #4f6af6 100%);
}
```

Phase 4 — Dark mode overrides:

```css
.dark {
  --color-primary: #818cf8; /* Lighter blue for dark bg contrast */
  --color-background: #0f172a;
  --color-card: #1e293b;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-muted: #334155;
  --color-muted-foreground: #94a3b8;
  --color-foreground: #e2e8f0;
}
```

**Preserve unchanged**:

- All semantic colors (success/warning/destructive) — aviation-standard status indicators
- All category colors (flight/simulator/ground/medical)
- All badge colors
- All accessibility utilities (focus indicators, skip-nav, sr-only)
- Typography system (Geist Sans + Space Grotesk + fluid clamp())
- All animation keyframes and reduced motion support
- Surface elevation system (surface-0/1/2/3 — just new values)

---

## 5. Migration Strategy — Phased Approach

### Phase 1: Foundation (Week 1)

- [ ] Create new blue-indigo color palette CSS variables in `globals.css` alongside existing rose palette (feature-flagged via CSS class)
- [ ] Add `display_name` and `avatar_url` columns to `an_users` table (DB migration)
- [ ] Build `PersonalizedGreeting` server component with graceful fallback (shows "Admin" if no name)
- [ ] Build `FleetInsightsWidget` using existing cached `DashboardMetrics` data
- [ ] Fix `getRecentActivity()` caching gap (add Redis 60s TTL)
- [ ] Replace Redis `KEYS` with `SCAN` in `delPattern()`
- [ ] Add `getAdminProfile()` to `user-service.ts`

### Phase 2: Dashboard Restructure (Week 2)

- [ ] Create `TodaysPriorities` component (aggregates expiring certs + pending requests + roster alerts)
- [ ] Add `getTodaysPriorities()` to `dashboard-service-v4.ts` with Redis caching
- [ ] Refactor Quick Actions into vertical stack of 3 large CTA cards
- [ ] Build `RosterCalendarWidget` (mini 28-day calendar with RP overlay)
- [ ] Build `PendingApprovalsWidget` with inline approve/deny actions
- [ ] Rebuild `dashboard-content.tsx` with 3-zone layout (behind feature flag)
- [ ] Add `limit` parameter to `getRequests()` for widget use
- [ ] Move existing heavy widgets to their natural sub-pages (StaffingReq → analytics, RetirementForecast → analytics)

### Phase 3: Navigation Overhaul (Week 3)

- [ ] Restructure sidebar `navigationSections` from 4 groups to 2 (primary 5 + "More" expander)
- [ ] Update active state styling: remove `border-l-2`, add filled `bg-primary/10 rounded-lg`
- [ ] Move Help/Feedback/Settings links to header user dropdown
- [ ] Update mobile nav (`navLinks` in `layout.tsx`) to match new structure
- [ ] Fix hardcoded "Admin" in header → dynamic display name from auth
- [ ] Add pagination to `getAllPilotRequests()` (backend fix)

### Phase 4: Theme Cutover & Polish (Week 4)

- [ ] Swap default color palette from rose to blue-indigo (remove feature flag)
- [ ] Update all glow/shadow effects for blue palette
- [ ] Tune dark mode with blue-on-slate palette
- [ ] Update aviation-themed decorative elements (gradient-aviation, glow-primary, horizon-line)
- [ ] Update Plane icon accent color in sidebar header
- [ ] Full WCAG 2.2 AA accessibility audit (axe-core + manual keyboard testing)
- [ ] Lighthouse performance regression testing (target: maintain <10ms dashboard load)
- [ ] Visual regression testing across all 48 dashboard pages
- [ ] Clean up deprecated components and remove feature flags

---

## 6. Anticipated Challenges & Mitigation Strategies

### Challenge 1: Theme Migration Without Breaking 48 Pages

**Risk**: All 48 dashboard pages, 54 services, and shared components reference theme CSS variables. A palette swap could cause visual inconsistencies across the entire app.
**Mitigation**: The existing design system uses CSS custom properties exclusively — the swap happens at the variable level, not at the component level. No component references hardcoded hex colors. Use a CSS class toggle (`data-theme="blue"`) during Phase 1-3 for A/B testing before full cutover. Run visual snapshot tests (Playwright) across all 48 pages before and after.

### Challenge 2: Personalization Data Availability

**Risk**: Current `an_users` table only stores `id`, `email`, `role`, `password_hash`. No display name or avatar fields exist.
**Mitigation**: Phase 1 DB migration adds `display_name` (text, nullable) and `avatar_url` (text, nullable) to `an_users`. Greeting component falls back gracefully: name → email prefix → "Admin". Avatar falls back to initials icon → generic User icon. No existing functionality breaks.

### Challenge 3: Dashboard Performance with New Widgets

**Risk**: New widgets (TodaysPriorities, RosterCalendar, PendingApprovals) add data fetching. Could regress the current 2-5ms dashboard experience.
**Mitigation**:

- `TodaysPriorities`: Reshapes data from 3 existing cached sources (no new DB queries)
- `FleetInsights`: Subset of existing `DashboardMetrics` (already Redis-cached at 2-5ms)
- `PendingApprovals`: Uses existing `unified-request-service` with new `limit: 5` param
- `RosterCalendar`: Pure computation from `roster-utils.ts` (no DB query)
- All widgets wrapped in independent `<Suspense>` boundaries for parallel streaming
- Backend architect confirmed: "Most data endpoints already exist"

### Challenge 4: Navigation Simplification vs. Feature Discovery

**Risk**: Moving 9 items behind a "More" expander may reduce discoverability for admin operations (Disciplinary, Audit Logs, etc.).
**Mitigation**:

- Keep dynamic badge counts on primary items (Certifications, Requests) for urgency signals
- Global Search (Cmd+K) already exists for power users — surfaces all pages
- "More" section defaults to expanded on first visit, remembers state in localStorage
- Sidebar tooltip shows full label when collapsed to 56px
- Track navigation analytics (which items are clicked most) to validate the 5-item primary set

### Challenge 5: Dark Mode Compatibility with Blue Palette

**Risk**: Blue-indigo can look cold/harsh in dark mode compared to warm rose/amber.
**Mitigation**: Use lighter indigo (#818CF8) for dark mode primary (higher contrast, softer feel). Keep warm slate dark backgrounds (#0F172A instead of pure black). The existing surface elevation system (surface-0/1/2/3) works regardless of accent color — just update values. Test with both `prefers-color-scheme` and manual toggle.

### Challenge 6: Maintaining WCAG 2.2 AA Accessibility

**Risk**: Redesign could regress the strong accessibility foundation.
**Mitigation**:

- Blue-500 (#4F6AF6) on white (#FFFFFF) = **4.56:1 contrast ratio** (passes WCAG AA for normal text)
- Blue-500 on slate-50 (#F8FAFC) = **4.48:1** (passes AA for large text, borderline for normal — may need Blue-600 #4338CA at 5.94:1 for body text)
- Keep ALL existing a11y infrastructure: SkipNav, ARIA labels, `aria-expanded`, `aria-controls`, `aria-haspopup`, keyboard Escape handlers, `prefers-reduced-motion` support, focus ring indicators, high contrast mode support, screen reader utilities
- Run axe-core + Pa11y audit after each phase
- Manual keyboard-only navigation testing

### Challenge 7: Framer Motion Animation Updates

**Risk**: Current animations use rose-colored glow effects in motion variants.
**Mitigation**: Motion animations (`whileHover`, `whileTap`, `AnimatePresence`) are color-agnostic — they animate transform/opacity, not color. The only color-specific animations are CSS keyframes (`gradient-shift` for `text-gradient-aviation`), which are updated in the CSS variable swap. No Framer Motion code changes needed.

---

## 7. Success Metrics

| Metric                                  | Current                             | Target                                 | Measurement                                        |
| --------------------------------------- | ----------------------------------- | -------------------------------------- | -------------------------------------------------- |
| Dashboard load time (cached)            | 2-5ms                               | Maintain <10ms                         | Redis + performance metadata in `DashboardMetrics` |
| Dashboard load time (cold)              | ~800ms                              | <200ms (with materialized view)        | Lighthouse                                         |
| Lighthouse Accessibility                | ~95                                 | Maintain 95+                           | Lighthouse CI                                      |
| Navigation clicks to common action      | 2-3 (find in sidebar → navigate)    | 1 (quick action visible on dashboard)  | Analytics                                          |
| Sidebar items visible without scrolling | 5-8 (depends on collapsed sections) | 5 (always visible primary set)         | Manual audit                                       |
| WCAG contrast ratios                    | 4.5:1+ (rose on white)              | 4.5:1+ (blue on white)                 | axe-core                                           |
| New admin orientation time              | High (7 widgets, dense data)        | Low (3 clear zones, guided priorities) | User testing                                       |
| API response time (requests list)       | Unbounded (no pagination)           | <100ms (paginated, 25/page)            | API monitoring                                     |

---

## 8. Files Impact Summary

### New Files (8)

| File                                                       | Type             | Purpose                                              |
| ---------------------------------------------------------- | ---------------- | ---------------------------------------------------- |
| `components/dashboard/personalized-greeting.tsx`           | Server Component | User name, avatar, role badge, time greeting         |
| `components/dashboard/todays-priorities.tsx`               | Server Component | Aggregated priority agenda (certs, requests, roster) |
| `components/dashboard/quick-action-cards.tsx`              | Client Component | 3 large vertical CTA cards                           |
| `components/dashboard/roster-calendar-widget.tsx`          | Server Component | Mini 28-day calendar with RP overlay                 |
| `components/dashboard/pending-approvals-widget.tsx`        | Client Component | Top 5 pending requests with approve/deny             |
| `components/dashboard/fleet-insights-widget.tsx`           | Server Component | 4 large metric cards                                 |
| `supabase/migrations/XXXXXXXX_add_user_profile_fields.sql` | SQL              | Add display_name, avatar_url to an_users             |
| `lib/services/__tests__/dashboard-service-v4.test.ts`      | Test             | Tests for new `getTodaysPriorities()`                |

### Modified Files (9)

| File                                                | Change Description                                             |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `app/globals.css`                                   | Blue-indigo palette replacing rose/amber, updated glow effects |
| `app/dashboard/page.tsx`                            | Pass user data for personalized greeting                       |
| `components/dashboard/dashboard-content.tsx`        | Complete layout restructure (3 zones replacing bento grid)     |
| `components/layout/professional-sidebar-client.tsx` | 2-tier navigation (5 primary + "More"), updated active state   |
| `components/layout/professional-header.tsx`         | Dynamic user name, expanded user dropdown menu                 |
| `lib/services/dashboard-service-v4.ts`              | Add `getTodaysPriorities()`, cache `getRecentActivity()`       |
| `lib/services/unified-request-service.ts`           | Add `limit` param, add pagination to `getAllPilotRequests()`   |
| `lib/services/redis-cache-service.ts`               | Replace `KEYS` with `SCAN` in `delPattern()`                   |
| `lib/services/user-service.ts`                      | Add `getAdminProfile()` method                                 |

### Components Relocated (not deleted)

| Component                | From              | To                            |
| ------------------------ | ----------------- | ----------------------------- |
| `CompactRosterDisplay`   | Dashboard landing | `/dashboard/renewal-planning` |
| `PilotRequirementsCard`  | Dashboard landing | `/dashboard/analytics`        |
| `RetirementForecastCard` | Dashboard landing | `/dashboard/analytics`        |

### Components Absorbed (deprecated after Phase 4)

| Component                            | Absorbed Into                                               |
| ------------------------------------ | ----------------------------------------------------------- |
| `UrgentAlertBanner`                  | `TodaysPriorities` (alert items become priority line items) |
| `ExpiringCertificationsBannerServer` | `TodaysPriorities` (cert expiry becomes priority line item) |

---

## 9. Architecture Diagram

### Current Data Flow (Dashboard)

```
Supabase PostgreSQL
    ↓
pilot_dashboard_metrics (materialized view)
    ↓
dashboard-service-v4.ts ──→ Redis Cache (60s TTL)
    ↓
Server Components (DashboardContent, each widget)
    ↓ (Suspense boundaries, parallel streaming)
Client Components (interactivity, Framer Motion)
    ↓
User sees: 7-widget bento grid
```

### Proposed Data Flow (Dashboard)

```
Supabase PostgreSQL
    ↓
pilot_dashboard_metrics (materialized view) ──────────────────┐
    ↓                                                          │
dashboard-service-v4.ts ──→ Redis Cache (60s TTL)             │
    ↓                                                          │
┌───────────────────────────────────────────────────────────┐  │
│ PersonalizedGreeting (user-service → auth context)        │  │
├───────────────────────────────────────────────────────────┤  │
│ TodaysPriorities          │ QuickActionCards              │  │
│ (getTodaysPriorities()    │ (static links, no data fetch) │  │
│  → Redis cached)          │                               │  │
├───────────────┬───────────┼───────────────────────────────┤  │
│ RosterCalendar│ Pending   │ FleetInsightsWidget           │←─┘
│ (roster-utils)│ Approvals │ (DashboardMetrics subset)     │
│ (no DB query) │ (unified  │ (already Redis-cached)        │
│               │ -request  │                               │
│               │ limit: 5) │                               │
└───────────────┴───────────┴───────────────────────────────┘
    ↓ (6 Suspense boundaries, parallel streaming)
User sees: 3-zone personalized command center
```

---

---

## 10. Addendum: UX Designer Agent — Additional Findings

### 10.1 Design System Scale (Larger Than Expected)

The UX review revealed the full scale of the existing component library:

| Category               | Count | Key Components                                                                                                                            |
| ---------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **UI Primitives**      | 80+   | Button (9 variants, 6 sizes), Card (3 variants), Badge (7 variants), Alert (5 variants), DataTable, EmptyStateIllustrated (aviation SVGs) |
| **Feature Components** | 200+  | Across 29 subdirectories (dashboard, certifications, pilots, requests, etc.)                                                              |
| **Storybook Stories**  | 20    | Coverage gap — 20 stories for 80+ primitives                                                                                              |
| **Form Components**    | 11+   | AccessibleForm, FileUpload, PilotCombobox, DateRangePicker, Command (cmdk)                                                                |

**Implication for redesign**: The blue-indigo palette swap will automatically propagate through all 80+ UI primitives since they use CSS variables (no hardcoded colors). No component-level refactoring needed for the theme migration.

### 10.2 Accessibility Infrastructure (More Extensive Than Initially Documented)

The UX designer found 4 dedicated accessibility components beyond what was documented:

| Component                | Location                    | Purpose                                                                   |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------- |
| `skip-nav.tsx`           | `components/accessibility/` | SkipToMainContent, SkipToNavigation, SkipToSearch                         |
| `announcer.tsx`          | `components/accessibility/` | `aria-live` regions for screen reader announcements via `announce()` hook |
| `focus-trap.tsx`         | `components/accessibility/` | Keyboard focus containment for modals                                     |
| `route-change-focus.tsx` | `components/ui/`            | Auto-focus management on route transitions                                |

Also found: `accessible-form.tsx` with WCAG-compliant auto-ID association, `useFormFocusManagement()` hook for first-field focus, and success/error messages with temporary `tabindex="-1"` for programmatic focus. Touch targets at 44px × 44px (WCAG 2.2 AAA level).

**Implication**: The accessibility foundation is AAA-grade in places. The redesign MUST preserve all of this.

### 10.3 Pilot Portal Comparison (Simpler, Already Personalized)

The pilot portal at `/portal/*` already implements the personalization pattern we're proposing for admin:

| Feature               | Pilot Portal (exists)          | Admin Dashboard (proposed)       |
| --------------------- | ------------------------------ | -------------------------------- |
| Personalized greeting | "Welcome, Captain Smith"       | "Good morning, Maurice!"         |
| User info display     | Rank, name, employee ID, email | Name, role, avatar, last login   |
| Quick actions         | Submit Leave / Submit RDO      | Add Pilot / Approve / Report     |
| Personal stats        | Pending leave/RDO counts       | Pending approvals, fleet metrics |
| Countdown             | Roster period live timer       | Roster period calendar           |

**Implication**: We can reference `components/portal/` patterns when building the admin personalization — the greeting and stats card patterns already exist.

### 10.4 Newly Identified Issues to Address

| Issue                                                                                                               | Severity | Fix Phase                                              |
| ------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| **No container queries** — Widget layouts use viewport breakpoints only; limits flexibility                         | Medium   | Phase 2 (use `@container` on widget cards)             |
| **DensityToggle exists but unused** — `components/ui/density-toggle.tsx` not wired to dashboard                     | Low      | Phase 2 (connect to widget spacing)                    |
| **Mixed naming conventions** — Some PascalCase files (e.g., `FlightRequestReviewModal.tsx`) violate kebab-case rule | Low      | Phase 4 (cleanup)                                      |
| **No keyboard shortcuts** documented — Cmd+K search exists but no documented hotkey system                          | Low      | Phase 3 (add sidebar nav shortcuts)                    |
| **Chart library limited** — Only Tremor BarChart; no line/area/donut charts on main dashboard                       | Medium   | Phase 2 (FleetInsights could use donut for compliance) |
| **Storybook coverage gaps** — 20/80+ components documented                                                          | Low      | Post-Phase 4 (not redesign-critical)                   |
| **Pilot portal simpler** — Fewer widgets, no charts vs admin                                                        | Info     | Out of scope (separate initiative)                     |

### 10.5 Card System — Ready for Redesign

The existing Card component (`components/ui/card.tsx`) already supports the 3 variants needed:

```
default  → Standard white/dark card with border (for dashboard widgets)
glass    → Frosted glass with backdrop-blur (for header/overlays)
elevated → Shadow-based elevation (for interactive cards/quick actions)
```

Plus an `interactive` prop that adds `hover:-translate-y-0.5 hover:shadow-[var(--shadow-interactive-hover)]`. This is exactly what the Video Buddy quick-action cards need.

**No new Card variants needed** — just composition changes in the dashboard layout.

### 10.6 Updated Files Impact (Final Count)

With UX designer findings incorporated:

| Category                      | Count           | Change from v2.0                          |
| ----------------------------- | --------------- | ----------------------------------------- |
| New files                     | 8               | Unchanged                                 |
| Modified files                | 9               | Unchanged                                 |
| Components relocated          | 3               | Unchanged                                 |
| Components absorbed           | 2               | Unchanged                                 |
| **Naming convention fixes**   | ~5 files        | **NEW** — PascalCase → kebab-case renames |
| **Container query additions** | ~6 widget files | **NEW** — `@container` wrappers           |
| **DensityToggle wiring**      | 1 file          | **NEW** — Connect to dashboard grid       |

---

**Prepared by**: UX-Architecture Review Team
**Status**: Ready for stakeholder review and approval
**Next step**: Review proposal, approve or request adjustments, then begin Phase 1 implementation
