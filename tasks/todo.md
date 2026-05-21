# Admin Dashboard — Improvements (2026-05-22)

User-approved fix of all review findings. Batched; build-verify after each batch.

## Batch A — Critical: dashboard lies on data-layer failure

- [x] A1. New `components/dashboard/data-degraded-banner.tsx` — amber warning card, prop `reason?`
- [x] A2. `fleet-insights-widget.tsx` — log the swallowed error; check `metrics.degraded`; render banner when degraded
- [x] A3. `todays-priorities.tsx` — log the swallowed error; render error state (not false "All clear") on failure

## Batch B — Admin page hardening

- [x] B1. Delete orphan `app/dashboard/admin/page-improved.tsx` (422 lines, zero imports)
- [x] B2. `admin/page.tsx` — `Promise.allSettled` + per-call fallbacks (one failure no longer kills page)
- [x] B3. `admin/page.tsx` — wire System Status card to live `getCacheHealth()` (was hardcoded "Operational")
- [x] B4. `admin/page.tsx` — empty-state rows for users / check-types / contract-types tables
- [x] B5. `admin/page.tsx` — sort check types by `check_code` before `.slice(0, 10)`
- [x] B6. `admin/page.tsx` — table a11y: `scope="col"` on `<th>`, `sr-only` `<caption>`

## Batch C — Metric cards clickable

- [x] C1. `fleet-insights-widget.tsx` — wrap each MetricCard in `<Link>` (drill-down to pilots / certifications / requests)

## Batch D — Comment cleanup

- [x] D1. Removed "Video Buddy" external-product reference from 6 dashboard component comments

## Notes

- Finding #8 (two parallel dashboards) — resolved by B1 removing the abandoned-redesign file.
  Merging `/dashboard/admin` into `/dashboard` is a design decision, out of scope.

## Review

All 4 batches complete. Verification:

- ESLint: clean on all 9 changed files
- Prettier: clean (fleet-insights-widget auto-formatted)
- `tsc --noEmit`: no errors in changed files (2 pre-existing env artifacts unrelated:
  `aria-query 2` / `uuid 2` — macOS-duplicated `@types` dirs in node_modules)

Files changed:
- NEW   components/dashboard/data-degraded-banner.tsx
- EDIT  components/dashboard/fleet-insights-widget.tsx  (A2 + C1)
- EDIT  components/dashboard/todays-priorities.tsx       (A3 + D1)
- EDIT  app/dashboard/admin/page.tsx                     (B2-B6)
- DEL   app/dashboard/admin/page-improved.tsx            (B1)
- EDIT  5 widget files — comment-only "Video Buddy" removal (D1)

Pre-existing issue discovered (NOT fixed — out of scope):
- `/dashboard/certifications` ignores URL query params (`statusFilter` is local
  `useState('all')`, never reads `?filter=` or `?tab=`). The existing
  `todays-priorities` widget already links to `?filter=expiring`; the new
  Expiring metric card matches that convention. Links navigate correctly but
  the filter does not auto-apply. Worth a follow-up: wire the certifications
  page filter to `nuqs`/searchParams.
