# Admin Pilot Page — Code Review Fixes

Source: `/code-review xhigh`, 2026-05-22. 15 correctness findings + UX recommendations.
Status: **complete** — see Review section.

## Critical

- [x] #1 RBAC casing mismatch — `UserRole` enum aligned to lowercase DB values
      (`an_users.role` is `admin`/`manager`, verified). `getUserRole` also
      `.toLowerCase()`-normalizes defensively
      (`lib/middleware/authorization-middleware.ts`)
- [x] #2 `requireRole` admin-session path now verifies `adminSession.user.role`
      against the required roles instead of blanket-authorizing
      (`authorization-middleware.ts`)

## High

- [x] #3 `DataTable` now sorts the full dataset before paginating
      (`components/ui/data-table.tsx`)

## Medium

- [x] #4 `DataTable` sort uses a numeric-aware `compareValues` comparator
      (`data-table.tsx`)
- [x] #5 `fetchPilotDetails(silent)` — cert-save refresh no longer blanks the
      detail page to a spinner (`app/dashboard/pilots/[id]/page.tsx`)
- [x] #6 `createPilot` now writes `captain_qualifications`; added to
      `PilotFormData` (`lib/services/pilot-service.ts`).
      NOTE: `createPilotWithCertifications` (RPC path) still omits it — needs a
      Postgres-function change, deferred (see Remaining)
- [x] #7 `RetirementInformationCard` `currentAge` now month/day-adjusted
      (`components/pilots/retirement-information-card.tsx`)

## Low

- [x] #8 `careerProgress` guarded against zero/negative `totalCareerYears`
- [x] #9 `PilotDetailTabs` re-syncs `certifications` from the prop via `useEffect`
- [x] #10 404 now surfaces "Pilot not found" from the response body
- [x] #11 Deleted dead `lib/hooks/use-optimistic-pilot.ts`
- [x] #12 Cert tab mount effect keyed on `[pilot.id]`
      (`components/pilots/pilot-certifications-tab.tsx`)
- [x] #13 Leap-day retirement date clamped (`lib/utils/retirement-utils.ts`)
- [x] #14 Age validation month/day-adjusted (`lib/validations/pilot-validation.ts`)
- [x] #15 Initials deref guarded (`pilot-card.tsx`, `pilot-profile-header.tsx`)

## UX quick wins

- [x] Deleted dead `components/pilots/premium-pilot-card.tsx`
- [x] Fixed broken Tailwind class in `pilot-rank-group.tsx`
- [x] Emoji status icons → lucide (`retirement-countdown-badge.tsx`)
- [x] `pilot-rank-group.tsx` delete error: native `alert()` → `toast()`
      (kept the existing confirmation `Dialog`)
- [x] Detail-tabs "attention" badge turns red when `expired > 0`

## Remaining (recommendation only — needs maintainer decision)

- `createPilotWithCertifications` RPC: pass `captain_qualifications` through the
  `create_pilot_with_certifications` Postgres function
- `pilot-rank-group.tsx`: full migration of the hand-rolled `Dialog` to
  `useConfirm()` (consistency with the detail page)
- Surface certification status in card + table views; standardize columns across
  the 3 list views
- Persist `viewMode` + filters in URL via `nuqs`
- Loading skeletons for `[id]` and `[id]/edit`
- Mobile touch targets / row-action dropdown
- Form validation `mode: onTouched` + edit-form error summary

## Review

All 15 correctness findings + 5 UX quick wins applied across 13 files;
2 dead files deleted.

**Files changed**

- `lib/middleware/authorization-middleware.ts` — #1, #2
- `components/ui/data-table.tsx` — #3, #4
- `lib/services/pilot-service.ts` — #6
- `app/dashboard/pilots/[id]/page.tsx` — #5, #10
- `components/pilots/retirement-information-card.tsx` — #7, #8
- `components/pilots/pilot-detail-tabs.tsx` — #9 + attention-badge colour
- `app/.../pilot-certifications-tab.tsx` — #12
- `lib/utils/retirement-utils.ts` — #13
- `lib/validations/pilot-validation.ts` — #14
- `components/pilots/pilot-card.tsx` — #15
- `components/pilots/pilot-profile-header.tsx` — #15
- `components/pilots/pilot-rank-group.tsx` — broken class, alert→toast
- `components/pilots/retirement-countdown-badge.tsx` — emoji→lucide
- DELETED `lib/hooks/use-optimistic-pilot.ts` (#11)
- DELETED `components/pilots/premium-pilot-card.tsx` (dead)

**Verification**

- `tsc --noEmit`: clean (2 pre-existing env artifacts unrelated —
  `aria-query 2` / `uuid 2`, macOS-duplicated `@types` dirs)
- ESLint: clean on all 13 changed files
- Prettier: clean on all 13 changed files
- Full `next build` / E2E left to Vercel CI (local build environment unreliable)

**Highest-impact note**

#1 + #2 are app-wide (authorization middleware governs ~15 API routes, not just
pilots). The casing fix and the admin-session role check must ship together —
they were verified against the live DB (`an_users.role` is lowercase).
