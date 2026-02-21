# Fleet Management V2 — Comprehensive Code Audit Report

**Date**: February 21, 2026
**Auditor**: Claude Code (6-agent parallel review)
**Scope**: Architecture, Security, Database, TypeScript, Components, Performance, Error Handling, Tests, Code Hygiene

---

## Executive Summary

Fleet Management V2 is a **feature-rich, well-architected application** with strong patterns in many areas — the service layer abstraction, dashboard Server Component composition, TanStack Query configuration, and error boundary coverage are all solid. However, the audit uncovered **serious security gaps** that require immediate attention: the root `middleware.ts` file is missing (rendering all middleware-level protections dead code), 5 renewal-planning API routes expose pilot PII without authentication, production credentials are hardcoded in 10+ test files, and CSRF protection has multiple bypass paths. On the data integrity side, the `deletePilot` function performs 10 non-atomic sequential deletes, and the conflict detection service fails open on errors. The codebase also carries significant tech debt — 274 debug scripts, 9 backup files, and 15 unresolved P1 todo items. **Immediate action on the Critical items below is strongly recommended before the next production deployment.**

---

## Critical Issues (9)

> Must fix — security vulnerabilities, data integrity risks, production bugs

### C1. Missing Root `middleware.ts` — All Middleware Protections Non-Functional

| | |
|---|---|
| **File** | `middleware.ts` (missing — should exist at project root) |
| **Impact** | `lib/supabase/middleware.ts` defines rate limiting, auth guards, and role-based routing, but `updateSession()` is never imported or called. All middleware-level protections are **dead code**. |
| **Risk** | CRITICAL — No middleware-layer auth enforcement on `/dashboard` or `/portal` routes. Auth relies solely on layout-level checks, which don't cover API routes. Rate limiting on `/api/auth/*` at the middleware level never fires. |
| **Fix** | Create root `middleware.ts`: `import { updateSession } from '@/lib/supabase/middleware'; export async function middleware(request) { return updateSession(request) }; export const config = { matcher: ['/dashboard/:path*', '/portal/:path*', '/api/auth/:path*'] }` |

### C2. 5 Renewal-Planning Routes Missing Authentication — Pilot PII Exposed

| | |
|---|---|
| **Files** | `app/api/renewal-planning/preview/route.ts` (663 lines), `app/api/renewal-planning/export/route.ts`, `app/api/renewal-planning/export-csv/route.ts`, `app/api/renewal-planning/export-pdf/route.ts`, `app/api/renewal-planning/email/route.ts` |
| **Impact** | These routes expose pilot names, employee IDs, certification expiry dates, and seniority numbers. The email route can send emails without authentication. Other routes in the same feature (`generate`, `clear`, `confirm`) correctly have auth. |
| **Risk** | CRITICAL — Unauthenticated access to sensitive pilot data; email route can be weaponized for spam. |
| **Fix** | Add `const auth = await getAuthenticatedAdmin(); if (!auth.authenticated) return unauthorizedResponse();` to each route. |

### C3. Hardcoded Production Credentials in 10+ Test Files

| | |
|---|---|
| **Files** | `e2e/helpers/auth-helpers.ts:22-23`, `e2e/test-with-credentials.spec.ts:11-14`, `e2e/leave-bids.spec.ts:26-27`, `e2e/complete-system-verification.spec.ts:30-31`, `e2e/comprehensive-portal-test.spec.ts:27-28`, `e2e/pilot-portal-features.spec.ts:12-21`, `e2e/pilot-portal.spec.ts:16`, `e2e/pilot-registration.spec.ts:40-41`, `e2e/pilot-login-redirect.spec.ts:34`, `e2e/leave-approval.spec.ts:15` |
| **Impact** | Real production passwords (`mron2393`, `Lemakot@1972`, `admin123`) and email addresses (`mrondeau@airniugini.com.pg`, `skycruzer@icloud.com`) are committed to git history. |
| **Risk** | CRITICAL — Anyone with repo access can see these credentials. If the repo is ever made public or an attacker gains read access, all these accounts are compromised. |
| **Fix** | 1) **Immediately rotate all exposed passwords.** 2) Remove all hardcoded credentials from test files. 3) Migrate all tests to use `TEST_CONFIG` from `e2e/helpers/test-utils.ts` (which correctly reads env vars). 4) Delete `e2e/helpers/auth-helpers.ts` (insecure duplicate of `test-utils.ts`). 5) Add a pre-commit hook scanning for credential patterns. |

### C4. Conflict Detection Fails Open — Errors Default to `canApprove: true`

| | |
|---|---|
| **File** | `lib/services/conflict-detection-service.ts:144-152` |
| **Impact** | If the conflict detection query fails (transient DB error, timeout), the function returns `{ canApprove: true }` with a warning. This means a database outage could allow conflicting leave requests to be approved, violating crew minimums. |
| **Risk** | CRITICAL — Data integrity and safety rule violation. In an aviation context, incorrect crew availability could have regulatory implications. |
| **Fix** | Change error fallback to `canApprove: false` (fail-closed). Log the error prominently so admins are alerted. |

### C5. Race Condition in Crew Availability Check — No Serialization

| | |
|---|---|
| **File** | `lib/services/conflict-detection-service.ts:236-314` |
| **Impact** | `checkCrewAvailability()` uses a read-then-decide pattern. Two concurrent approval requests can both read the same crew count, both pass the 10-captain/10-FO minimum check, and both be approved — even if this violates the minimum. No advisory locks, no database-level constraints enforce the minimum. |
| **Risk** | CRITICAL — Concurrent approvals can violate minimum crew requirements. |
| **Fix** | Use `pg_advisory_xact_lock` around the approval workflow, or serialize approvals through a queue. Add a database trigger or constraint as a safety net. |

### C6. `deletePilot` — Non-Atomic 10-Step Cascade Labeled "Atomic"

| | |
|---|---|
| **File** | `lib/services/pilot-service.ts:792-1002` |
| **Impact** | Performs 10 sequential DELETE operations across tables. JSDoc claims "Uses PostgreSQL function for transaction safety" — but it does NOT. A failure at step 6 leaves steps 1-5 permanently deleted with no rollback. |
| **Risk** | CRITICAL — Partial pilot deletion creates orphaned data and referential integrity violations. |
| **Fix** | Create a `delete_pilot_cascade` PostgreSQL function that wraps all deletions in a single transaction. Call via `.rpc('delete_pilot_cascade', { pilot_id })`. |

### C7. `withErrorLogging` Unused — Production API Errors Invisible

| | |
|---|---|
| **File** | `lib/api/with-error-logging.ts` (defined), `app/api/` (0 routes use it) |
| **Impact** | A well-implemented API error logging wrapper exists but is imported by ZERO of the 90+ API route files. Production API errors are not logged to Better Stack. |
| **Risk** | CRITICAL — Operational blindness. API failures in production are undetectable unless they surface as client-side errors. |
| **Fix** | Wrap all API route handlers: `export const GET = withErrorLogging(async (request) => { ... })`. Prioritize auth routes and mutation routes first. |

### C8. No Unit Test Infrastructure — Only 1 Test File Exists

| | |
|---|---|
| **File** | `lib/utils/__tests__/retry-utils.test.ts` (sole unit test) |
| **Impact** | No jest or vitest config. Zero unit tests for 53 services, validation schemas, utility functions, or React hooks. All quality assurance depends on 47 E2E tests (which have their own issues — see M5). |
| **Risk** | CRITICAL — Business logic in critical services (leave eligibility, certification compliance, roster calculations) has no unit-level verification. Regressions can only be caught by slow, flaky E2E tests. |
| **Fix** | Set up Vitest. Add unit tests for: `unified-request-service`, `leave-eligibility-service`, `certification-service`, `conflict-detection-service`, `roster-utils.ts`. |

### C9. 15 Open P1 Security/Integrity Todos Unresolved

| | |
|---|---|
| **File** | `todos/028` through `todos/059` |
| **Impact** | Previously-identified P1 issues remain open: Zod/API mismatches (028), CSRF gaps (030, 058), rate limiting gaps (031), RLS policy gaps (032), missing input sanitization (035), no transaction boundaries (036), missing unique constraints (037, 057), missing FK constraints (038), missing check constraints (039), exposed sensitive data in logs (040), race conditions (056), missing NOT NULL constraints (059). |
| **Risk** | CRITICAL (aggregate) — These represent a systematic backlog of known security and data integrity issues. |
| **Fix** | Triage and prioritize. Items 056-059 overlap with findings in this audit. Items 030/058 (CSRF) are confirmed by Finding C1/M2 above. |

---

## Major Issues (17)

> Should fix — performance, reliability, code quality

### M1. CSRF Protection Has Multiple Bypass Paths

| | |
|---|---|
| **Files** | `lib/middleware/csrf-middleware.ts:56-88, 115-124` |
| **Impact** | (a) Authenticated requests bypass CSRF validation entirely if session cookies are present. (b) Requests without a `csrf_secret` cookie are **allowed through** instead of rejected. (c) 12+ mutation routes have no CSRF protection at all (see table below). |
| **Routes missing CSRF** | `/api/auth/change-password`, `/api/auth/logout`, `/api/auth/signout`, `/api/pilot/login`, `/api/pilot/register`, `/api/pilot/logout`, `/api/disciplinary`, `/api/feedback/[id]/comments`, `/api/requests/[id]`, `/api/requests`, `/api/dashboard/refresh`, `/api/portal/upload/medical-certificate` |
| **Fix** | Remove the bypass for authenticated routes. Reject requests with missing CSRF secret. Add `validateCsrf` to all listed routes. |

### M2. Duplicate CSRF Implementations

| | |
|---|---|
| **Files** | `lib/csrf.ts` (cookie comparison) vs `lib/security/csrf.ts` + `lib/middleware/csrf-middleware.ts` (csrf npm package) |
| **Fix** | Remove `lib/csrf.ts` if unused. Consolidate into one approach. |

### M3. Auth Routes Missing Rate Limiting

| | |
|---|---|
| **Routes** | `/api/pilot/login` (brute force vulnerable), `/api/pilot/register` (spam vulnerable), `/api/auth/change-password` (no rate limit) |
| **Fix** | Add `withAuthRateLimit` to all auth endpoints. |

### M4. Missing Auth on 3 Additional Routes

| | |
|---|---|
| **Routes** | `/api/retirement/impact` (crew impact data), `/api/retirement/timeline` (monthly timeline), `/api/deadline-alerts` (roster alerts) |
| **Fix** | Add `getAuthenticatedAdmin()` check. |

### M5. 10+ Overlapping E2E Test Files — Bloated Suite

| | |
|---|---|
| **Files** | `complete-system-verification.spec.ts`, `comprehensive-browser-test.spec.ts`, `comprehensive-manual-test.spec.ts`, `comprehensive-portal-test.spec.ts`, `comprehensive-functionality.spec.ts`, `leave-approval-authenticated.spec.ts`, `leave-approval-full-test.spec.ts`, `pilot-portal-features.spec.ts`, `pilot-registrations.spec.ts`, `manual-browser-test.spec.ts` |
| **Fix** | Consolidate or delete overlapping specs. With `workers: 1`, 47 sequential specs cause very long CI runs. |

### M6. `ServiceResponse` Adoption at 32% — Inconsistent Error Contract

| | |
|---|---|
| **Impact** | 17/53 services use `ServiceResponse<T>`. The rest throw errors or return raw values. `unified-request-service.ts` defines its own duplicate `ServiceResponse` (line 210) that shadows the canonical one. |
| **Fix** | Migrate core services to canonical `ServiceResponse`. Rename the duplicate in `unified-request-service.ts` to `UnifiedRequestResponse`. |

### M7. Pervasive `any` Types in Core Services

| | |
|---|---|
| **Files** | `pilot-service.ts` (4x), `certification-service.ts` (8x), `unified-request-service.ts` (5 double-casts) |
| **Fix** | Use existing join types from `types/database-extensions.ts` (`CertificationWithCheckType`, `CertificationWithPilot`, etc.). |

### M8. Zod Schema / Service Mismatch — Data Silently Dropped

| | |
|---|---|
| **Files** | `lib/validations/certification-validation.ts` vs `lib/services/certification-service.ts:392-407` |
| **Impact** | `CertificationCreateSchema` validates `completion_date`, `expiry_roster_period`, `notes` — but the service only inserts `pilot_id`, `check_type_id`, `expiry_date`. Validated data is silently discarded. |
| **Fix** | Expand the service to store all validated fields, or narrow the schema. |

### M9. Middleware N+1 — 2 DB Queries Per Authenticated Request

| | |
|---|---|
| **File** | `lib/supabase/middleware.ts:141-153` |
| **Impact** | Two sequential queries (`pilot_users` + `an_users`) on every authenticated request to `/dashboard` or `/portal`. |
| **Fix** | Combine into one query with `.or()`, or cache the role result in a cookie. |

### M10. Rate Limit Headers Lost on Successful Auth Requests

| | |
|---|---|
| **File** | `lib/supabase/middleware.ts:48-54` |
| **Impact** | Headers set on a local `response` variable that's never returned. Clients never see rate limit headers. |
| **Fix** | Set headers on `supabaseResponse` instead. |

### M11. 10 API Routes Over 150 Lines with Inline Business Logic

| | |
|---|---|
| **Worst offenders** | `renewal-planning/preview` (663), `renewal-planning/email` (510), `portal/leave-bids` (380), `cron/certification-expiry-alerts` (355), `roster-reports/[period]/email` (320), `renewal-planning/export-pdf` (311) |
| **Fix** | Extract business logic into service layer. |

### M12. Retry Utilities Built but Unused in Production

| | |
|---|---|
| **Files** | `lib/utils/retry-utils.ts`, `lib/hooks/use-retry-state.ts` |
| **Impact** | Comprehensive retry infrastructure exists but is used in zero production service calls or API routes. |
| **Fix** | Integrate `fetchWithRetry` into critical service calls or TanStack Query `queryFn` wrappers. |

### M13. No Service Worker Despite PWA References

| | |
|---|---|
| **File** | `app/offline/page.tsx:193` references "Powered by Serwist PWA" but no Serwist config, `sw.ts`, or `@serwist` dependency exists. |
| **Fix** | Either implement the service worker or remove PWA references. |

### M14. `global-error.tsx` Doesn't Log to External Service

| | |
|---|---|
| **File** | `app/global-error.tsx:22-24` only logs to console in dev. Root-level production errors are invisible to monitoring. |
| **Fix** | Add `logError(error, { errorBoundary: true, global: true })`. |

### M15. CI Missing Test Env Vars

| | |
|---|---|
| **File** | `.github/workflows/playwright.yml` |
| **Impact** | CI writes `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` but tests expect `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_PILOT_EMAIL`, `TEST_PILOT_PASSWORD`. E2E tests using `test-utils.ts` helpers fail in CI. |
| **Fix** | Add missing env vars to CI workflow. |

### M16. `@hookform/resolvers` in devDependencies

| | |
|---|---|
| **File** | `package.json` |
| **Impact** | Used at runtime in 10+ form components. Being in devDependencies means it could be missing in production builds depending on the environment. |
| **Fix** | Move to `dependencies`. |

### M17. 274 Debug Scripts Committed (1.6MB)

| | |
|---|---|
| **Path** | `scripts/debug/` |
| **Impact** | One-off diagnostic scripts with potentially hardcoded credentials/URLs. Adds noise and repo bloat. |
| **Fix** | Delete all. Add `scripts/debug/` to `.gitignore`. |

---

## Minor Issues (20)

> Nice to fix — cleanup, consistency, test gaps

| # | File | Description | Fix |
|---|------|-------------|-----|
| m1 | `next.config.js:32-47` | `recharts` (~400KB) missing from `optimizePackageImports` | Add `'recharts'` to the array |
| m2 | `leave-bids-pdf-service.ts:8-9` | Static `import jsPDF` — only PDF service not using dynamic import | Convert to `const { jsPDF } = await import('jspdf')` |
| m3 | `cron/certification-expiry-alerts/route.ts:73` | Cron secret uses `===` instead of `crypto.timingSafeEqual` | Use timing-safe comparison |
| m4 | `renewal-plan-preview-modal.tsx` (617 lines) | Oversized component — data logic + UI coupled | Extract `StatCard`, create `useCategoryData` hook |
| m5 | `renewal-planning-dashboard.tsx` (565 lines) | Oversized component | Extract `RenewalQuickStats`, `RenewalPeriodGrid`, `YearNavigator` |
| m6 | `SERVICE-MIGRATION-GUIDE.md` | Stale — shows 1/10 services migrated; all are actually done | Update or archive |
| m7 | `DATABASE-INDEXES.sql` | References deprecated `leave_requests`/`flight_requests` tables; no `pilot_requests` entries | Update to reflect current schema |
| m8 | `pilot_requests` indexes | No standalone index on `workflow_status` or `request_category` | Verify with `EXPLAIN ANALYZE`; add composite index if needed |
| m9 | Error response inconsistency | `retirement/impact`, `retirement/timeline`, `retirement/forecast` return `{ error }` without `success` field | Standardize to `{ success: false, error }` |
| m10 | Missing Zod validation | `renewal-planning/preview`, `renewal-planning/generate`, `renewal-planning/email`, `retirement/impact` accept unvalidated input | Add Zod schemas |
| m11 | `app/error.tsx:21` | Logs `console.error` unconditionally (even production) | Add `NODE_ENV === 'development'` guard |
| m12 | Specialized error boundaries unused | `WidgetErrorBoundary`, `TableErrorBoundary`, etc. are defined but never used in components | Wire them into dashboard widgets and data tables |
| m13 | `lib/rate-limit.ts:54-62` | Dev rate limiter always returns success — can't catch rate limit bugs locally | Add in-memory fallback |
| m14 | Optimistic hooks use hardcoded query keys | `['certifications']`, `['pilot', id]` instead of `queryKeys.certifications.all` | Use `queryKeys` factory |
| m15 | `withRetry()` is a no-op stub | `lib/supabase/retry-client.ts:182-193` returns client unchanged | Implement or remove |
| m16 | Admin/service-role clients near-duplicate | `admin.ts` vs `service-role.ts` create identical clients | Consolidate or document distinction |
| m17 | Settings queries lack caching | `getSystemSetting()` hits DB on every call | Add Redis/`unstable_cache` with long TTL |
| m18 | 9 `.backup` files committed | Various locations | Delete all; add `*.backup` to `.gitignore` |
| m19 | `supabase/supabase/supabase/migrations/` | Triple-nested directory (accidental) | Delete |
| m20 | `@types/bcrypt` in devDependencies | Project uses `bcryptjs`, not `bcrypt` | Remove `@types/bcrypt` |

---

## Quick Wins (under 30 minutes each)

| # | Task | Time Est. | Impact |
|---|------|-----------|--------|
| Q1 | **Create root `middleware.ts`** — 5 lines to import and re-export `updateSession` | 5 min | Activates all middleware protections (C1) |
| Q2 | **Add auth checks to 5 renewal-planning routes** — copy the pattern from `generate/route.ts` | 15 min | Fixes PII exposure (C2) |
| Q3 | **Change conflict detection error fallback** from `canApprove: true` to `canApprove: false` | 2 min | Fail-closed instead of fail-open (C4) |
| Q4 | **Add `recharts` to `optimizePackageImports`** | 1 min | Better tree-shaking (m1) |
| Q5 | **Move `@hookform/resolvers` to dependencies** | 1 min | Prevent potential prod build failures (M16) |
| Q6 | **Delete 9 `.backup` files + add to `.gitignore`** | 5 min | Repo hygiene (m18) |
| Q7 | **Delete `supabase/supabase/supabase/` triple-nested dir** | 1 min | Repo hygiene (m19) |
| Q8 | **Add timing-safe comparison to cron routes** | 5 min | Security hardening (m3) |
| Q9 | **Remove `@types/bcrypt`** | 1 min | Dependency cleanup (m20) |
| Q10 | **Convert `leave-bids-pdf-service.ts` to dynamic jsPDF import** | 5 min | Bundle size (m2) |

---

## Summary Counts

| Severity | Count |
|----------|-------|
| Critical | 9 |
| Major | 17 |
| Minor | 20 |
| Quick Wins | 10 |
| **Total Findings** | **46** |

## Areas That Passed Review (Notable Strengths)

- **Dashboard Server Component architecture** — Each widget fetches independently, no prop drilling, proper Suspense boundaries
- **TanStack Query configuration** — Well-tuned `staleTime`, `gcTime`, `retry`, and `networkMode` for aviation context
- **Optimistic mutation hooks** — Proper snapshot/rollback/invalidation pattern across all 4 domain hooks
- **Error boundary coverage** — Root, dashboard, portal, and sub-route error pages all present
- **Service role key isolation** — `SUPABASE_SERVICE_ROLE_KEY` never exposed to client-side code
- **Input sanitization** — `sanitizeSearchTerm` consistently used in 7 service files for PostgREST queries
- **Lazy loading infrastructure** — `dynamic-imports.tsx` provides well-typed presets with correct SSR settings
- **Cache architecture** — Three-tier cache (in-memory + Redis + DB) with proper invalidation helpers and bounded tracking

---

*Report generated by 6 parallel audit agents covering: Architecture/Security, Database/Types, Service Layer/API Routes, React/Performance, Error Handling/Tests, Code Hygiene/Tech Debt.*
