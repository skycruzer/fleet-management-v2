# Codebase Concerns

**Analysis Date:** 2026-03-14

---

## Critical Security Issues (Fix Immediately)

### 1. Published Rosters RLS Policies Too Permissive

**Files:** `supabase/migrations/20260224120000_create_published_rosters_tables.sql` (lines 35, 116)

**Problem:** Both `activity_codes` and `published_rosters` tables use overly broad RLS policies:

- Activity codes policy 35: `FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated')` — Any authenticated user (including pilots) can INSERT/UPDATE/DELETE
- Published rosters policy 116: `FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated')` — Any authenticated user can manage rosters

**Impact:** Pilots could create, modify, or delete activity codes and published rosters meant only for admin management. High security risk.

**Current State:** The check uses `'authenticated'` which is the lowest privilege level in Supabase. No admin role verification.

**Fix Approach:**

1. Create proper admin role check in Supabase (use `is_admin()` function if exists, or add explicit admin role field to `auth.users`)
2. Replace both policies with `auth.jwt() ->> 'role' = 'admin'` or equivalent
3. Keep SELECT policies read-only for admins or use view-based access for pilots
4. Audit who has accessed published_rosters table via logs

---

### 2. CSRF Token Loading Not Blocking Form Submission

**Files:** `components/forms/pilot-form.tsx`, `components/forms/certification-form.tsx`, and 5+ other form components

**Problem:** Forms fetch CSRF tokens during render but do NOT disable submit button while `csrfLoading === true`. Users can submit forms before token loads.

**Evidence:** Line 63 in `pilot-form.tsx` destructures `csrfLoading` but the submit button (line 89+) doesn't check this flag.

**Impact:** If CSRF token fetch is delayed, form submission proceeds without token, bypassing CSRF protection.

**Fix Approach:**

1. Add `disabled={csrfLoading || isSubmitting}` to submit button
2. Show loading spinner or message while `csrfLoading`
3. Test by artificially delaying CSRF endpoint

---

### 3. Admin Diagnostic Routes Missing Explicit Role Checks

**Files:** `app/api/admin/cache-metrics/route.ts`, `app/api/admin/memory-stats/route.ts`

**Problem:** Routes verify `auth.authenticated` but do NOT call `requireRole([UserRole.ADMIN])`. They implicitly assume "authenticated = admin" which is dangerous.

**Impact:** If auth system is bypassed or mis-configured, non-admin users could access sensitive diagnostic info (cache state, memory usage, performance metrics).

**Fix Approach:**

1. Add explicit role check: `const roleCheck = await requireRole(request, [UserRole.ADMIN])`
2. Return forbiddenResponse if role check fails
3. Apply same pattern to all `/api/admin/*` routes

---

## High Priority Issues (Technical Debt & Quality)

### 4. Fire-and-Forget Notifications Without Retry Mechanism

**Files:** `lib/services/leave-bid-service.ts` (lines 143-153, 202-213), `lib/services/unified-request-service.ts`, other notification calls

**Problem:** Admin notifications use pattern:

```typescript
notifyAllAdmins(...).catch((err) => logError(...))
sendAdminRequestNotificationEmail(...).catch((err) => logError(...))
```

Both calls are unawaited. If email fails, admin receives NO notification. If both fail, no retry mechanism exists.

**Impact:** Admins may miss critical leave/flight requests. Requests get lost in the notification gap.

**Current Mitigation:** Logging via `logError()` with `ErrorSeverity.LOW`, but no actual retry or fallback.

**Fix Approach:**

1. Implement notification queue (Redis or database-backed)
2. Add exponential backoff retry (3 attempts, 1s/5s/30s delays)
3. Log notification failures as MEDIUM severity and create admin alert
4. Consider dead-letter queue for persistent failures
5. Add monitoring dashboard for notification delivery rate

---

### 5. 300+ `any` Type Assertions Undermining TypeScript Strict Mode

**Scope:** 60+ service files across codebase

**Files:** `lib/services/reports-service.ts` (80+ instances), `lib/services/certification-renewal-planning-service.ts` (26), `lib/services/redis-session-service.ts` (16+), `lib/services/auth-service.ts` (8), others

**Problem:** Services use `as any` to bypass type checking instead of properly typing data. Examples:

- `from('table' as any)` — Supabase client casts
- Response data typed as `any` instead of proper interfaces
- Error handling uses `as unknown` then cast to `any`

**Impact:** Defeats purpose of `"strict": true` in tsconfig. Runtime errors not caught at compile time. Refactoring becomes risky.

**Priority Order:**

1. Supabase client type assertions (replace with generated types from `db:types`)
2. Service return types (use `ServiceResponse<T>` or proper interfaces)
3. Error typing (use `unknown`, then narrow with type guards)

**Fix Approach:**

1. Create TypeScript audit: `npm run typecheck -- --noEmit --listFiles` and filter for `any`
2. Prioritize hotspot files (reports-service, certification-renewal-planning-service)
3. Target: <50 instances across entire codebase
4. Add ESLint rule: `@typescript-eslint/no-explicit-any: error`

---

### 6. Hardcoded Timeout Pattern in Tests (Flakiness)

**Files:** `e2e/leave-approval-full-test.spec.ts` and other Playwright tests

**Problem:** Tests use non-deterministic sleeps:

```typescript
await page.waitForTimeout(1000) // line 36
await page.waitForTimeout(2000) // line 49
```

These 1-2 second delays cause tests to pass/fail based on system load, not actual UI state.

**Impact:** Flaky test suite. CI/CD pipeline unreliable. Tests pass locally but fail in CI due to network latency.

**Fix Approach:**

1. Replace `waitForTimeout()` with event-based waits:
   - `page.waitForURL()` — Wait for navigation complete
   - `page.waitForSelector()` — Wait for element appears
   - `page.waitForLoadState('networkidle')` — Wait for network settled
   - `page.locator(...).waitFor()` — Wait for specific element ready
2. Use page events: `page.on('response', ...)` to detect API calls
3. Test locally multiple times to verify determinism

---

### 7. Minimal Unit Test Coverage (Only 2 Unit Test Files)

**Current State:** `tests/unit/` has ~2 test files

**Missing Coverage:** Service layer has zero unit tests:

- `leave-eligibility-service.ts` — Critical business logic (rank-separated availability)
- `unified-request-service.ts` — All leave/flight request handling
- `certification-renewal-planning-service.ts` — Complex date calculations
- `conflict-detection-service.ts` — Request conflict detection

**Impact:** Bugs in service layer found in production or E2E tests. Refactoring services is risky without unit test safety net.

**Fix Approach:**

1. Create `tests/unit/services/` directory
2. Add unit tests for:
   - Leave eligibility (happy path, insufficient crew, boundary cases)
   - Unified request CRUD (create, update, delete, filter)
   - Certification renewal date calculations
   - Conflict detection (overlapping dates, rank conflicts)
3. Target: 80%+ coverage on service layer
4. Use Jest or Vitest for fast, focused tests (not E2E)

---

### 8. console.error in Production Services (No Centralized Logging)

**Files:** `lib/services/leave-stats-service.ts` (5+ calls), `lib/services/leave-bid-service.ts` (15+ calls), `lib/services/pilot-flight-service.ts`, multiple API routes

**Problem:** Services use `console.error()` instead of centralized `logError()` service. Errors don't get:

- Structured formatting
- Alerting to Better Stack or monitoring
- Severity classification
- Request context (userId, route, etc.)

**Impact:** Production errors go unnoticed. No monitoring, no alerting. Incidents discovered by users, not observability.

**Fix Approach:**

1. Audit all `console.error()` calls: `grep -r "console.error" lib/services`
2. Replace with `logError(error, { source, severity: ErrorSeverity.MEDIUM })`
3. Use `logError()` from `lib/error-logger.ts` (already partially in place)
4. Verify Better Stack integration is enabled in production

---

## Medium Priority Issues (Code Quality & Architecture)

### 9. Orphaned Test/Debug Files in Root Directory

**Files:**

- `run-portal-tests.js`, `test-admin-pages-individually.js`, `test-admin-portal-comprehensive.js`, etc. (15+ test files)
- `test-certification-update.js`, `test-complete-flow.js`, `test-dashboard-pages.js`, etc.

**Problem:** Debug/test scripts left in project root. Not tracked in npm scripts or `.gitignore`. Unclear if still needed.

**Impact:** Clutters root directory. Confuses developers about official test commands. Creates uncertainty about what's actually run in CI.

**Fix Approach:**

1. Audit each file: Is it still used? If not, delete.
2. If still used, move to `scripts/` directory and add to `package.json` scripts
3. Add to `.gitignore` if these are temporary debugging artifacts

---

### 10. 28 Pages Unnecessarily Marked as Client Components

**Files:** `app/dashboard/analytics/page.tsx`, `app/portal/(protected)/certifications/page.tsx`, and 26+ others

**Problem:** Pages marked `'use client'` when they could be Server Components with small Client boundaries. Examples:

- Pages that only render data + a single interactive component
- Pages that do initial data fetch then display
- Pages with one form component

**Impact:** Forces hydration of entire page in browser. Slower initial page load. Larger JavaScript bundles. Forces auth checks on client side.

**Fix Approach:**

1. Audit each `'use client'` page: Can it be server component?
2. Refactor pattern: `page.tsx` (server) → `components/page-content.tsx` (client)
3. Keep server component benefits: direct DB access, secrets, proper auth
4. Use React 19 Server Components + Client Island pattern throughout

---

### 11. Inconsistent className Pattern (Template Strings vs cn())

**Files:** `components/ui/data-table.tsx:137`, `components/portal/portal-form-wrapper.tsx`, 5+ other components

**Problem:** Some components use template strings:

```typescript
className={`space-y-6 ${className}`}
```

Others use proper utility:

```typescript
className={cn('space-y-6', className)}
```

**Impact:** Inconsistent style makes code harder to read. Some classNames not optimized by Tailwind class sorting.

**Fix Approach:**

1. Replace all template string patterns with `cn()`
2. Verify with Prettier `tailwindcss` plugin for class sorting
3. Add ESLint rule to catch future template string classNames

---

### 12. Table Sort Aria Label Typo (Accessibility Issue)

**File:** `components/ui/data-table.tsx:139`

**Problem:** Aria-label reads "currently sorted ascendingending" (duplicate "ending" in interpolation)

**Impact:** Screen reader users hear garbled sorting state. Violates WCAG 2.1 Label/Instruction requirement.

**Fix Approach:**

1. Fix aria-label string interpolation
2. Test with screen reader (NVDA, JAWS, or Voice Over)

---

### 13. Storybook Coverage Gaps (Only 24 Stories for 70+ Components)

**Current State:** 24 stories in Storybook

**Missing:** Stories for:

- Domain components (`certifications/`, `requests/`, `leave/`, `pilots/`)
- Dashboard widgets and cards
- Form components (pilot-form, certification-form, etc.)
- Report-specific components
- Portal-specific components

**Impact:** Component development slower. New developers can't see component API/usage. Design system undocumented.

**Fix Approach:**

1. Add stories for high-reuse domain components
2. Use auto-generated props docs with `@storybook/addon-essentials`
3. Target: Story for every component with `interface Props`

---

### 14. ServiceResponse Migration 19/58 Services (Incomplete)

**Files:** 19 services migrated to `ServiceResponse<T>`, 39 still throwing errors

**Problem:** Inconsistent error handling patterns:

- New code: `ServiceResponse.success() | ServiceResponse.error()`
- Old code: `throw new Error()` wrapped by `executeAndRespond()`

**Impact:** Different error handling patterns in same codebase. Harder to maintain.

**Fix Approach:**

1. Migrate remaining 39 services to `ServiceResponse<T>`
2. Update API routes to use migrated services
3. Remove `executeAndRespond()` wrapper once all services migrated
4. Add type-safe error handling throughout

---

## Low Priority Issues (Nice to Have)

### 15. Validation Schema Naming Inconsistency

**Pattern 1:** `*-schema.ts` (newer files)
**Pattern 2:** `*-validation.ts` (older files)

**Files:** `lib/validations/` contains both patterns

**Fix:** Standardize on `*-schema.ts` per CLAUDE.md file naming conventions. Rename older validation files.

---

### 16. No React.memo on Expensive Components

**Candidates:** Chart components, large tables, dashboard widgets

**Issue:** Components re-render when parent props unchanged, causing performance lag on dashboard.

**Fix:** Wrap heavy components with `React.memo()` and ensure stable prop references.

---

### 17. useDeduplicatedSubmit Only in Pilot Form

**File:** `components/forms/pilot-form.tsx` (line 89)

**Issue:** Only pilot form uses this pattern. Other forms (certification, leave) don't deduplicate rapid submissions.

**Fix:** Extract to reusable hook in `lib/hooks/`, use across all forms.

---

### 18. 6 Skipped Tests in Bug Fixes Validation

**File:** `e2e/bug-fixes-validation.spec.ts`

**Issue:** Tests marked `.skip()` indicate pending fixes or known issues.

**Fix:** Investigate each skipped test, either fix issue or document why it's skipped.

---

### 19. No Database Cleanup Between E2E Tests

**Problem:** E2E tests create test data but don't clean up. Subsequent test runs accumulate garbage data.

**Impact:** Database grows unbounded. Tests become slow. Hard to diagnose test failures (is it fresh data or pollution?).

**Fix:** Add `beforeEach()`/`afterEach()` to clean test data. Or use database transaction rollback per test.

---

### 20. Animation Shimmer May Not Respect prefers-reduced-motion

**File:** Potentially `components/skeletons/` or globals.css

**Issue:** Shimmer animations might ignore user's `prefers-reduced-motion` accessibility setting.

**Fix:** Test with system accessibility settings. Apply `motion-safe:` Tailwind variants or media queries.

---

## Performance & Scaling Considerations

### 21. Dashboard Cache Invalidation Complexity

**Files:** `lib/services/cache-invalidation-helper.ts`, `lib/services/dashboard-service-v4.ts`

**Concern:** Dashboard uses Redis cache with multiple invalidation tags. Complex tag-based invalidation can lead to:

- Stale data if invalidation logic is incomplete
- Cache stampede if popular keys invalidated simultaneously
- Hard to debug cache issues in production

**Mitigation Present:** Cache-first strategy with DB fallback

**Improvement:** Add cache hit/miss metrics to monitoring

---

### 22. Roster Period Calculations Edge Cases

**Files:** `lib/utils/roster-utils.ts`

**Concern:** Roster period logic (RP1-RP13 annual cycle, 28-day periods) has edge cases:

- Year boundary (RP13 → RP1 transition)
- Leap year handling
- Date range calculations for past/future rosters

**Mitigation Present:** Utility tests (need verification)

**Improvement:** Add comprehensive unit tests for edge cases

---

## Known Limitations & Workarounds

### 23. Webpack Used Instead of Turbopack

**File:** `.env.local` (npm run dev uses `next dev --webpack`)

**Reason:** Turbopack has path alias resolution issues with this codebase

**Workaround:** `next.config.js` has `turbopack.root` config but disabled in dev script

**Note:** This is a known tradeoff. Webpack is slower but reliable.

---

### 24. Server Actions Body Size Limited to 2MB

**File:** `next.config.js` (`serverActions.bodySizeLimit = '2mb'`)

**Impact:** File uploads exceeding 2MB will fail silently. Roster PDF uploads must be < 2MB.

**Note:** Verified in `app/api/published-rosters/route.ts` file size limit is 10MB via HTTP route, not server actions.

---

## Audit Trail

| Date       | Issue                                   | Status        |
| ---------- | --------------------------------------- | ------------- |
| 2026-03-07 | 22 issues identified in codebase review | Documented    |
| 2026-03-14 | Critical RLS policies verified          | High priority |
| 2026-03-14 | CSRF form submission blocking confirmed | High priority |
| 2026-03-14 | Fire-and-forget notifications verified  | High priority |

---

_Concerns audit: 2026-03-14_
_Next review recommended: 2026-04-14_
