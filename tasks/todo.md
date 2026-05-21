# Admin Dashboard — UX/UI Redesign (2026-05-22)

User-approved. Decisions: **two-tier card system** (quiet default, loud band only
for genuine alert states), **light dedup** (remove blatant repeats only).
Branch: `fix/admin-dashboard-degraded-state` (continues PR #50 — files overlap).

## Batch 1 — Primitives (2 new files)

- [x] 1a. `components/dashboard/dashboard-card.tsx` — one card primitive, two-tier
- [x] 1b. `components/dashboard/empty-state.tsx` — shared empty-state

## Batch 2 — Quiet widgets

- [x] 2a. `todays-priorities.tsx` — DashboardCard; dropped always-on roster row
      (light dedup); EmptyState; error state retained
- [x] 2b. `quick-action-cards.tsx` — DashboardCard
- [x] 2c. `roster-calendar-widget.tsx` — DashboardCard + footer action
- [x] 2d. `pending-approvals-widget.tsx` — DashboardCard; fixed silent `catch {}`
      (carryover bug) → log + error state; EmptyState
- [x] 2e. `fleet-insights-widget.tsx` — status color tokens → semantic set

## Batch 3 — Big widgets

- [x] 3a. `compact-roster-display.tsx` — de-loud header; `font-black` → `font-bold`
- [x] 3b. `pilot-requirements-card.tsx` — de-loud header (alert band only when
      understaffed); dynamic badge (was static "CRITICAL"); removed
      `hover:scale-[1.02]` false affordance; semantic color tokens; 4 copy-pasted
      tiles → one `StatTile` component
- [x] 3c. `retirement-forecast-card.tsx` — DashboardCard + EmptyState; semantic
      tokens; 4 list blocks → one `ForecastList` component

## Batch 4 — Admin page

- [x] 4a. `app/dashboard/admin/page.tsx` — raw `<table>` → `components/ui/table`
- [x] 4b. stat cards clickable (Check Types, Certifications — cards with a real home)
- [x] 4c. type scale — `h1` `text-2xl`, `h2` `text-lg` (were both `text-xl`)
- [x] 4d. Suspense streaming — split into 4 independent async section components

## Out of scope (decided)

- Aggressive dedup — user chose light dedup; KPI strip in fleet-insights stays
- CompactRosterDisplay structural split — restyle only (rule 3: simplicity)
- globals.css token cleanup — not touched; only dashboard widgets standardized

## Review

All 4 batches complete. Verification:

- ESLint: clean on all 11 changed files
- Prettier: clean (fleet-insights, retirement-forecast, admin/page auto-formatted)
- `tsc --noEmit`: no errors in changed files (2 pre-existing env artifacts
  unrelated — `aria-query 2` / `uuid 2`, macOS-duplicated `@types` dirs)

Files changed:

- NEW components/dashboard/dashboard-card.tsx
- NEW components/dashboard/empty-state.tsx
- EDIT components/dashboard/todays-priorities.tsx
- EDIT components/dashboard/quick-action-cards.tsx
- EDIT components/dashboard/roster-calendar-widget.tsx
- EDIT components/dashboard/pending-approvals-widget.tsx
- EDIT components/dashboard/fleet-insights-widget.tsx
- EDIT components/dashboard/compact-roster-display.tsx
- EDIT components/dashboard/pilot-requirements-card.tsx
- EDIT components/dashboard/retirement-forecast-card.tsx
- EDIT app/dashboard/admin/page.tsx
