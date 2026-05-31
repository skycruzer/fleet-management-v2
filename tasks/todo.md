# Dashboard Data Accuracy Fixes (2026-05-31)

Audit found the admin dashboard's headline numbers are wrong: materialized-view schema
drift + a stale view + a pending-status logic gap.

## Fix 1 — CRITICAL: realign TS mapping to real view columns (code only)

View `pilot_dashboard_metrics` (v2.0.0) returns `current_certifications`,
`expiring_certifications`, `denied_leave`, `expiring_this_week`, `retirement_due_soon`,
`overdue_retirement`, `leave_this_month`. The mapping read non-existent names
(`valid_certifications`, `expiring_soon_certifications`, `rejected_leave`, `total_expired`,
`total_expiring_30_days`, `pilots_due_retire_2_years`) → `undefined || 0`. Most visible
effect: FleetInsights "Expiring" always rendered 0 (green).

- [ ] Rewrite `types/database-views.ts` `PilotDashboardMetrics` to match the real view
- [ ] Fix mapping in `lib/services/dashboard-service-v4.ts` `fetchDashboardMetricsFromView()`

## Fix 2 — CRITICAL: view counts only PENDING/SUBMITTED as pending leave (DB migration)

App's pending set is `('SUBMITTED','IN_REVIEW')`; all 6 current pending leave requests are
`IN_REVIEW` → view says 0.

- [ ] New migration: redefine view with `pending_leave` including `IN_REVIEW`
- [ ] Apply to production + refresh + verify live numbers

## Fix 3 — HIGH: nothing refreshes the view (26 days stale)

`refresh_dashboard_metrics()` is only called by two manual admin routes; no cron.

- [ ] Add `/api/cron/refresh-dashboard-metrics` (CRON_SECRET-authed, mirrors existing cron)
- [ ] Register it in `vercel.json` crons

## Fix 4 — MEDIUM: "expiring within 7 days" includes already-expired certs (copy)

- [ ] Today's Priorities: relabel to "expired or expiring within 7 days"
- [ ] FleetInsights "Pending" card: relabel to "Pending Leave" (its data is leave-only)

## Out of scope (noted, not changed)

- Fix 5 (LATENT): view's retirement buckets hardcode ages 60/58/55, ignoring configurable
  `pilot_retirement_age`. Not displayed (RetirementForecastCard uses live service).

## Status — COMPLETE (2026-05-31)

- [x] Fix 1: `types/database-views.ts` + `dashboard-service-v4.ts` mapping realigned
- [x] Fix 2: migration `20260531000001_fix_dashboard_pending_leave_in_review.sql` written
      AND applied to production DB (view now v2.1.0)
- [x] Fix 3: refresh piggybacked onto `certification-expiry-alerts` cron (no new Vercel cron)
- [x] Fix 4: Today's Priorities + FleetInsights "Pending Leave" labels corrected

## Verification (done)

- [x] ESLint clean on all 5 changed TS/TSX files
- [x] `tsc --noEmit`: no new errors (only 2 pre-existing macOS @types artifacts)
- [x] Prettier: TS/TSX clean (`prettier --check .` skips .sql — no CI impact)
- [x] Live DB after migration matches a live recompute EXACTLY:
      expired 3=3, expiring 20=20, pending_leave 6=6 (was 0)
- [x] `refresh_dashboard_metrics()` CONCURRENTLY now succeeds (no 55000); last_refreshed advances

## Deploy note

- Production DB already fixed (migration applied via MCP). Code fixes live only on this
  branch — deploy (merge → Vercel) so FleetInsights "Expiring" reads the correct column
  (currently still 0 on old deployed code; "Pending" already reads 6).
- When `npm run db:deploy` next runs, the committed migration re-applies idempotently.
