# Fleet Management V2 — Comprehensive Upgrade Prompt

**Author**: Maurice Rondeau
**Generated**: February 2026
**Based on**: Deep web research across architecture, design systems, themes, performance, and DX best practices (2025-2026)

---

## Overview

Upgrade the Fleet Management V2 Next.js application to align with 2025-2026 best practices across **architecture**, **design system**, **color theme**, **typography**, **navigation**, **animation**, **accessibility**, **performance**, and **developer experience**. Each phase is independent and shippable — execute them in order for maximum stability, but any phase can be deferred.

---

## Agent Team Orchestration (MANDATORY)

**Every phase MUST use agent teams.** Use `TeamCreate` to spawn specialized agents that work in parallel. This is not optional — it's the standard workflow for this project.

### Team Structure Per Phase

For each phase, create a team with these roles:

| Agent           | Type                           | Role                                                                                                                                                   |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **researcher**  | `Explore` or `general-purpose` | Deep-dive the codebase to find ALL files affected by this phase. Map dependencies, imports, and usage patterns. Produce a file list with line numbers. |
| **planner**     | `Plan`                         | Take researcher output and create a detailed implementation plan with exact code changes, ordered by dependency. Write plan to `tasks/todo.md`.        |
| **implementer** | `general-purpose`              | Execute the plan. Make all code changes, run `npm run build` after each file group.                                                                    |
| **reviewer**    | `feature-dev:code-reviewer`    | Review all changes for bugs, type safety, accessibility, and adherence to project conventions in CLAUDE.md.                                            |

### Team Workflow Pattern

```
1. TeamCreate → "phase-N-{name}"
2. Spawn researcher agent → explores codebase for phase scope
3. Spawn planner agent → creates todo.md plan from research
4. GET USER APPROVAL on the plan
5. Spawn implementer agent → executes plan
6. Spawn reviewer agent → reviews all changes
7. Run `npm run build` to validate
8. Mark phase complete, clean up team
```

### Parallel Agent Spawning

Within each phase, launch agents in parallel when their work is independent:

```
Phase 2 (Color System) example:
├── researcher-colors → Find all color token usage across components
├── researcher-gradients → Find all gradient usage
├── researcher-status → Find all status/semantic color usage
└── Wait for all three, then planner combines results
```

### Cross-Phase Dependencies

Phases 1-3 have no cross-dependencies — run their teams in parallel for maximum speed:

```
Team: phase-1-foundation ──┐
Team: phase-2-colors ──────┤── All run simultaneously
Team: phase-3-typography ──┘
                           │
                           ▼
Team: phase-4-architecture ── Depends on Phase 1 (nuqs installed)
Team: phase-5-navigation ─── Can run parallel with Phase 4
Team: phase-6-animation ──── Can run parallel with Phase 4
                           │
                           ▼
Team: phase-7-accessibility ── Depends on Phase 2 (new colors to audit)
Team: phase-8-performance ─── Depends on Phase 4 (new architecture to measure)
Team: phase-9-dx ──────────── Independent, run anytime
```

### Example: Phase 2 Team Creation

```
TeamCreate: "phase-2-colors"
  Description: "Upgrade color system to warm aviation professional palette"

Task → researcher (Explore agent):
  "Search the entire codebase for:
   1. All CSS custom property definitions in globals.css
   2. All places where color tokens are used (--primary, --accent, etc.)
   3. All hardcoded color values (hex, rgb, oklch, hsl)
   4. All gradient definitions
   5. All status/semantic color usage
   6. All Tailwind color class usage (bg-primary, text-muted, etc.)
   Report exact file paths and line numbers."

Task → planner (Plan agent):
  "Based on researcher output, create a plan to:
   1. Update all CSS custom property values in globals.css
   2. Identify any hardcoded colors that need updating
   3. Verify contrast ratios meet WCAG 2.2 AA
   4. List all files that need testing after changes
   Write plan to tasks/todo.md"

→ GET USER APPROVAL

Task → implementer (general-purpose agent):
  "Execute the color system plan. Update globals.css tokens.
   Fix any hardcoded colors found by researcher.
   Run npm run build after changes."

Task → reviewer (code-reviewer agent):
  "Review all color changes for:
   - WCAG 2.2 contrast compliance
   - Consistent token usage (no hardcoded values introduced)
   - Both light and dark mode coverage
   - Status colors still semantically clear"
```

---

## Phase 1: Foundation — Packages & Configuration

### 1.1 Install New Dependencies

```bash
npm install nuqs @vercel/speed-insights
```

- **`nuqs`** — Type-safe URL search params (replaces manual `useSearchParams` usage for bookmarkable/shareable filter state)
- **`@vercel/speed-insights`** — Real-time Core Web Vitals monitoring in Vercel dashboard

### 1.2 Integrate Vercel Speed Insights

**File**: `app/layout.tsx`

Add `<SpeedInsights />` inside the `<Providers>` wrapper, after `<Toaster />`:

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

// Inside RootLayout, after <Toaster />:
;<SpeedInsights />
```

### 1.3 Change Default Theme to System

**File**: `app/providers.tsx`

Change `defaultTheme` from `"dark"` to `"system"` so users get their OS preference on first visit. The three-way toggle (Light / Dark / System) already works via `enableSystem`:

```tsx
// Before:
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>

// After:
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
```

### 1.4 Audit and Eliminate Internal Barrel Files

Barrel files (`index.ts` that re-export from siblings) inside `lib/`, `components/`, and `hooks/` directories cause Webpack to bundle entire directories when only one export is needed. This can reduce module count by up to 68%.

**Action**:

1. Search for all `index.ts` and `index.tsx` files inside `lib/`, `components/`, and `hooks/`
2. For each barrel file, check if it only re-exports from siblings
3. Update all import paths to point directly to the source file
4. Delete the barrel file
5. Keep `components/ui/index.ts` if it exists — shadcn/ui barrel files are handled by `optimizePackageImports`

**Example**:

```typescript
// Before (importing from barrel):
import { getPilots, getPilotById } from '@/lib/services'

// After (direct import):
import { getPilots, getPilotById } from '@/lib/services/pilot-service'
```

### 1.5 Add Dynamic Imports for Heavy Components

**Files**: Any page that imports calendar, chart, PDF viewer, or rich text editor components.

Wrap heavy client components with `next/dynamic`:

```tsx
import dynamic from 'next/dynamic'

const RosterCalendar = dynamic(
  () => import('@/components/roster/roster-calendar').then((m) => m.RosterCalendar),
  {
    loading: () => <div className="bg-muted animate-shimmer h-64 rounded-xl" />,
    ssr: false, // Calendar/chart libraries often don't SSR well
  }
)
```

**Candidates for dynamic import** (any component using these libraries):

- `recharts` / chart components
- `react-big-calendar` or similar calendar views
- `@react-pdf` / PDF viewer components
- `@dnd-kit` drag-and-drop components (already tree-shaken via `optimizePackageImports`, but complex DnD views can still benefit)
- Any component > 50KB gzipped

---

## Phase 2: Color System — Warm Aviation Professional Palette

### 2.1 Design Philosophy

Shift from the current **cold slate/indigo** palette to a **warm neutral + deep navy** palette that conveys trust, professionalism, and aviation heritage. The palette is inspired by Linear, Vercel, and airline operations dashboards.

### 2.2 Color Token Updates

**File**: `app/globals.css`

Replace the current color token values. Keep the same CSS custom property names so no component changes are needed — only the values change.

**Dark Mode (default — `:root` or `@theme`)**:

| Token                  | Current           | New                      | Rationale                           |
| ---------------------- | ----------------- | ------------------------ | ----------------------------------- |
| `--background`         | Stone 950 variant | `oklch(0.145 0.005 285)` | Warm dark charcoal (not pure black) |
| `--foreground`         | Stone 50 variant  | `oklch(0.96 0.005 80)`   | Warm off-white (not blue-tinted)    |
| `--card`               | Stone 900 variant | `oklch(0.185 0.008 270)` | Slightly elevated warm surface      |
| `--primary`            | Indigo 400        | `oklch(0.55 0.12 250)`   | Deep navy blue — aviation trust     |
| `--primary-foreground` | White             | `oklch(0.98 0.005 80)`   | Warm white on navy                  |
| `--accent`             | Rose/pink variant | `oklch(0.70 0.14 195)`   | Sky/teal accent — aviation sky      |
| `--muted`              | Stone 800 variant | `oklch(0.22 0.008 260)`  | Warm muted surface                  |
| `--muted-foreground`   | Stone 400 variant | `oklch(0.60 0.01 80)`    | Warm gray text                      |
| `--border`             | Stone 800 variant | `oklch(0.28 0.008 260)`  | Subtle warm border                  |
| `--ring`               | Primary variant   | `oklch(0.55 0.12 250)`   | Matches primary                     |

**Light Mode (`.light` class)**:

| Token                | New                     | Rationale                                  |
| -------------------- | ----------------------- | ------------------------------------------ |
| `--background`       | `oklch(0.985 0.003 80)` | Warm cream white                           |
| `--foreground`       | `oklch(0.15 0.01 260)`  | Deep warm charcoal                         |
| `--card`             | `oklch(0.995 0.002 80)` | Pure warm white                            |
| `--primary`          | `oklch(0.45 0.15 250)`  | Deeper navy for light mode contrast        |
| `--accent`           | `oklch(0.60 0.16 195)`  | Slightly darker teal for light backgrounds |
| `--muted`            | `oklch(0.94 0.005 80)`  | Warm light gray                            |
| `--muted-foreground` | `oklch(0.45 0.01 80)`   | Warm medium gray                           |
| `--border`           | `oklch(0.88 0.005 80)`  | Warm light border                          |

**Semantic Status Colors** (keep existing structure, refine values):

```css
/* Status — these should remain vivid and accessible */
--status-success: oklch(0.7 0.18 145); /* Green — certified, approved */
--status-warning: oklch(0.8 0.16 85); /* Amber — expiring, attention */
--status-destructive: oklch(0.6 0.22 25); /* Red — expired, denied */
--status-info: oklch(0.65 0.15 250); /* Blue — informational */
```

### 2.3 Gradient Refinement

Update gradients from rose/pink to navy/teal aviation theme:

```css
--gradient-primary: linear-gradient(135deg, oklch(0.55 0.12 250), oklch(0.6 0.14 220));
--gradient-accent: linear-gradient(135deg, oklch(0.7 0.14 195), oklch(0.65 0.12 220));
```

### 2.4 Remove Glassmorphism Tokens

Glassmorphism (backdrop-blur + transparency) is falling out of favor for data-dense dashboards due to readability concerns. Remove or simplify:

```css
/* Remove these if they exist: */
/* --glass-bg, --glass-border, backdrop-blur utilities on data cards */

/* Replace with solid elevated surfaces: */
--surface-elevated: oklch(0.2 0.008 270); /* Dark mode */
--surface-elevated: oklch(0.98 0.003 80); /* Light mode */
```

---

## Phase 3: Typography — Data-Dense Optimization

### 3.1 Base Font Size

**File**: `app/globals.css`

Set 14px as the base for the dashboard layout. This is industry standard for data-dense SaaS (Linear, Vercel, Datadog all use 13-14px).

```css
/* Add to the dashboard layout scope, NOT globally */
.dashboard-layout {
  font-size: 14px;
  line-height: 1.5;
}
```

**File**: `app/dashboard/layout.tsx`

Add the `dashboard-layout` class to the dashboard wrapper:

```tsx
<main className="dashboard-layout ...existing-classes">{children}</main>
```

### 3.2 Typography Scale

Ensure headings and body text follow a harmonious scale:

```css
/* Dashboard typography scale (14px base) */
.dashboard-layout {
  --text-xs: 0.75rem; /* 10.5px — labels, badges */
  --text-sm: 0.857rem; /* 12px — secondary text, captions */
  --text-base: 1rem; /* 14px — body text */
  --text-lg: 1.143rem; /* 16px — subheadings */
  --text-xl: 1.286rem; /* 18px — section headings */
  --text-2xl: 1.571rem; /* 22px — page titles */
  --text-3xl: 2rem; /* 28px — hero numbers/metrics */
}
```

### 3.3 Font Stack Confirmation

Current fonts are correct — keep them:

- **Geist Sans** — Body text, UI elements (already set as `--font-sans`)
- **Geist Mono** — Code, metrics, tabular data (already set as `--font-mono`)
- **Space Grotesk** — Display headlines, hero numbers (already set as `--font-space-grotesk`)

---

## Phase 4: Architecture — RSC-First Data Fetching

### 4.1 Dashboard Page-Level Data Fetching

The current pattern has each widget (`PersonalizedGreeting`, `FleetInsightsWidget`, etc.) fetching its own data internally. This creates sequential waterfalls as each widget independently hits the database/cache.

**Upgrade pattern**: Initiate ALL data fetches at the page level in parallel using `Promise.all`, then pass data down to widgets. Suspense boundaries around each widget still provide independent streaming.

**File**: `app/dashboard/page.tsx`

```tsx
import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/skeletons'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { dashboardMetadata } from '@/lib/utils/metadata'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

// Server-side data fetching functions
import { getDashboardMetrics } from '@/lib/services/dashboard-service-v4'
import { getCurrentUser } from '@/lib/services/user-service'
import { getPendingApprovals } from '@/lib/services/unified-request-service'
import { getUrgentAlerts } from '@/lib/services/alert-service'

export const metadata = dashboardMetadata.home

export default async function DashboardPage() {
  // Kick off ALL data fetches in parallel — none waits for another
  const dataPromise = Promise.all([
    getCurrentUser(),
    getDashboardMetrics(),
    getPendingApprovals(),
    getUrgentAlerts(),
  ])

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden" style={{ minWidth: 0 }}>
      <Breadcrumb />

      {/* Pass the promise — DashboardContent unwraps it */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent dataPromise={dataPromise} />
      </Suspense>
    </div>
  )
}
```

**File**: `components/dashboard/dashboard-content.tsx`

```tsx
// Receive and unwrap the parallel data promise
export async function DashboardContent({
  dataPromise,
}: {
  dataPromise: Promise<[User, DashboardMetrics, PendingApprovals, UrgentAlerts]>
}) {
  const [user, metrics, approvals, alerts] = await dataPromise

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* Zone 1: Pass pre-fetched data to widgets */}
      <section aria-label="Greeting and fleet overview" className="space-y-4">
        <PersonalizedGreeting user={user} />
        <FleetInsightsWidget metrics={metrics} />
      </section>

      {/* Zone 2: Widgets that need their own data can still use Suspense */}
      <ErrorBoundary fallback={<DashboardErrorFallback section="roster" />}>
        <Suspense fallback={<div className="bg-muted animate-shimmer h-72 rounded-xl" />}>
          <CompactRosterDisplay />
        </Suspense>
      </ErrorBoundary>

      {/* ...remaining zones with pre-fetched or independently-suspended data */}
    </div>
  )
}
```

### 4.2 URL-Based Filter State with `nuqs`

For pages with filters (pilots list, certifications, requests), replace manual `useSearchParams` with `nuqs` for type-safe, bookmarkable URL state:

```tsx
'use client'

import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'

export function PilotFilters() {
  const [rank, setRank] = useQueryState('rank', parseAsString.withDefault('all'))
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))

  // URL automatically updates: /dashboard/pilots?rank=captain&page=2&search=smith
  // Bookmarkable, shareable, back-button works
}
```

**Priority pages for `nuqs` migration**:

1. `/dashboard/pilots` — rank, status, search, page
2. `/dashboard/certifications` — tab, status, expiry filter
3. `/dashboard/requests` — tab, status, date range
4. `/dashboard/reports` — report type, date range

### 4.3 Tag-Based Redis Cache Invalidation

**File**: `lib/services/redis-cache-service.ts`

Enhance the existing Redis cache with tag-based invalidation so mutations can surgically clear related caches:

```typescript
// Cache with tags
await redisCache.set('dashboard:metrics', data, {
  ttl: 300,
  tags: ['dashboard', 'pilots', 'certifications'],
})

// When a pilot is updated, invalidate all caches tagged with 'pilots'
await redisCache.invalidateByTag('pilots')
// This clears: dashboard:metrics, pilot:list, pilot:123, etc.
```

---

## Phase 5: Navigation — Command Palette Completion

### 5.1 Complete the Cmd+K Command Palette

The `cmdk` package is already installed. Build a comprehensive command palette that provides cross-entity search:

**Features**:

- Search across pilots, certifications, requests, reports
- Quick actions (new request, new pilot, generate report)
- Recent items (last 5 viewed pilots/requests)
- Navigation shortcuts (jump to any page)
- Keyboard-first (arrow keys, Enter to select, Esc to close)

**File**: Create `components/layout/command-palette.tsx`

```tsx
'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command Menu">
      <Command.Input placeholder="Search pilots, certifications, actions..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Quick Actions">
          <Command.Item onSelect={() => router.push('/dashboard/requests?action=new')}>
            New Leave Request
          </Command.Item>
          <Command.Item onSelect={() => router.push('/dashboard/pilots?action=add')}>
            Add Pilot
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => router.push('/dashboard')}>Dashboard</Command.Item>
          <Command.Item onSelect={() => router.push('/dashboard/pilots')}>Pilots</Command.Item>
          <Command.Item onSelect={() => router.push('/dashboard/certifications')}>
            Certifications
          </Command.Item>
          <Command.Item onSelect={() => router.push('/dashboard/requests')}>Requests</Command.Item>
          <Command.Item onSelect={() => router.push('/dashboard/reports')}>Reports</Command.Item>
        </Command.Group>

        {/* Dynamic search results from API */}
        <Command.Group heading="Search Results">
          {/* Populate via API call with debounced search */}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
```

Add to `app/dashboard/layout.tsx` inside the layout wrapper.

---

## Phase 6: Animation — Purposeful Minimalism

### 6.1 Animation Principles

- **Duration**: 150ms for micro-interactions (hover, focus), 200-300ms for layout changes, 400ms max for page transitions
- **Easing**: Use `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for morphs
- **Respect `prefers-reduced-motion`**: The `use-reduced-motion` hook already exists — ensure ALL Framer Motion animations check it

### 6.2 Framer Motion Defaults

**File**: Create `lib/utils/motion-config.ts`

```typescript
import type { Transition, Variants } from 'framer-motion'

export const defaultTransition: Transition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for smooth deceleration
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: defaultTransition },
  exit: { opacity: 0, transition: { ...defaultTransition, duration: 0.15 } },
}

export const slideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: defaultTransition },
  exit: { opacity: 0, y: -4, transition: { ...defaultTransition, duration: 0.15 } },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: defaultTransition },
  exit: { opacity: 0, scale: 0.96, transition: { ...defaultTransition, duration: 0.15 } },
}
```

### 6.3 CSS Transition Defaults

**File**: `app/globals.css`

```css
/* Standardize all CSS transitions */
:root {
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Phase 7: Accessibility — WCAG 2.2 Level AA Compliance

### 7.1 Audit Checklist

The project already has strong a11y foundations (skip links, announcer, route focus manager, `axe-core` in dev deps). Perform a focused audit on these WCAG 2.2 criteria:

**New in WCAG 2.2**:

- [ ] **2.4.11 Focus Not Obscured (Minimum)** — Ensure focused elements aren't hidden behind sticky headers/sidebars
- [ ] **2.4.12 Focus Not Obscured (Enhanced)** — Focused element fully visible
- [ ] **2.5.7 Dragging Movements** — All drag-and-drop (DnD Kit) must have click/tap alternative
- [ ] **2.5.8 Target Size (Minimum)** — All interactive targets ≥ 24x24px (44x44px preferred)
- [ ] **3.2.6 Consistent Help** — Help link in same location across pages
- [ ] **3.3.7 Redundant Entry** — Don't ask for same info twice in multi-step forms
- [ ] **3.3.8 Accessible Authentication (Minimum)** — No cognitive function tests for login

**Existing WCAG 2.1 to verify**:

- [ ] Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text (test new color palette!)
- [ ] All images have alt text
- [ ] Form inputs have visible labels
- [ ] Error messages are associated with inputs via `aria-describedby`
- [ ] Tables have proper `<th>` with scope attributes
- [ ] Modals trap focus and return focus on close

### 7.2 Automated Testing

```bash
# Run axe-core in Playwright tests
npx playwright test --grep "accessibility"

# Or add to existing tests:
import AxeBuilder from '@axe-core/playwright'

test('dashboard is accessible', async ({ page }) => {
  await page.goto('/dashboard')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

---

## Phase 8: Performance — Core Web Vitals Targets

### 8.1 Targets

| Metric | Target  | Current Likely                   | Action                            |
| ------ | ------- | -------------------------------- | --------------------------------- |
| LCP    | < 2.5s  | ~3-4s (server components + data) | Phase 4 parallel fetching         |
| INP    | < 200ms | Likely OK                        | Monitor with Speed Insights       |
| CLS    | < 0.1   | Likely OK (Suspense skeletons)   | Ensure skeleton sizes match final |
| TTFB   | < 800ms | Depends on Redis cache hits      | Redis warm cache strategy         |
| FCP    | < 1.8s  | Should be fast with streaming    | Shell renders first               |

### 8.2 Bundle Analysis

Run bundle analysis to identify large dependencies:

```bash
ANALYZE=true npm run build
```

**Known optimization targets**:

- `date-fns` — Import only used functions, not the entire library
- `framer-motion` — Already in `optimizePackageImports`
- `lucide-react` — Already in `optimizePackageImports`
- `jspdf` + `jspdf-autotable` — Dynamic import only on report pages
- `recharts` — Dynamic import only on chart views

### 8.3 Image Optimization

Current `next.config.js` already has WebP/AVIF formats and proper device sizes. Verify:

- [ ] All `<img>` tags use `next/image`
- [ ] Hero/above-fold images have `priority` prop
- [ ] Icons use `lucide-react` (SVG) not raster images

---

## Phase 9: Developer Experience Enhancements

### 9.1 React Compiler (Optional — Evaluate)

React Compiler is stable in Next.js 16. It auto-memoizes components, eliminating manual `useMemo`/`useCallback`/`React.memo`:

```js
// next.config.js
const nextConfig = {
  experimental: {
    reactCompiler: true,
    // ...existing experimental config
  },
}
```

**Caution**: Test thoroughly before enabling. Remove manual memoization gradually after confirming compiler handles it.

### 9.2 Storybook Component Documentation

Ensure all new dashboard widgets have Storybook stories:

```bash
npm run storybook  # http://localhost:6006
```

**Priority**: Create stories for the 10 dashboard zone widgets to enable isolated development and visual regression testing.

---

## Phase 10: Implementation Order & Risk Assessment

### Recommended Order

| Phase                            | Risk   | Effort | Impact            | Ship Independently?    |
| -------------------------------- | ------ | ------ | ----------------- | ---------------------- |
| 1. Foundation (packages, config) | Low    | Small  | Medium            | Yes                    |
| 2. Color System                  | Medium | Medium | High (visual)     | Yes                    |
| 3. Typography                    | Low    | Small  | Medium            | Yes                    |
| 4. RSC Data Fetching             | High   | Large  | High (perf)       | Yes — test extensively |
| 5. Command Palette               | Low    | Medium | Medium (UX)       | Yes                    |
| 6. Animation                     | Low    | Small  | Low               | Yes                    |
| 7. Accessibility                 | Medium | Medium | High (compliance) | Yes                    |
| 8. Performance                   | Medium | Medium | High (perf)       | Yes                    |
| 9. DX Enhancements               | Low    | Small  | Medium (DX)       | Yes                    |

### Risk Mitigation

- **Phase 2 (Colors)**: Do a side-by-side comparison before and after. Test in both light and dark mode. Verify all status colors meet contrast requirements.
- **Phase 4 (RSC Architecture)**: This is the highest-risk change. Implement on one page first (dashboard), verify performance improvement, then roll out to other pages.
- **Phase 7 (Accessibility)**: Run automated axe-core tests before and after color changes. Manual keyboard navigation testing on every page.

### Agent Team Execution Plan (Full Breakdown)

Each phase below specifies the exact agents to spawn, their tasks, and parallelization strategy.

#### Wave 1 — Parallel (No Dependencies)

**Team: `phase-1-foundation`**

```
researcher (Explore): Find all barrel index.ts files, all useSearchParams usage, all heavy component imports (recharts, calendar, pdf, dnd-kit)
planner (Plan): Create ordered plan — install packages, integrate SpeedInsights, update providers, eliminate barrels, add dynamic imports
→ USER APPROVAL
implementer (general-purpose): Execute plan, run npm run build after each step
reviewer (code-reviewer): Validate no broken imports, build passes, no regressions
```

**Team: `phase-2-colors`** (parallel with Phase 1)

```
researcher (Explore): Find ALL color token definitions, ALL hardcoded colors, ALL gradient usage, ALL status color usage across entire codebase
researcher-contrast (general-purpose): Calculate contrast ratios for proposed new palette against WCAG 2.2 AA requirements
planner (Plan): Map every token change in globals.css, list any hardcoded values to update, create before/after contrast table
→ USER APPROVAL
implementer (general-purpose): Update globals.css tokens, fix hardcoded colors, update gradients
reviewer (code-reviewer): Verify contrast, both themes, no missed hardcoded values
```

**Team: `phase-3-typography`** (parallel with Phases 1 & 2)

```
researcher (Explore): Find current font-size usage across dashboard, identify typography scale inconsistencies
planner (Plan): Define dashboard-layout class scope, typography scale tokens, affected files
→ USER APPROVAL
implementer (general-purpose): Add dashboard-layout class, update typography tokens
reviewer (code-reviewer): Verify readability, no overflow issues, responsive behavior
```

#### Wave 2 — After Wave 1 Completes

**Team: `phase-4-architecture`** (depends on Phase 1 for nuqs)

```
researcher (Explore): Map ALL data fetching patterns — which widgets fetch their own data, which services they call, what data flows look like for dashboard, pilots, certifications, requests pages
researcher-cache (Explore): Analyze redis-cache-service.ts for current caching strategy, find all cache.set/get calls
planner (Plan): Design page-level Promise.all pattern for dashboard, nuqs migration plan for 4 priority pages, tag-based cache invalidation schema
→ USER APPROVAL
implementer-dashboard (general-purpose): Implement RSC data fetching on dashboard page first
implementer-nuqs (general-purpose): Migrate pilots page to nuqs (parallel with dashboard work)
implementer-cache (general-purpose): Add tag-based invalidation to redis-cache-service
reviewer (code-reviewer): Verify no waterfalls, types correct, cache invalidation works
```

**Team: `phase-5-navigation`** (parallel with Phase 4)

```
researcher (Explore): Find existing cmdk usage, navigation patterns, sidebar structure, keyboard shortcut registrations
planner (Plan): Design command palette with entity search, quick actions, navigation, recent items
→ USER APPROVAL
implementer (general-purpose): Build command-palette.tsx, integrate into dashboard layout, wire up search API
reviewer (code-reviewer): Verify keyboard accessibility, focus management, no z-index conflicts
```

**Team: `phase-6-animation`** (parallel with Phases 4 & 5)

```
researcher (Explore): Find ALL framer-motion usage, ALL CSS transitions, ALL animation classes, check use-reduced-motion coverage
planner (Plan): Standardize transition tokens, create motion-config.ts, list animations missing reduced-motion check
→ USER APPROVAL
implementer (general-purpose): Add motion-config.ts, update globals.css transitions, fix missing reduced-motion checks
reviewer (code-reviewer): Verify reduced-motion fully respected, animations purposeful not decorative
```

#### Wave 3 — After Wave 2 Completes

**Team: `phase-7-accessibility`** (depends on Phase 2 new colors)

```
researcher (Explore): Run axe-core audit on all pages, check WCAG 2.2 new criteria (focus obscured, target size, drag alternatives), find all DnD Kit usage
researcher-contrast (general-purpose): Test new color palette contrast ratios in both themes
planner (Plan): Create prioritized fix list — critical violations first, then AA enhancements
→ USER APPROVAL
implementer (general-purpose): Fix all violations, add axe-core Playwright tests
reviewer (code-reviewer): Verify fixes, re-run axe-core, manual keyboard nav test
```

**Team: `phase-8-performance`** (depends on Phase 4 new architecture)

```
researcher (general-purpose): Run ANALYZE=true npm run build, identify top 10 largest bundles, check all next/image usage, find non-dynamic heavy imports
planner (Plan): Create bundle optimization plan — dynamic imports, tree-shaking, image optimization fixes
→ USER APPROVAL
implementer (general-purpose): Implement dynamic imports, fix image usage, optimize imports
reviewer (code-reviewer): Compare bundle sizes before/after, verify no lazy-loading UX regressions
```

**Team: `phase-9-dx`** (independent — run anytime)

```
researcher (Explore): Check React Compiler compatibility, find manual useMemo/useCallback/React.memo usage, list dashboard widgets missing Storybook stories
planner (Plan): Evaluate React Compiler risk, plan story creation for 10 dashboard widgets
→ USER APPROVAL
implementer (general-purpose): Optionally enable React Compiler, create Storybook stories
reviewer (code-reviewer): Verify Storybook renders, no compiler regressions
```

---

## Files Changed Summary

| File                                         | Phases  | Changes                                       |
| -------------------------------------------- | ------- | --------------------------------------------- |
| `package.json`                               | 1       | Add `nuqs`, `@vercel/speed-insights`          |
| `app/layout.tsx`                             | 1       | Add `<SpeedInsights />`                       |
| `app/providers.tsx`                          | 1       | Change `defaultTheme` to `"system"`           |
| `app/globals.css`                            | 2, 3, 6 | Color tokens, typography scale, transitions   |
| `app/dashboard/page.tsx`                     | 4       | Page-level parallel data fetching             |
| `components/dashboard/dashboard-content.tsx` | 4       | Receive pre-fetched data props                |
| `components/dashboard/*.tsx`                 | 4       | Accept data as props instead of self-fetching |
| `app/dashboard/layout.tsx`                   | 3, 5    | Dashboard font size class, command palette    |
| `components/layout/command-palette.tsx`      | 5       | New file — Cmd+K command palette              |
| `lib/utils/motion-config.ts`                 | 6       | New file — Framer Motion defaults             |
| `lib/services/redis-cache-service.ts`        | 4       | Tag-based cache invalidation                  |
| `next.config.js`                             | 9       | Optional React Compiler                       |
| Multiple pages with filters                  | 4       | Migrate to `nuqs` for URL state               |
| Multiple barrel `index.ts` files             | 1       | Delete after updating imports                 |

---

## Success Criteria

After all phases are complete:

- [ ] Vercel Speed Insights shows LCP < 2.5s on dashboard
- [ ] Bundle size reduced by ≥ 15% (barrel file elimination + dynamic imports)
- [ ] All pages pass axe-core automated accessibility checks
- [ ] Color contrast meets WCAG 2.2 Level AA (4.5:1 for text)
- [ ] Dashboard data loads in parallel (no sequential waterfalls)
- [ ] Cmd+K command palette searches across all entities
- [ ] URL filters are bookmarkable/shareable on pilot/cert/request pages
- [ ] `prefers-reduced-motion` fully respected (zero animations)
- [ ] Theme toggle works as System / Light / Dark
- [ ] All Storybook stories render without errors

---

_This prompt is designed to be executed phase-by-phase. Each phase can be a separate PR for easy review and rollback. Start with Phase 1 (Foundation) and work forward._
