# Comprehensive Review Remediation — 2026-05-08

Source: 6 parallel agent reviews (security, frontend, services, silent failures, types, tests).

Workflow rules: PLAN FIRST → minimal changes → no laziness → root causes. Batches of 5-8 files, lint between batches.

## Plan A — Auth/Session Integrity (P0)

- [ ] A1. Restore Next.js middleware: rename `proxy.ts` → `middleware.ts` and align export name
- [ ] A2. Switch `proxy.ts`/`middleware.ts` session lookups to service-role / admin client (not anon)
- [ ] A3. Fix `admin-auth-helper.ts` to capture & log Supabase errors (don't swallow as "unauthenticated")
- [ ] A4. Fix `redis-session-service.destroyRedisSession` and `destroyAllUserSessions` to surface failures
- [ ] A5. Replace `console.error` swallowing in `app/api/auth/{logout,signout}/route.ts` with structured logging + correct status
- [ ] A6. Add auth check to `app/api/deadline-alerts/route.ts`
- [ ] A7. Fix IDOR in `/api/portal/feedback/[id]/comments` (deny when `pilot.pilot_id` is null)
- [ ] A8. Fix unawaited `params` in `app/api/roster-reports/[period]/email/route.ts`
- [ ] A9. Decision + fix for `auth-service.ts` orphan: revert `/api/auth/{login,change-password,session}` to use `admin-auth-service` and remove orphan, OR confirm `users` table + regen types
- [ ] A10. Add error checks to lockout-counter writes (`auth-service.ts:140-181`) — only if A9 keeps the file
- [ ] A11. `verifyFeedbackOwnership`: stop conflating DB error with "not owner"
- [ ] A12. `verifyPilotSession` use `logError` (not `console.error`)

## Plan B — Data Integrity & Cache (P0/P1)

- [ ] B1. `dashboard-service-v4`: stop returning `complianceRate: 100` on materialized-view failure; surface degraded state
- [ ] B2. `app/api/sidebar-badges`: inspect each query's `.error`, don't silently zero badges
- [ ] B3. `app/api/renewal-planning/email`: fail (or banner) when fewer than all periods load
- [ ] B4. `app/api/renewal-planning/generate`: don't delete-then-fail without recovery signal
- [ ] B5. Cache invalidation: route `certification-service` and `unified-request-service` writes through `cache-invalidation-helper`
- [ ] B6. Sanitize raw `error.message` leaks in `app/api/reports/roster-period/[code]/route.ts:117`, `app/api/roster-reports/[period]/email/route.ts:322`
- [ ] B7. Strip setup-hint leak in `app/api/renewal-planning/email/route.ts:499-512`

## Plan C — Service-Layer Hygiene (P1/P2)

- [ ] C1. Move `app/api/sidebar-badges` direct queries into a service
- [ ] C2. Move `app/api/roster-reports/route.ts` direct query into `roster-report-service`
- [ ] C3. Move `app/api/renewal-planning/email/route.ts` capacity query into `certification-renewal-planning-service`
- [ ] C4. Replace local `interface ServiceResponse<T>` shadows in `admin-auth-service`, `pilot-portal-service`, `unified-request-service` with canonical import
- [ ] C5. Extract shared token-fallback helper used by `session-service` and `admin-auth-service` into `redis-session-service`
- [ ] C6. Parallelize bcrypt history loop in `password-validation-service.ts:350`
- [ ] C7. Batch year-existence + insert in `roster-period-service.ts:369`

## Plan D — Type System Pass (P2)

- [x] D1. Added `StrictServiceResponse<T>` discriminated union + closed `ServiceErrorCode` (additive; legacy interface retained to not break ~50 callers)
- [x] D2. Added `TypedPilotRequest` discriminated-union view + `narrowPilotRequest()` helper (additive lens; legacy `PilotRequest` retained); also added `roster_periods_spanned?: string[]` to base type and stripped `(request as any).roster_periods_spanned` casts in 4 places
- [x] D3. Centralized `WorkflowStatus`/`WorkflowStatusEnum` to `lib/types/workflow-status.ts`; updated 4 schemas to derive from canonical
- [x] D4. Branded `RosterPeriodCode` with regex-validated constructors (`asRosterPeriodCode`, `RosterPeriodCodeSchema`) — additive; future code can opt in
- [x] D5. (re-numbered to D6 in code) Replaced ServiceResponse shadows in 3 services in Plan C
- [x] D6. Centralized certification color logic: `formatExpiryDate` now delegates to `getCertificationStatus` (was a parallel re-implementation)
- [ ] D-extra. Broader `as any` cleanup — PARTIALLY DONE (4 cast sites for `roster_periods_spanned` removed). Remaining `as any` clusters in `redis-session-service` and `auth-service` are blocked on the `users` table decision (`npm run db:types`)

## Plan E — Frontend Modernization (P1/P3)

- [x] E1. Delete `components/ui/success-celebration.tsx` (banned AI-slop, unused)
- [x] E2. Replace 3 `window.alert()` calls with `sonner` toasts
- [x] E3. Replace inline emoji decor (🎯, 📆, ✅, ❌) with lucide icons in 3 files
- [x] E4. Removed indefinite SVG `<animate>` pulse on roster gauge; theme-token track stroke
- [x] E5. Add `useDebouncedValue` hook; replace hand-rolled debounce in portal-users-table
- [x] E6. Both analytics pages now share a single `useAnalytics()` TanStack Query hook with one canonical `AnalyticsData` type
- [x] E7. Migrate `professional-header.tsx` notification fetches to TanStack Query
- [x] E8. `portal-users-table.tsx` migrated to TanStack Query (`keepPreviousData` for pagination continuity)
- [x] E9. Three duplicate forms (`components/portal/{leave,flight}-request-form.tsx`, `components/forms/leave-request-form.tsx`) deleted; canonical default-export forms in `components/pilot/*` are now sole source
- [x] E10. Sonner consolidation: `useToast` hook now adapts to sonner under the hood — all 36 callers keep their existing API but emit through sonner; `<Toaster />` swapped to sonner in `app/layout.tsx`
- [x] E11. Both header dropdowns replaced with Radix `<Popover>`; manual `mousedown` and Escape-key handlers removed (Radix handles outside-click, ARIA, focus trap)
- [x] E12. Render-cap safety net (200 rows + truncation banner) on `requests-table.tsx` and `leave-bid-review-table.tsx`; full virtualization deferred (semantic-table refactor is days-of-UI-work)
- [x] E13. Delete `flight-request-report-form.tsx.backup` (and 2 other `.backup` files)
- [x] E14. Strip permanent `willChange` styles in `professional-header.tsx`

## Plan F — Critical-Path Unit Tests (P4)

- [ ] F1. `certification-status` boundary table (days = -1, 0, 1, 29, 30, 31, 89, 90, 91)
- [ ] F2. Roster anchor math against RP13/2025 = 2025-11-08 + cross-year boundary
- [ ] F3. Leave-eligibility rank-separated fixtures (11C/9FO, 9C/11FO, 10/10, seniority tie-break)

## Execution order

1. Plan A (security foundation)
2. Plan B (data integrity)
3. Plan C (service hygiene; pre-req for D)
4. Plan F (tests — pure functions, no infra; high leverage)
5. Plan D (types — touches many files; do after services stable)
6. Plan E (frontend — independent of backend; can run last)
