# Certifications Page — Finish Componentized Migration + Design Polish

## Context

- Live route `app/dashboard/certifications/page.tsx` is an old 777-line inline
  client component — single flat table, no tabs.
- A cleaner componentized version exists but is **orphaned** (nothing imports it):
  `certifications-page-client.tsx` + `certifications-tabs.tsx` (tabs: All /
  Attention / By Category) + `certifications-table` / `attention-required-view` /
  `category-view` / `certification-stat-cards`.
- The route redirect `/dashboard/certifications/expiring → ?tab=attention`
  (`next.config.js:137`) is **broken** — the live page has no tabs and ignores
  `?tab`. The componentized version reads `?tab` via nuqs → migration fixes it.

## Visual thesis

Calm, operations-grade compliance surface — extend the existing Linear-inspired
dashboard language (compact header, restrained tokens, status-colored accents) to
the certifications page. No new design system; consistency plus one honest
interaction layer (stat cards that actually navigate).

## Content plan

Header (h1 + subtitle, Export + Add) → 4 stat cards (Total / Current / Expiring /
Expired) → tabs (All / Attention / By Category) → per-tab content (table /
priority-grouped accordion / category accordion) → certification form dialog.

## Interaction plan

1. Stat card click → routes to the relevant tab (Expired/Expiring → Attention,
   Total/Current → All) via the nuqs `tab` URL param.
2. Stat cards stagger-fade in on mount (~60ms stagger, 8px rise).
3. Tab panel cross-fade on switch. Motion subtle — no celebration.

## Plan

### 1. Wire the migration

- [ ] Rewrite `app/dashboard/certifications/page.tsx` as an async **server**
      component: fetch `getCertificationsUnpaginated()`, derive `stats`
      (count by `status.color` — matches `refreshData()` and the old page) and
      `categories`, render `<CertificationsPageClient />`. Existing `loading.tsx`
      covers the load state.
- [ ] Delete the old 777-line inline client implementation.

### 2. Fix bugs in `certifications-page-client.tsx`

- [ ] Pilots fetch: `pilotsData.data` → `pilotsData.data?.pilots || pilotsData.data || []`
      (`/api/pilots` returns `{ data: { pilots: [] } }`) — current code sets
      `pilots` to an object, breaking the form dialog's pilot select.
- [ ] `Pilot` interface: `employee_number` → `employee_id`.
- [ ] Remove unused `categories` prop (dead — destructured, never used).

### 3. Design polish (Module C — match existing system)

- [ ] Header consistency: `<h2 font-bold>` → `<h1 font-semibold tracking-tight
    lg:text-2xl>` to match `pilots/page.tsx`. Root `space-y-4` → `space-y-6`;
      header/button gaps aligned to siblings.
- [ ] Interactive stat cards: pass `onStatClick` → set nuqs `tab`
      (Expired/Expiring → `attention`, Total/Current → `all`); pass `activeStatus`
      for the ring state. Justifies the card affordance + quick navigation.
- [ ] Subtle motion (Framer Motion, already a dep): stat-cards stagger-fade on
      mount; tab-panel cross-fade on switch.

### 4. Verify

- [ ] `npm run validate` (type-check + lint). Full `npm run build` may hang
      locally — Vercel CI is the source of truth.
- [ ] Visual check: screenshot `/dashboard/certifications`, `?tab=attention`,
      `?tab=category`.

## Review

Status: **implementation complete** — pending visual confirmation by user.

Changed files:

- `app/dashboard/certifications/page.tsx` — now an async server component
  (was a 777-line `'use client'` monolith). Fetches certifications, derives
  stats, renders `<CertificationsPageClient />`.
- `app/dashboard/certifications/certifications-page-client.tsx` — dropped unused
  `categories` prop; fixed pilots fetch and `refreshData()` (both expected the
  wrong response shape — `/api/*` returns `{ data: { pilots|certifications } }`);
  `Pilot.employee_id`; header → `<h1>` matching sibling pages; stat cards wired
  to switch tabs via nuqs `tab` param.
- `components/certifications/certification-stat-cards.tsx` — stagger-fade entrance
  (respects reduced motion); focus-visible ring on now-interactive cards.
- `components/certifications/certifications-tabs.tsx` — tab-panel cross-fade.

Verification:

- `npx eslint` on all 4 files — clean.
- `npx tsc --noEmit` — 0 errors in changed files (2 pre-existing env-only errors:
  `aria-query 2` / `uuid 2` duplicate `@types` dirs — local artifact, not CI).
- Visual: **not completed** — port 3000 is running a different project
  ("Webstore"); a fleet dev server was started on :3001 but `/dashboard/*` is
  auth-gated. User to confirm at `localhost:3001/dashboard/certifications`.

Deviation from plan: `activeStatus` ring NOT passed to stat cards — clicking
navigates (not a 1:1 toggle filter), so a persistent ring would mislead. Cards
get `onStatClick` + hover/focus affordances only.
