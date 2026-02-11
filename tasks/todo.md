# UX/UI Upgrade Implementation Plan

**Created**: February 7, 2026
**Based on**: 5 agent review reports in `tasks/ux-review/`

---

## Phase 1: Quick Wins (< 30 min each, high impact)

- [x] 1.1 Replace emoji spinners (`⏳`) with `Loader2` component (leave/new, certifications/new)
- [x] 1.2 Replace `alert()` with toast in analytics export
- [x] 1.3 Move UrgentAlertBanner above roster periods in dashboard
- [x] 1.4 Fix `support@example.com` placeholder in portal error page
- [x] 1.5 Add `aria-hidden="true"` to decorative icons (support buttons, requests table)
- [x] 1.6 Add `aria-label` to checkboxes in requests table
- [x] 1.7 Add `aria-expanded` + `aria-label` to expand/collapse buttons in requests table
- [x] 1.8 Differentiate Audit Logs and Reports sidebar icons
- [x] 1.9 Fix phone number Calendar icon on profile page (should be Phone)
- [x] 1.10 Add `role="alert"` to error containers in leave form
- [x] 1.11 Mount `<GlobalAnnouncer />` in root layout
- [x] 1.12 Remove dead CSS (.btn-\*, .card, .input classes) from globals.css
- [x] 1.13 Replace hardcoded hex colors with CSS variable tokens (sidebar, dialog, sheet)
- [x] 1.14 Remove emoji prefixes from analytics section headers

## Phase 2: Component Fixes (1-2 hours each)

- [x] 2.1 Replace raw HTML `<select>` with shadcn Select component (leave/new, certifications/new)
- [x] 2.2 Replace `window.confirm()` with styled ConfirmDialog in pilot portal
- [x] 2.3 Fix unauthorized redirect on requests page (redirect to login instead of bare text)
- [x] 2.4 Add `aria-sort` to sorted table column headers (data-table, requests-table)
- [x] 2.5 Remove duplicate focus trap from Dialog component (Radix already handles it)
- [x] 2.6 Add `aria-describedby` + `aria-invalid` to leave form fields for error association
- [x] 2.7 Migrate badge.tsx to semantic color tokens
- [x] 2.8 Migrate alert.tsx to semantic color tokens
- [x] 2.9 Fix light-theme-only error colors (`bg-red-50`) in forms

## Phase 3: Layout & Navigation (2-4 hours each)

- [x] 3.1 Add mobile responsive sidebar with Sheet drawer for admin dashboard
- [x] 3.2 Standardize page backgrounds in pilot portal (use `bg-background` token everywhere)
- [x] 3.3 Standardize auth pages visual design (login/register/forgot-password)
- [x] 3.4 Add pagination to certifications page (follow audit-logs pattern)
- [x] 3.5 Fix reports tab layout breaking on small screens (scrollable tabs)
- [x] 3.6 Create `PageContainer` component for consistent page headers/spacing
- [x] 3.7 Add quick action buttons to pilot portal dashboard
- [x] 3.8 Make stat cards clickable/linkable on pilot portal dashboard

## Phase 4: Design System Consistency (1 day)

- [x] 4.1 Add surface elevation tokens (`--color-surface-0` through `--color-surface-3`)
- [x] 4.2 Create `STATUS_COLORS` constant and refactor feature components
- [x] 4.3 Fix z-index raw values in Sheet, Toast, Select to use CSS variables
- [x] 4.4 Standardize sidebar active states between admin and pilot portal
- [x] 4.5 Add `--color-interactive-*` and `--color-border-*` tokens
- [x] 4.6 Standardize heading hierarchy across all pages

## Phase 5: Structural Improvements (multi-day)

- [x] 5.1 Resolve redundant request pages in pilot portal (3 pages -> 1)
- [x] 5.2 Fix/replace `command.tsx` stub with proper cmdk integration
- [x] 5.3 Resolve FormField naming collision (3 components export same name)
- [x] 5.4 Unify table Column<T> interface between data-table and responsive-table
- [x] 5.5 Create SidebarShell abstraction shared between portals
- [x] 5.6 Add real charts/visualizations to analytics page
- [x] 5.7 Add column sorting to certifications table

---

## Redesign Phase 1: Foundation (February 2026)

**Reference**: `tasks/ux-architecture-redesign-proposal.md`

- [x] R1.1 **CSS Palette** — Add blue-indigo color variables alongside existing rose in `globals.css` (feature-flagged via `[data-theme="blue"]`)
- [x] R1.2 **DB Migration** — Add `display_name` and `avatar_url` columns to `an_users` table
- [x] R1.3 **getAdminProfile()** — New method in `user-service.ts` returning name, email, role, avatar_url
- [x] R1.4 **Fix getRecentActivity()** — Add Redis caching (60s TTL) to `dashboard-service-v4.ts`
- [x] R1.5 **Fix Redis KEYS→SCAN** — Replace `KEYS` with `SCAN` in `redis-cache-service.ts` `delPattern()`
- [x] R1.6 **PersonalizedGreeting** — New server component with user name, avatar, role badge, time greeting
- [x] R1.7 **FleetInsightsWidget** — New server component with 4 large metric cards from cached DashboardMetrics

## Redesign Phase 2: Dashboard Restructure (February 2026)

**Reference**: `tasks/ux-architecture-redesign-proposal.md` §4.4

- [x] R2.1 **getTodaysPriorities()** — New service function in `dashboard-service-v4.ts` aggregating expiring certs (<7d), pending requests, roster alerts, cached in Redis
- [x] R2.2 **Add `limit` to getAllPilotRequests()** — Add `limit` param to `PilotRequestFilters` and apply `.limit()` in query
- [x] R2.3 **QuickActionCards** — Vertical stack of 3 large CTA cards (Add Pilot, Approve Requests, Generate Report)
- [x] R2.4 **RosterCalendarWidget** — Mini 28-day calendar with current RP overlay using `roster-period-service`
- [x] R2.5 **PendingApprovalsWidget** — Top 5 pending requests with pilot name, type badge, date range, approve/deny actions
- [x] R2.6 **TodaysPriorities** — Server component consuming `getTodaysPriorities()` with prioritized agenda list
- [x] R2.7 **Rebuild dashboard-content.tsx** — 3-zone layout wiring PersonalizedGreeting, FleetInsights, TodaysPriorities, QuickActions, Roster, Approvals
- [x] R2.8 **Update dashboard page.tsx** — Replace old greeting with PersonalizedGreeting, update skeleton

## Redesign Phase 3: Navigation Overhaul (February 2026)

**Reference**: `tasks/ux-architecture-redesign-proposal.md` §4.3

- [x] R3.1 **Sidebar Restructure** — Collapse 4 section groups → flat primary (5 items) + "More" expander (6 items), remove Settings/Help/Feedback from sidebar
- [x] R3.2 **Active State Update** — Remove `border-l-2`, use `bg-primary/10 rounded-lg` filled style
- [x] R3.3 **Header Dropdown** — Add Help Center, Feedback, Settings links to user dropdown menu
- [x] R3.4 **Mobile Nav Update** — Keep all items in mobile nav (header hidden on mobile)
- [x] R3.5 **Dynamic User Name** — Replace hardcoded "Admin" in header with dynamic display name from auth context

## Redesign Phase 4: Theme Cutover (February 2026)

**Reference**: `tasks/ux-architecture-redesign-proposal.md` §4.2

- [x] R4.1 **Default Palette Swap** — Make blue-indigo the root default, replace rose values in `@theme` and `.light` blocks
- [x] R4.2 **Remove Feature Flag** — Delete `[data-theme="blue"]` and `[data-theme="blue"].dark` CSS selectors
- [x] R4.3 **Utility Color Refs** — Update hardcoded rose hex values in CSS utilities (glow, gradient, focus ring)

## Post-Redesign Audit: Missing Feature Restoration (February 2026)

- [x] R5.1 **Restore "Update Certification" Quick Action** — Add 4th action card to `quick-action-cards.tsx` linking to `/dashboard/certifications/new`
- [x] R5.2 **Restore PilotRequirementsCard** — Re-add staffing requirements widget (Captains, FOs, Examiners, Training Captains) to dashboard Zone 4
- [x] R5.3 **Restore RetirementForecastCard** — Re-add retirement forecast widget (2-year and 5-year forecasts) to dashboard Zone 4

**Intentionally Not Restored** (absorbed into new widgets):

- CompactRosterDisplay → Replaced by RosterCalendarWidget (simpler mini calendar)
- ExpiringCertificationsBannerServer → Count shown in TodaysPriorities
- UnifiedComplianceCard → Single % shown in FleetInsightsWidget

---

## Wave 1: Comprehensive Upgrade — Phases 1, 2, 3 (February 2026)

**Reference**: `tasks/upgrade-prompt.md`
**Research**: 3 parallel Explore agents completed codebase audit

---

### Phase 1: Foundation — Packages & Configuration

#### 1.1 Install New Dependencies

- [x] F1.1 Run `npm install nuqs @vercel/speed-insights`

#### 1.2 Integrate Vercel Speed Insights

- [x] F1.2 Add `<SpeedInsights />` to `app/layout.tsx` inside `<Providers>`, after `<Toaster />`
  - Import: `import { SpeedInsights } from '@vercel/speed-insights/next'`
  - Place between `<Toaster />` and closing `</Providers>`

#### 1.3 Change Default Theme to System

- [x] F1.3 In `app/providers.tsx` line 23, change `defaultTheme="dark"` to `defaultTheme="system"`
  - The three-way toggle (Light/Dark/System) already works via `enableSystem`

#### 1.4 Audit and Eliminate Internal Barrel Files

- [x] F1.4 Eliminate barrel files and update imports (17 deleted, 8 consumer imports updated)

  **Barrel files to eliminate** (replace imports with direct paths):
  1. `components/accessibility/index.ts` → 6 exports
  2. `components/certifications/index.ts` → 2 exports
  3. `components/dashboard/index.ts` → 1 export
  4. `components/forms/index.ts` → 10 exports
  5. `components/leave/index.ts` → 1 export
  6. `components/navigation/index.ts` → 3 exports
  7. `components/pilots/index.ts` → 2 exports
  8. `components/portal/index.ts` → 7 exports
  9. `components/requests/index.ts` → 3 exports
  10. `components/settings/index.ts` → 1 export
  11. `components/skeletons/index.ts` → 3 exports
  12. `lib/animations/index.ts` → re-exports from motion-variants
  13. `lib/hooks/index.ts` → 10 exports
  14. `lib/react-query/hooks/index.ts` → 10 exports
  15. `lib/supabase/index.ts` → 3 exports
  16. `lib/utils/index.ts` → re-exports from 12 modules
  17. `lib/validations/index.ts` → re-exports from 5 modules

  **Strategy**: For each barrel file:
  1. Find all consumer files importing from it (50+ files total)
  2. Update each import to point directly to the source file
  3. Delete the barrel file
  4. Run `npm run build` to verify no broken imports

#### 1.5 Add Dynamic Imports for Heavy Components

- [x] F1.5 Wrap recharts imports with `next/dynamic` (extracted to `analytics-charts.tsx`, 3 chart components)
  - Currently imports `BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend` directly from `recharts`
  - Wrap the chart-rendering component with `dynamic(() => import(...), { ssr: false })`
  - Add shimmer loading skeleton

  **Note**: jsPDF/jspdf-autotable are all server-side (service layer) — no dynamic import needed.
  **Note**: react-big-calendar and @react-pdf are NOT used in the codebase — no action needed.

#### 1.6 Build Validation

- [x] F1.6 Build passes — zero regressions

---

### Phase 2: Color System — Warm Aviation Professional Palette

#### 2.1 Update Dark Mode Tokens in globals.css

- [x] C2.1 Replace color token VALUES in `@theme` block — all oklch warm navy/teal

  **Token mapping (Dark Mode — lines 96-119 of globals.css):**
  | Token | Current Hex | New oklch |
  |-------|------------|-----------|
  | `--color-background` | `#0f172a` | `oklch(0.145 0.005 285)` |
  | `--color-foreground` | `#e2e8f0` | `oklch(0.96 0.005 80)` |
  | `--color-card` | `#1e293b` | `oklch(0.185 0.008 270)` |
  | `--color-card-foreground` | `#e2e8f0` | `oklch(0.96 0.005 80)` |
  | `--color-primary` | `#818cf8` | `oklch(0.55 0.12 250)` |
  | `--color-primary-foreground` | `#ffffff` | `oklch(0.98 0.005 80)` |
  | `--color-accent` | `#a5b4fc` | `oklch(0.70 0.14 195)` |
  | `--color-accent-foreground` | `#0f172a` | `oklch(0.15 0.01 260)` |
  | `--color-muted` | `#334155` | `oklch(0.22 0.008 260)` |
  | `--color-muted-foreground` | `#94a3b8` | `oklch(0.60 0.01 80)` |
  | `--color-border` | `rgba(255,255,255,0.1)` | `oklch(0.28 0.008 260)` |
  | `--color-input` | `rgba(255,255,255,0.1)` | `oklch(0.28 0.008 260)` |
  | `--color-ring` | `#818cf8` | `oklch(0.55 0.12 250)` |
  | `--color-popover` | `#334155` | `oklch(0.20 0.008 270)` |
  | `--color-popover-foreground` | `#e2e8f0` | `oklch(0.96 0.005 80)` |
  | `--color-secondary` | `#334155` | `oklch(0.22 0.008 260)` |
  | `--color-secondary-foreground` | `#cbd5e1` | `oklch(0.80 0.005 80)` |

  **Surface elevation system:**
  | Token | Current | New |
  |-------|---------|-----|
  | `--color-surface-0` | `#0f172a` | `oklch(0.145 0.005 285)` |
  | `--color-surface-1` | `#1e293b` | `oklch(0.185 0.008 270)` |
  | `--color-surface-2` | `#334155` | `oklch(0.22 0.008 260)` |
  | `--color-surface-3` | `#475569` | `oklch(0.30 0.008 260)` |

  **Update primary scale (50-900) to oklch warm navy equivalents.**
  **Update accent scale (50-900) to oklch teal/sky equivalents.**
  **Update neutral slate scale (50-900) to warm neutral oklch equivalents.**

#### 2.2 Update Light Mode Tokens

- [x] C2.2 Replace color token VALUES in `.light` block — all oklch

  | Token                        | New oklch               |
  | ---------------------------- | ----------------------- |
  | `--color-background`         | `oklch(0.985 0.003 80)` |
  | `--color-foreground`         | `oklch(0.15 0.01 260)`  |
  | `--color-card`               | `oklch(0.995 0.002 80)` |
  | `--color-card-foreground`    | `oklch(0.15 0.01 260)`  |
  | `--color-primary`            | `oklch(0.45 0.15 250)`  |
  | `--color-primary-foreground` | `oklch(0.98 0.005 80)`  |
  | `--color-accent`             | `oklch(0.60 0.16 195)`  |
  | `--color-accent-foreground`  | `oklch(0.98 0.005 80)`  |
  | `--color-muted`              | `oklch(0.94 0.005 80)`  |
  | `--color-muted-foreground`   | `oklch(0.45 0.01 80)`   |
  | `--color-border`             | `oklch(0.88 0.005 80)`  |
  | `--color-input`              | `oklch(0.85 0.005 80)`  |
  | `--color-ring`               | `oklch(0.45 0.15 250)`  |

  **Update light mode surface, secondary, popover tokens similarly.**

#### 2.3 Update Semantic Status Colors

- [x] C2.3 Refine status colors to oklch
  ```
  --status-success: oklch(0.70 0.18 145)
  --status-warning: oklch(0.80 0.16 85)
  --status-destructive: oklch(0.60 0.22 25)
  --status-info: oklch(0.65 0.15 250)
  ```

#### 2.4 Update Gradient Tokens

- [x] C2.4 Replace gradient tokens — navy/teal aviation theme
  ```
  --gradient-primary: linear-gradient(135deg, oklch(0.55 0.12 250), oklch(0.60 0.14 220))
  --gradient-accent: linear-gradient(135deg, oklch(0.70 0.14 195), oklch(0.65 0.12 220))
  ```

#### 2.5 Simplify Glassmorphism

- [x] C2.5 Replace glass tokens with --surface-elevated, kept glass utilities for overlays
  - Replace `--glass-bg` and `--glass-border` with `--surface-elevated` token
  - `--surface-elevated` dark: `oklch(0.20 0.008 270)`, light: `oklch(0.98 0.003 80)`
  - **40+ backdrop-blur usages in 20+ files** — evaluate case-by-case:
    - **Keep**: header, sidebar, mobile nav overlays (functional blur)
    - **Remove**: data cards, pilot-overview-tab, dashboard cards (readability concern)
  - Update `.glass` and `.glass-strong` utility classes

#### 2.6 Fix Hardcoded Colors in Components

- [x] C2.6a Update `components/ui/success-celebration.tsx` — 6 confetti colors updated
  - Replace confetti hex array with CSS variable references or oklch equivalents
- [x] C2.6b Update `components/ui/empty-state-illustrated.tsx` — 57 SVG hex values replaced
  - Replace all hardcoded hex colors in SVG `<linearGradient>` stops with oklch equivalents matching new palette

#### 2.7 Update Utility CSS Classes

- [x] C2.7 Update hardcoded hex in globals.css utility classes — all oklch:
  - `.glow-hover` (line 862): `rgba(79, 106, 246, 0.12)` → oklch primary equivalent
  - `.text-gradient-primary` (line 867): `#4f6af6, #6366f1` → oklch equivalents
  - `.horizon-line::after` (line 926): gradient hex values → oklch
  - `.altitude-accent::before` (line 990): `#4f6af6, #6366f1` → oklch
  - Focus ring box-shadow hex values (lines 807-808)
  - Skip-to-main hex values (lines 825-828)

#### 2.8 Build & Visual Validation

- [x] C2.8 Build passes — visual verification pending (user)

---

### Phase 3: Typography — Data-Dense Optimization

#### 3.1 Add Dashboard Layout Font Class

- [x] T3.1a Add `.dashboard-layout` class to `app/globals.css`:
  ```css
  .dashboard-layout {
    font-size: 14px;
    line-height: 1.5;
  }
  ```
- [x] T3.1b Add `dashboard-layout` class to `<main>` element in `app/dashboard/layout.tsx`

#### 3.2 Update Typography Scale for 14px Base

- [x] T3.2 Replace fluid `--text-*` tokens with fixed rem scale:
  ```
  --text-xs: 0.75rem      /* 10.5px — labels, badges */
  --text-sm: 0.857rem     /* 12px — secondary text */
  --text-base: 1rem       /* 14px — body text */
  --text-lg: 1.143rem     /* 16px — subheadings */
  --text-xl: 1.286rem     /* 18px — section headings */
  --text-2xl: 1.571rem    /* 22px — page titles */
  --text-3xl: 2rem        /* 28px — hero numbers */
  ```

#### 3.3 Replace Hardcoded Pixel Font Sizes

- [x] T3.3a Replace `text-[13px]` → `text-sm` in `professional-header.tsx` (9 instances)
  - Lines: 233, 266, 312, 329, 337, 345, 359, 367, 381 (9 instances)
- [x] T3.3b Replace `text-[13px]` → `text-sm` in `professional-sidebar-client.tsx` (4 instances)
  - Lines: 172, 252, 267, 287 (4 instances)
- [x] T3.3c Replace `text-[10px]` → `text-xs` across 4 files (8 instances)
  - `professional-header.tsx` lines 213, 272
  - `professional-sidebar-client.tsx` lines 193, 319
  - `error-boundary.tsx` lines 140, 150
  - `leave-bid-annual-calendar.tsx` line 102
- [x] T3.3d Replace `text-[9px]` → `text-xs` in `compact-roster-display.tsx`
  - Consider replacing with `text-xs` or keeping as intentionally tiny badge text

#### 3.4 Build Validation

- [x] T3.4 Build passes — zero regressions

---

### Wave 1 Completion Checklist

- [x] All three phases pass `npm run build`
- [x] Run `npm run validate` (type-check + lint + format:check)
- [ ] Visual check: dark mode dashboard renders correctly
- [ ] Visual check: light mode dashboard renders correctly
- [ ] Visual check: sidebar and header text is legible at new sizes
- [x] No broken imports from barrel file elimination
- [ ] Color contrast spot-check on primary text, buttons, status badges

---

## Wave 2: Comprehensive Upgrade — Phases 4, 5, 6 (February 2026)

**Reference**: `tasks/upgrade-prompt.md`
**Research**: 3 parallel Explore agents completed codebase audit

---

### Phase 4: Architecture — nuqs URL State & Cache Tags

#### Research Findings

The dashboard already uses **per-widget `<Suspense>` boundaries** with independent async Server Components — this is BETTER than page-level `Promise.all()` because each widget streams independently as its data resolves. **No data fetching restructuring needed.**

Real gaps:

- 21 `useSearchParams` usages manually managing URL state across 4 key pages
- No tag-based cache invalidation — `delPattern()` only supports glob patterns
- nuqs installed (Wave 1) but NuqsAdapter provider not yet mounted

#### 4.1 Add NuqsAdapter Provider

- [x] A4.1 Add `NuqsAdapter` to `app/providers.tsx`
  - Import: `import { NuqsAdapter } from 'nuqs/adapters/next/app'`
  - Wrap children inside CsrfProvider: `<NuqsAdapter>{children}</NuqsAdapter>`
  - nuqs requires this adapter for Next.js App Router

#### 4.2 Migrate Requests Page Filters to nuqs

- [x] A4.2 Migrate `components/requests/request-filters-wrapper.tsx` from manual `useSearchParams` to `nuqs`
  - Current: Manually reads/writes `roster_period, status, category, channel, is_late, is_past_deadline` via `URLSearchParams`
  - Target: `useQueryState()` for each param with proper parsers (`parseAsString`, `parseAsStringLiteral`, `parseAsBoolean`)
  - Benefit: Type-safe, auto-syncing, bookmarkable filter state

#### 4.3 Migrate Certifications Tabs to nuqs

- [x] A4.3 Migrate `components/certifications/certifications-tabs.tsx` from manual `useSearchParams` to `nuqs`
  - Current: Manually reads/writes `tab` param
  - Target: `useQueryState('tab', parseAsStringLiteral(['all', 'attention', 'category']).withDefault('all'))`

#### 4.4 Migrate Admin Tabs to nuqs

- [x] A4.4 Migrate `components/admin/admin-tabs-client.tsx` from manual `useSearchParams` to `nuqs`
  - Current: Manually reads/writes `tab` param
  - Target: `useQueryState('tab', parseAsStringLiteral([...]).withDefault('overview'))`

#### 4.5 Add Tag-Based Cache Invalidation

- [x] A4.5a Add tag tracking to `redis-cache-service.ts`
  - New method: `setWithTags<T>(key: string, value: T, ttl: number, tags: string[]): Promise<void>`
  - Implementation: Use Redis Sets — for each tag, maintain a Set `tag:{tagName}` containing all cache keys with that tag
  - On set: `pipeline.set(key, value, {ex: ttl})` + `pipeline.sadd('tag:pilots', key)` for each tag
  - New method: `invalidateByTag(tag: string): Promise<void>`
  - Implementation: `SMEMBERS tag:{tag}` → `DEL` each key → `DEL tag:{tag}`
- [x] A4.5b Integrate tags into `dashboard-service-v4.ts`
  - `getDashboardMetrics()` → tags: `['dashboard', 'pilots', 'certifications']`
  - `getTodaysPriorities()` → tags: `['dashboard', 'priorities']`
  - `getRecentActivity()` → tags: `['dashboard', 'activity']`
- [x] A4.5c Update `cache-invalidation-helper.ts` to use tag invalidation
  - `invalidatePilotCaches()` → add `invalidateByTag('pilots')`
  - `invalidateCertificationCaches()` → add `invalidateByTag('certifications')`
  - `invalidateLeaveCaches()` → add `invalidateByTag('leave')`

#### 4.6 Build Validation

- [x] A4.6 Build passes — zero regressions

---

### Phase 5: Navigation — Command Palette with Entity Search

#### Research Findings

A `GlobalSearch` component already exists at `components/search/global-search.tsx` with Cmd+K, keyboard navigation, and 23 static page items. However it uses raw Dialog + custom keyboard handling instead of the `cmdk` package (already installed v1.1.1). The `components/ui/command.tsx` shadcn wrapper is fully functional with 10 sub-components.

Approach: **Rewrite GlobalSearch to use cmdk** for better accessibility and keyboard UX, then add dynamic entity search via a new API endpoint.

#### 5.1 Rewrite GlobalSearch with cmdk

- [x] N5.1 Rewrite `components/search/global-search.tsx` to use `CommandDialog` from `components/ui/command.tsx`
  - Replace custom Dialog + Input + keyboard handlers with `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`
  - Keep Cmd+K handler (already works)
  - Keep all 23 static navigation items, grouped by category
  - Add `CommandEmpty` for no-results state
  - Add `CommandShortcut` hints on key items
  - Use existing z-index hierarchy (`--z-modal: 60`)

#### 5.2 Create Search API Endpoint

- [x] N5.2 Create `app/api/search/route.ts`
  - Accept `GET /api/search?q=smith&type=all` (type: all|pilots|certifications|requests)
  - Query service layer: `searchPilots()` from pilot-service, `getCertifications()` with name filter, `getAllPilotRequests()` with search
  - Return unified shape: `{ results: [{ id, title, subtitle, type, href, icon }] }`
  - Limit: 5 results per category, max 15 total
  - Auth: Require admin session (use existing `getAuthenticatedAdmin()`)

#### 5.3 Add Dynamic Search to Command Palette

- [x] N5.3 Wire async entity search into the rewritten GlobalSearch
  - Debounced fetch (300ms) to `/api/search?q={query}` when query.length >= 2
  - Show loading state via `CommandLoading` from cmdk
  - Group dynamic results: "Pilots", "Certifications", "Requests" with entity-specific icons
  - Static navigation group always visible (filtered client-side)
  - Dynamic results appear below static navigation

#### 5.4 Add Quick Actions Group

- [x] N5.4 Add "Quick Actions" group to command palette
  - "New Leave Request" → `/dashboard/requests?action=new`
  - "Add Pilot" → `/dashboard/pilots/new`
  - "Generate Report" → `/dashboard/reports`
  - "Update Certification" → `/dashboard/certifications/new`
  - Show above navigation group for fast access

#### 5.5 Build Validation

- [x] N5.5 Build passes — zero regressions

---

### Phase 6: Animation — Reduced Motion Compliance

#### Research Findings

The animation infrastructure is **excellent**: `motion-variants.ts` has 20+ presets, `use-reduced-motion.ts` provides `useAnimationSettings()` hook, and CSS has global `prefers-reduced-motion` support. However, **12 of 17 Framer Motion components lack reduced-motion checks** — a critical accessibility gap.

The upgrade prompt's `motion-config.ts` file is unnecessary — `motion-variants.ts` already serves this purpose with timing constants (DURATION, EASING) and preset variants. CSS transition tokens (`--transition-fast/normal/slow`) also already exist.

#### 6.1 Add Reduced Motion to Layout Components

- [x] M6.1a Add `useAnimationSettings()` to `components/layout/professional-header.tsx`
  - Import hook, conditionally disable `motion` animations when `!shouldAnimate`
  - Wrap `AnimatePresence` content with reduced-motion variants
- [x] M6.1b Add `useAnimationSettings()` to `components/layout/professional-sidebar-client.tsx`
  - Same pattern: conditional animation variants
- [x] M6.1c Add `useAnimationSettings()` to `components/layout/pilot-portal-sidebar.tsx`

#### 6.2 Add Reduced Motion to Dashboard Components

- [x] M6.2a Add `useAnimationSettings()` to `components/dashboard/hero-stats-client.tsx`
  - Conditionally disable `whileHover` and spring animations
- [x] M6.2b Add `useAnimationSettings()` to `components/dashboard/urgent-alert-banner-client.tsx`
- [x] M6.2c Add `useAnimationSettings()` to `components/dashboard/expiring-certifications-banner.tsx`
- [x] M6.2d Add `useAnimationSettings()` to `components/dashboard/compliance-overview-client.tsx`

#### 6.3 Add Reduced Motion to Other Components

- [x] M6.3a Add `useAnimationSettings()` to `components/pilots/premium-pilot-card.tsx`
- [x] M6.3b Add `useAnimationSettings()` to `components/pilots/pilot-overview-tab.tsx`
- [x] M6.3c Add `useAnimationSettings()` to `components/ui/offline-indicator.tsx`
  - Spring animation (stiffness 300, damping 30) currently runs unconditionally
- [x] M6.3d Add `useAnimationSettings()` to `components/pilot/PilotLoginForm.tsx`

#### 6.4 Build Validation

- [x] M6.4 Build passes — zero regressions

---

### Wave 2 Completion Checklist

- [x] All three phases pass `npm run build`
- [x] Run `npm run validate` (type-check + lint + format:check)
- [ ] Cmd+K opens command palette with navigation + entity search
- [ ] URL filters on requests page are bookmarkable (nuqs)
- [ ] Cache tag invalidation works (pilot update clears dashboard cache)
- [ ] Framer Motion animations respect `prefers-reduced-motion` in all 17 components

---

## Wave 3: Comprehensive Upgrade — Phases 7, 8, 9 (February 2026)

**Reference**: `tasks/upgrade-prompt.md`
**Research**: 3 parallel Explore agents completed codebase audit

---

### Phase 7: Accessibility — WCAG 2.2 AA Compliance

#### Research Findings

The codebase is **already A- grade for accessibility**: skip nav, global announcer, route focus management, axe-core automated tests (10+ suites, 456 lines), and proper form field labeling are all in place. Only **2 issues** prevent full WCAG 2.2 AA compliance.

#### 7.1 Add Keyboard Alternative to TaskKanban (WCAG 2.5.7)

- [x] AC7.1 Add status-change `<select>` dropdown to TaskCard in `components/tasks/TaskKanban.tsx`
  - Current: Drag-only to move tasks between columns — keyboard users cannot reorder
  - Fix: Add a small `<select>` on each TaskCard allowing status change (e.g., "To Do" → "In Progress" → "Done")
  - This provides a click/keyboard alternative to the drag operation
  - Keep drag-and-drop working for mouse users

#### 7.2 Fix Warning Color Contrast in Light Mode (WCAG 1.4.11)

- [x] AC7.2 Increase warning text contrast in light mode in `app/globals.css`
  - Current: Warning color on light background is ~3.9:1 (below 4.5:1 minimum)
  - Fix: Darken `--status-warning` in `.light` block — increase lightness from 0.80 to ~0.55 for text usage
  - Alternative: Add `--status-warning-text` token with higher contrast for text, keep existing for backgrounds/badges

#### 7.3 Build Validation

- [x] AC7.3 Build passes — zero regressions

---

### Phase 8: Performance — Bundle Optimization & Core Web Vitals

#### Research Findings

**Critical bundle bloat**: 3 services statically import jsPDF+autotable (180KB), date-fns missing from optimizePackageImports (35KB wasted), @tremor/react not lazy-loaded on 2 pages (200KB). Total preventable overhead: ~215KB uncompressed (~60KB gzip).

Font loading is optimal (Geist local + Space Grotesk with swap). No raw `<img>` tags. Skeletons match layouts well. SpeedInsights loads asynchronously.

#### 8.1 Add date-fns to optimizePackageImports

- [x] PF8.1 Add `'date-fns'` to `optimizePackageImports` array in `next.config.js`
  - Currently absent — Next.js can't tree-shake date-fns imports
  - 20+ files import from date-fns; only ~10 functions are actually used
  - Expected savings: ~8-12KB gzip

#### 8.2 Lazy-Load jsPDF in Service Files

- [x] PF8.2a Convert static jsPDF import to dynamic in `lib/services/renewal-planning-pdf-service.ts`
  - Change: `import jsPDF from 'jspdf'` → `const { default: jsPDF } = await import('jspdf')` inside the function
  - Same for `jspdf-autotable`
- [x] PF8.2b Convert static jsPDF import to dynamic in `lib/services/export-service.ts`
- [x] PF8.2c Convert static jsPDF import to dynamic in `lib/services/reports-service.ts`
  - Note: `lib/services/roster-pdf-service.ts` already uses dynamic import correctly — use as reference
  - Expected savings: ~60KB gzip total

#### 8.3 Lazy-Load @tremor/react Components

- [x] PF8.3a Wrap `@tremor/react` usage in `components/analytics/MultiYearForecastChart.tsx` with `dynamic()` or lazy import
  - @tremor/react is ~200KB; only used on 2 pages
- [x] PF8.3b Wrap `@tremor/react` usage in `components/retirement/TimelineVisualization.tsx` with `dynamic()` or lazy import

#### 8.4 Implement Cache Warming

- [x] PF8.4 Implement actual logic in `warmUpCache()` in `lib/services/redis-cache-service.ts`
  - Currently an empty stub (lines 620-627)
  - Should pre-load: reference data (check types, contract types, settings), fleet statistics
  - Call from a cron endpoint or on first dashboard request

#### 8.5 Build Validation

- [x] PF8.5 Build passes — zero regressions

---

### Phase 9: Developer Experience — React Compiler

#### Research Findings

React 19.2.4 + Next.js 16.1.6 are fully compatible with React Compiler. Zero `React.memo` instances, zero blocking incompatibility patterns. 45 useMemo and 52 useCallback usages exist — ~30 useCallbacks are candidates for removal post-RC, but this cleanup is optional (RC handles them automatically). Storybook has 37 stories but 0/10 dashboard widgets have stories (server components require mock data wrappers — deferred to future sprint).

#### 9.1 Enable React Compiler

- [x] DX9.1 Add `reactCompiler: true` to top-level config in `next.config.js`
  - Next.js 16 handles it natively — no babel plugin needed
  - Test build + verify no regressions
  - Framer Motion animations are the main risk area (animated-section.tsx, page-transition.tsx)

#### 9.2 Build & Verify

- [x] DX9.2 Run `npm run build` — verify zero regressions with React Compiler enabled
  - If Framer Motion issues arise, add `'use no memo'` directive to affected files
  - Run `npm run validate` for full quality gate

---

### Wave 3 Completion Checklist

- [x] All three phases pass `npm run build`
- [x] Run `npm run validate` (type-check + lint + format:check)
- [x] TaskKanban has keyboard alternative for status changes
- [x] Warning color meets 4.5:1 contrast in light mode (`--color-warning-text` token added)
- [x] jsPDF no longer in initial bundle (3 services converted to dynamic import)
- [x] React Compiler enabled and build-passing

---

## Reference

Full review reports: `tasks/ux-review/01-05`
Redesign proposal: `tasks/ux-architecture-redesign-proposal.md`
Comprehensive upgrade prompt: `tasks/upgrade-prompt.md`

---

## Remove Non-Renewal Check Types (February 10, 2026)

**Scope**: Remove all 7 non-renewal check types from database and codebase.
**Check types**: B767_PE_CNS, PBN, EFB_CBT, B767_PERF, LICENCES, OPT, B767_WB
**Risk**: LOW — FK constraints use ON DELETE CASCADE; only 3 code files have hardcoded 'Non-renewal' refs

### Phase 1: Database Migration

- [ ] NR1.1 Create `supabase/migrations/20260210000002_remove_non_renewal_check_types.sql`
  - Delete `pilot_checks` referencing Non-renewal check types (explicit, before CASCADE)
  - Delete `check_types` where `category = 'Non-renewal'` (removes all 7)
  - ALTER `roster_period_capacity.max_pilots_per_category` default to remove `"Non-renewal": 2`
  - UPDATE existing `roster_period_capacity` rows to strip `"Non-renewal"` from JSONB columns

### Phase 2: Code Cleanup (3 files + 1 doc)

- [ ] NR2.1 `lib/utils/grace-period-utils.ts` — Remove `'Non-renewal': 0` from GRACE_PERIODS (line 25)
- [ ] NR2.2 `lib/utils/certification-utils.ts` — Remove `case 'Non-renewal':` from getCategoryIcon() (lines 576-577) and getCategoryColor() (lines 609-610)
- [ ] NR2.3 `docs/RENEWAL_PLANNING_TECHNICAL.md` — Remove `'Non-renewal': 0` from code snippet (line 392)

### Phase 3: Validation

- [ ] NR3.1 Run `npm run build` — verify no SSR/import errors
- [ ] NR3.2 Run `npm run validate` — type-check + lint + format

---

## Comprehensive UI/UX Consistency Review (February 10, 2026)

**Scope**: 116 issues identified across 5 parallel reviews (Dashboard, Pilots, Certs/Requests, Admin/Reports, Portal)
**Approach**: Grouped by theme, ordered by impact. Quick wins first, then structural fixes.

---

### Phase 1: Dead Code & Architecture Cleanup

Remove unused files and resolve competing architectures before making UI changes.

- [ ] UX1.1 **Delete dead dashboard components** — `hero-stats.tsx`, `hero-stats-server.tsx`, `hero-stats-client.tsx`, `critical-stats-strip.tsx` (not imported in dashboard-content.tsx, contain hardcoded mock data)
- [ ] UX1.2 **Delete dead admin components** — `page-improved.tsx`, `admin-dashboard-client.tsx` (neither used by live routes)
- [ ] UX1.3 **Delete unused portal component** — `components/portal/dashboard-stats.tsx` (never imported)
- [ ] UX1.4 **Remove hidden skeleton dead code** — `components/skeletons/pilot-list-skeleton.tsx` lines 96-134 (hidden table skeleton) and lines 137-164 (duplicate mobile cards skeleton)

### Phase 2: Security & Data Integrity Fixes

Critical fixes that prevent data loss or security issues.

- [ ] UX2.1 **Add CSRF token to rank group delete** — `components/pilots/pilot-rank-group.tsx:66-67` — add CSRF header and `credentials: 'include'`
- [ ] UX2.2 **Add unsaved changes warning to edit form** — `app/dashboard/pilots/[id]/edit/page.tsx` — add `useFormUnsavedChanges` hook (new form already has it)
- [ ] UX2.3 **Fix Cancel link clickable during submission** — `app/dashboard/pilots/[id]/edit/page.tsx:731-734` — add `pointer-events-none` to Link wrapper when `isSubmitting`
- [ ] UX2.4 **Move Delete button to "More Actions" dropdown** — `components/pilots/pilot-profile-header.tsx:122-125` — reduce accidental deletion risk

### Phase 3: Cross-Cutting Consistency — Page Headers

Standardize the single most visible inconsistency across the entire app.

- [ ] UX3.1 **Standardize all page headings to `text-xl font-semibold tracking-tight lg:text-2xl`**
  - Admin main page (page.tsx:51): `text-3xl font-bold` → standardize
  - Admin sub-pages (settings:24, check-types:34): `text-2xl font-bold` → standardize
  - Audit Logs (page.tsx:85): `text-3xl font-bold` → standardize
  - Request Detail (requests/[id]/page.tsx:115): `text-3xl font-bold` → standardize
  - Portal Notifications (page.tsx:170): `text-3xl font-bold` → standardize
  - Portal Leave Bids (page.tsx:38): `text-3xl font-bold` → standardize
- [ ] UX3.2 **Fix Audit Logs unique container wrapper** — Change `container mx-auto px-4 py-8` to `space-y-6` to match all other pages

### Phase 4: Replace alert() with Toast System

Every `alert()` call breaks the visual language and blocks the UI.

- [ ] UX4.1 `app/dashboard/pilots/[id]/page.tsx:151` — replace `alert(message)` with `toast`
- [ ] UX4.2 `app/dashboard/admin/settings/settings-client.tsx:55,58,82,86` — replace all `alert()` with `toast`
- [ ] UX4.3 `components/certifications/certifications-view-toggle.tsx:48-54` — replace `alert()` with `toast`

### Phase 5: Replace Emoji with Lucide Icons

Emoji render inconsistently across platforms and break the professional design language.

- [ ] UX5.1 **Admin Settings page** — `settings/page.tsx:41-68` — replace ⚙️ ✅ 🔒 with `Settings`, `CheckCircle2`, `Lock` icons
- [ ] UX5.2 **Check-types page** — `check-types/page.tsx:54-85` — replace 📋 🏷️ ✅ 📅 with Lucide equivalents
- [ ] UX5.3 **Settings client** — `settings-client.tsx:143,186,230,273` — replace ⚓ 📋 🏖️ 🔧 with Lucide equivalents
- [ ] UX5.4 **Analytics page** — `page.tsx:222,258,267` — replace ❌ 🔄 🚨 with Lucide equivalents
- [ ] UX5.5 **New User page** — `users/new/page.tsx:199` — replace ⏳ with `Loader2` spinner
- [ ] UX5.6 **New certification page** — `certifications/new/page.tsx:364` — replace ℹ️ with `Info` icon

### Phase 6: Component Consistency — Tables & Forms

Replace native HTML elements with shadcn/ui components for visual consistency.

- [ ] UX6.1 **Replace native `<select>` with shadcn Select** across:
  - `check-types/page.tsx:107-114`
  - `audit-logs/components/audit-filters.tsx:42-94`
  - `users/new/page.tsx:141-151`
  - `components/portal/flight-request-form.tsx:106-114`
  - `app/portal/(protected)/feedback/page.tsx:141-157`
- [ ] UX6.2 **Replace native `<table>` with shadcn Table** across admin pages:
  - `admin/page.tsx:184-211`
  - `check-types/page.tsx:121-182`
  - `settings-client.tsx:320-398`
  - `audit-logs/page.tsx:159-225`
  - `pilot-rank-group.tsx:127-209`
- [ ] UX6.3 **Replace native `<textarea>` with shadcn Textarea** — `certifications/new/page.tsx:316-325`
- [ ] UX6.4 **Replace raw `<button>` with shadcn Button** in portal forms — `leave-request-form.tsx:362-368`, `flight-request-form.tsx:262-268`

### Phase 7: Accessibility Fixes

- [ ] UX7.1 **Add ARIA tab pattern to pilots view toggle** — `pilots-view-toggle.tsx:111-142` — add `role="tablist"`, `role="tab"`, `aria-selected`
- [ ] UX7.2 **Fix pilot detail tab labels on mobile** — `pilot-detail-tabs.tsx:104,108` — add `aria-label` to TabsTrigger when text is hidden
- [ ] UX7.3 **Add aria-labels to inline edit buttons** — `pilot-certifications-tab.tsx:426-433` — add `aria-label="Save"` / `aria-label="Cancel"`, add Enter/Escape keyboard shortcuts
- [ ] UX7.4 **Fix category group header keyboard access** — `certification-category-group.tsx:83-86` — change `<div>` with `onClick` to `<button>` with `aria-expanded`
- [ ] UX7.5 **Add table accessibility** — add `caption` or `aria-label` to tables in admin pages, add `scope="col"` to `<th>` elements

### Phase 8: Dashboard Layout Improvements

- [ ] UX8.1 **Fix Zone 4 grid when UrgentAlertBanner is null** — `dashboard-content.tsx:81-108` — collapse to 2-col or add fallback placeholder
- [ ] UX8.2 **Add `h-full` to Zone 4 cards** — `roster-calendar-widget.tsx:76`, `pending-approvals-widget.tsx:51`
- [ ] UX8.3 **Fix Suspense fallback height** — `dashboard-content.tsx:104` — match `h-16` to sibling `h-64`
- [ ] UX8.4 **Standardize widget header styles** — align RetirementForecastCard and CompactRosterDisplay headers with Pattern A (subtle uppercase labels)
- [ ] UX8.5 **Remove duplicate container styles** — `app/dashboard/page.tsx:20` duplicates `dashboard-content.tsx:32`
- [ ] UX8.6 **Replace inline `style={{ minWidth: 0 }}` with `min-w-0`** — page.tsx and dashboard-content.tsx
- [ ] UX8.7 **Fix breadcrumb Home link** — `breadcrumb.tsx:72` — change `href="/"` to `href="/dashboard"`
- [ ] UX8.8 **Fix breadcrumb stacking margin** — remove `mb-4` from Breadcrumb since parent `space-y-6` provides rhythm

### Phase 9: Status Badge & Color Standardization

- [ ] UX9.1 **Standardize status badges** — use `destructive` for expired/red, `warning` for expiring/yellow, `success` for current/green across ALL certification components: `certifications-table.tsx`, `certification-category-group.tsx`, `category-view.tsx`, `expiry-groups-accordion.tsx`
- [ ] UX9.2 **Standardize delete button styling** — use `bg-destructive text-destructive-foreground hover:bg-destructive/90` everywhere (replace `--color-danger-600`, `--color-status-high` variants)
- [ ] UX9.3 **Create shared `<RankBadge>` component** — standardize Captain/FO badge across `pilots-table.tsx`, `pilot-card.tsx`, `pilot-profile-header.tsx`, `pilot-rank-group.tsx`
- [ ] UX9.4 **Standardize date formatting** — use `formatDate()` utility consistently, standardize on `MMM d, yyyy` format

### Phase 10: Portal-Specific Fixes

- [ ] UX10.1 **Unify auth page visual style** — bring login page up to match forgot-password/reset-password styling (or simplify those to match login)
- [ ] UX10.2 **Add Leave Bids to portal sidebar nav** — `pilot-portal-sidebar.tsx` — key functionality currently unreachable
- [ ] UX10.3 **Fix certifications sticky header overlap on mobile** — `portal/certifications/page.tsx:252-271` — adjust `top` to `top-16` on mobile
- [ ] UX10.4 **Fix conflicting CSS classes on dashboard headings** — `portal/dashboard/page.tsx:130,194,256` — remove duplicate `text-foreground`
- [ ] UX10.5 **Standardize portal page padding** — unify to `px-6 lg:px-8` across all portal pages
- [ ] UX10.6 **Replace native form elements in portal feedback page** — `feedback/page.tsx` — use shadcn components

### Phase 11: Navigation & Layout Fixes

- [ ] UX11.1 **Fix duplicate sidebar icon** — `professional-sidebar-client.tsx:66` — change Audit Logs from `ClipboardList` to `ScrollText`
- [ ] UX11.2 **Fix duplicate user menu items** — `professional-header.tsx:337-352` — Profile and Settings both go to `/dashboard/settings`
- [ ] UX11.3 **Unify logout endpoints** — MobileNav uses `/api/auth/signout`, sidebar/header use `/api/auth/logout` — pick one
- [ ] UX11.4 **Change notification badge to `bg-destructive`** — `professional-header.tsx:215` — standard red dot pattern
- [ ] UX11.5 **Fix Help "Contact Support" broken link** — `faq-content.tsx:289` — links to non-existent `/dashboard/support`
- [ ] UX11.6 **Consolidate portal Feedback/Feedback History** into single nav item with tabs

### Phase 12: Non-Functional Button Cleanup (Admin)

- [ ] UX12.1 **Remove or wire up non-functional buttons**:
  - Check-types filter button (`check-types/page.tsx:115-117`) — no handler
  - Check-types View/Edit buttons (`check-types/page.tsx:167-177`) — no handler
  - Settings "Add Setting" button (`settings/page.tsx:32-34`) — no handler
  - Check-types "Add Check Type" button (`check-types/page.tsx:43-45`) — no handler

### Phase 13: Validation

- [ ] UX13.1 Run `npm run build` — verify no SSR/import errors
- [ ] UX13.2 Run `npm run validate` — type-check + lint + format

---

## Email Notifications for Certification Expiry (February 11, 2026)

**Scope**: Add email to pilot records + configurable per-check-type reminder notifications
**Goal**: Automatic email notifications based on certification type and admin-configurable reminder settings

### Research Summary

**What already exists (no changes needed):**

- Resend email integration via `pilot-email-service.ts` with `sendCertificationExpiryAlert()`
- Cron job at `/api/cron/certification-expiry-alerts/route.ts` (daily 6 AM)
- DB function `get_expiring_certifications_with_email` joining pilots with emails from `pilot_users`
- `notification_level` enum: 90_DAYS, 60_DAYS, 30_DAYS, 14_DAYS, 7_DAYS, EXPIRED, CRITICAL
- `notification_status` enum: PENDING, SENT, ACKNOWLEDGED, FAILED, CANCELLED
- In-app notification system (CRUD + bell icon + unread counts)
- User notification preferences with `certification_reminders` toggle
- `alert_thresholds` system setting (7/14/30/60/90 day thresholds)

**What's missing (this plan):**

1. Email field directly on `pilots` table (not all pilots have portal accounts)
2. Per-check-type reminder day configuration (currently all use same 90-day threshold)
3. Email notification tracking (prevent duplicate daily emails)
4. Admin UI for managing per-check-type reminder settings
5. Updated cron job to respect per-check-type settings + track sent notifications
6. Pilot form updates to capture email

---

### Phase 1: Database Schema Changes

#### 1.1 Add Email to Pilots Table

- [ ] EN1.1 Create migration `supabase/migrations/20260211000001_add_pilot_email_and_reminders.sql`
  - `ALTER TABLE pilots ADD COLUMN email TEXT;`
  - Add index: `CREATE INDEX idx_pilots_email ON pilots(email);`
  - Comment: `COMMENT ON COLUMN pilots.email IS 'Direct email for notifications. Falls back to pilot_users.email if null.';`

#### 1.2 Add Reminder Configuration to Check Types

- [ ] EN1.2 Same migration — add per-check-type reminder settings
  - `ALTER TABLE check_types ADD COLUMN reminder_days INTEGER[] DEFAULT '{90,60,30,14,7}';`
  - `ALTER TABLE check_types ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;`
  - Comment: `COMMENT ON COLUMN check_types.reminder_days IS 'Array of days-before-expiry to send email reminders. e.g., {90,60,30,14,7}';`
  - Comment: `COMMENT ON COLUMN check_types.email_notifications_enabled IS 'Whether email notifications are enabled for this check type';`

#### 1.3 Create Notification Log Table

- [ ] EN1.3 Same migration — create email notification tracking table
  ```sql
  CREATE TABLE certification_email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    pilot_check_id UUID NOT NULL REFERENCES pilot_checks(id) ON DELETE CASCADE,
    notification_level notification_level NOT NULL,
    notification_status notification_status NOT NULL DEFAULT 'PENDING',
    email_address TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_cert_email_log_pilot ON certification_email_log(pilot_id);
  CREATE INDEX idx_cert_email_log_dedup ON certification_email_log(pilot_check_id, notification_level);
  ```

#### 1.4 Update DB Function

- [ ] EN1.4 Same migration — update `get_expiring_certifications_with_email` to also check `pilots.email`
  - Change email source: `COALESCE(p.email, pu.email) AS email` (prefer pilots.email, fallback to pilot_users.email)
  - Add `ct.reminder_days` and `ct.email_notifications_enabled` to SELECT output
  - Add `WHERE ct.email_notifications_enabled = true` filter

#### 1.5 Regenerate Types

- [ ] EN1.5 Run `npm run db:types` after migration is applied

---

### Phase 2: Service Layer Updates

#### 2.1 Update Pilot Service

- [ ] EN2.1 Add `email` to `PilotFormData` interface in `lib/services/pilot-service.ts`
  - Add `email?: string | null` to the interface
  - Include `email` in `createPilot()` and `updatePilot()` operations

#### 2.2 Create Certification Notification Service

- [ ] EN2.2 Create `lib/services/certification-notification-service.ts`
  - `getCheckTypeReminderSettings()` — fetch reminder config for all check types
  - `updateCheckTypeReminderSettings(checkTypeId, settings)` — update reminder days + enabled flag
  - `hasNotificationBeenSent(pilotCheckId, level)` — check dedup log
  - `logNotificationSent(pilotId, pilotCheckId, level, email, status)` — write to log
  - `getNotificationHistory(pilotId?)` — admin view of sent notifications

---

### Phase 3: Cron Job Enhancement

#### 3.1 Update Certification Expiry Alerts Cron

- [ ] EN3.1 Update `app/api/cron/certification-expiry-alerts/route.ts`
  - Use per-check-type `reminder_days` instead of hardcoded 90-day threshold
  - Determine `notification_level` from days-until-expiry (match `notification_level` enum)
  - Check dedup: skip if same (pilot_check_id, level) already sent
  - Respect `email_notifications_enabled` per check type
  - Respect user `certification_reminders` preference (check `pilot_users.notification_settings`)
  - Log all sent emails to `certification_email_log`
  - Also create in-app notifications via `notification-service.ts`

---

### Phase 4: Admin UI — Check Type Reminder Settings

#### 4.1 Update Check Types Admin Page

- [ ] EN4.1 Update `app/dashboard/admin/check-types/page.tsx`
  - Display `reminder_days` and `email_notifications_enabled` per check type
  - Add Edit dialog to configure reminder days (multi-select checkboxes: 90, 60, 30, 14, 7 days)
  - Add toggle for email notifications enabled/disabled per check type
  - Show notification history/stats per check type

#### 4.2 Create API Route for Check Type Reminder Settings

- [ ] EN4.2 Create `app/api/check-types/[id]/reminders/route.ts`
  - `PUT` — update reminder_days and email_notifications_enabled
  - Auth: require admin session
  - Validate with Zod schema

---

### Phase 5: Pilot Form Updates

#### 5.1 Add Email Field to New Pilot Form

- [ ] EN5.1 Update `app/dashboard/pilots/new/page.tsx`
  - Add email input field in the Personal Information section
  - Update Zod validation schema to include optional email

#### 5.2 Add Email Field to Edit Pilot Form

- [ ] EN5.2 Update `app/dashboard/pilots/[id]/edit/page.tsx`
  - Add email input field
  - Pre-populate from `pilots.email` or fall back to `pilot_users.email`

#### 5.3 Show Email in Pilot Detail View

- [ ] EN5.3 Update `app/dashboard/pilots/[id]/page.tsx`
  - Display email in pilot overview tab
  - Show notification preference status (if pilot has portal account)

---

### Phase 6: Pilot Validation Schema Updates

- [ ] EN6.1 Update `lib/validations/pilot-validation.ts`
  - Add `email: z.string().email().optional().nullable()` to `PilotCreateSchema` and `PilotUpdateSchema`

---

### Phase 7: Notification History View (Admin)

- [ ] EN7.1 Add notification history tab/section to admin dashboard or settings
  - Table showing: pilot name, check type, notification level, email, sent date, status
  - Filters by: check type category, notification level, date range, status
  - Useful for auditing that notifications are working correctly

---

### Phase 8: Validation

- [ ] EN8.1 Run `npm run build` — verify no SSR/import errors
- [ ] EN8.2 Run `npm run validate` — type-check + lint + format
- [ ] EN8.3 Test cron job endpoint manually with Bearer token
- [ ] EN8.4 Verify email delivery via Resend dashboard
