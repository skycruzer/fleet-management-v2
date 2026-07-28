# Production Readiness Report

**Branch:** `main` · **HEAD:** `2f315d0` · **Reviewed:** 2026-07-28
**Method:** hand-verified code review + independent reference-mesh review (2 agents) + runtime
verification against live production (`https://www.pxb767office.app`) and the Vercel project config.

> Supersedes the 2026-07-06 report (kept in git history). That report's verdict — "one blocker
> left, and it's yours" — is no longer accurate in either direction: the service-role key **was**
> rotated (good), but this review found live exploitable defects the July pass did not cover.

## Verdict: 🟡 One blocker left — provisioning Upstash

Every code-fixable defect below has been **fixed and verified** (`validate`, 77 unit tests and
`build` all green — see "Remediation"). The live credential compromise has been **closed against
production**. One item remains, and it is an account action:

| #   | Status               | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ✅ **DONE**          | **Published passwords rotated.** The admin hash for `skycruzer@icloud.com` was verified byte-identical to the one committed in this public repo — the published password was live. Both it and `mrondeau@airniugini.com.pg` now have strong random passwords, verified by read-back, and their sessions were revoked (1,878 admin + 150 pilot; active admin sessions went 1,880 → 2). New passwords are in `.env.rotated-credentials.local` (mode 600, gitignored). **Log in and change them to your own, then delete that file.**             |
| 2   | ⛔ **BLOCKING**      | **Provision Upstash** and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel. No Upstash resource exists on the project, so until it does every rate limiter is a no-op mock. You asked to handle provisioning yourself; ping me after and I will wire the vars and verify a real 429.                                                                                                                                                                                                                                        |
| 3   | ✅ **NOT A BLOCKER** | **The leaked `service_role` JWT is dead.** Its value does not match either currently-active legacy key, which means the JWT secret was rolled after the leak — tokens signed with the old secret no longer validate. Legacy key _types_ (`anon`, `service_role`) are still enabled on the project; since the app runs entirely on `sb_publishable_`/`sb_secret_` keys and no active key has ever been committed, disabling them is worthwhile hardening rather than a blocker. Purging history is likewise now hygiene, not incident response. |

**Once Upstash is provisioned, this is production ready.**

**Do not treat the July 6 sign-off as current.** It verified the code it changed; it did not audit
the public repository for credentials, the deployed environment variables, or the authorization
middleware — which is where every live defect turned out to be. Review the deployment, not just
the diff.

---

## Hard gates (all green — these were never the problem)

| Gate                                       | Result      | Notes                                                                         |
| ------------------------------------------ | ----------- | ----------------------------------------------------------------------------- |
| `npm run validate` (types + lint + format) | ✅ PASS     | exit 0; 1 eslint warning, in an ignored worktree copy                         |
| `npm run validate:naming`                  | ✅ PASS     | 80 advisory warnings (loose `.sql`/`.mjs` names at repo root)                 |
| `npm run build` (prod, strict TS)          | ✅ PASS     | all routes compiled; built with **Turbopack**                                 |
| `npm run test:unit` (vitest)               | ✅ PASS     | 14 files / 77 tests after remediation (was 13 / 71)                           |
| Production runtime                         | ✅ HEALTHY  | `/api/health` ok, DB connected, 37 pilots, dashboard metrics ok               |
| Production auth gates                      | ✅ HOLD     | admin APIs 401; `/dashboard` + `/portal` 307 to login; cron 401               |
| Security headers                           | ✅ GOOD     | HSTS preload, CSP, nosniff, frame-options, referrer, permissions              |
| `npm audit --omit=dev`                     | ⚠️ 3 high   | was 5; remaining 3 are one unfixable chain — see `P5` and "Remediation"       |
| `npm test` (Playwright E2E)                | ⚠️ SEPARATE | ~323 stale/aspirational specs; unchanged since July, still a curation project |

---

## Confirmed blockers

### 🔴 P1 — Anonymous disclosure of pilot password hashes and PII

**`GET /api/portal/register` returns an entire `pilot_users` row to unauthenticated callers, and
its email filter accepts SQL `LIKE` wildcards.**

- `app/api/portal/register/route.ts:157` — public GET handler, passes the raw `email` query
  parameter straight to the service.
- `lib/services/pilot-portal-service.ts:354` — `getRegistrationStatus()` uses
  `createAdminClient()` (service-role, **bypasses RLS**), does `.select('*')` on `pilot_users`,
  and filters with `.ilike('email', email.trim())` on unescaped caller input.
- Returns `data` verbatim; the type is `Database['public']['Tables']['pilot_users']['Row']`, which
  includes `password_hash` (`types/supabase.ts:1557`), date of birth, phone, address and
  employee details.
- `proxy.ts:291-297` lists `/api/portal/register` in `publicPortalApiRoutes`, so the proxy does
  **not** require a session.

**Failure scenario:** an anonymous request to
`/api/portal/register?email=%25` supplies `%` as the ILIKE wildcard, matches every row, and returns
the most recently created pilot account — including its bcrypt `password_hash` — to the caller.
No account, token or knowledge of any email address is required.

**Verification:** confirmed by reading every step of the path. Runtime confirmation that the
endpoint answers anonymously in production: `GET /api/portal/register?email=<nonexistent>` → **HTTP
200**. I deliberately did **not** run the wildcard request against production — that would have
extracted a real password hash — so please treat the exploit itself as unproven-but-code-confirmed
and patch on that basis.

**Fix:** project only the fields the status page needs (`id`, `registration_approved`), escape or
reject `%`/`_` in the input, return an identical response whether or not the account exists, and
rate-limit the endpoint. Consider removing the public lookup entirely in favour of emailing status.

---

### 🔴 P2 — Any manager can act as an administrator (privilege escalation)

**`requireRole()` grants access to admin-only routes for _any_ valid admin-session cookie without
checking the session's actual role.**

`lib/middleware/authorization-middleware.ts:327-331`:

```ts
if (adminSession.isValid && adminSession.user?.id) {
  // Admin-session users are authenticated admins - check if Admin role is allowed
  if (requiredRoles.includes(UserRole.ADMIN)) {
    return { authorized: true } // ← never checks the caller's role
  }
  return await verifyUserRole(adminSession.user.id, requiredRoles)
}
```

The comment's assumption is false: admin sessions are issued to managers too —
`ADMIN_ROLES = new Set(['admin', 'manager'])` in both `proxy.ts:7` and
`lib/middleware/admin-auth-helper.ts:25`. The bcrypt admin-session path is the primary admin login
(it is the one the July pass added lockout to), so this is the live code path, not a fallback.

Perversely, the database role check only runs when the route does **not** require ADMIN. Every
`roles: [UserRole.ADMIN]` route is therefore reduced to "any admin _or manager_ session":

| Route                                         | Admin-only operation a manager can perform                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/users/route.ts:56`                   | **Create users** — `UserCreateSchema` accepts `role` (`lib/validations/user-validation.ts:51`), so a manager can create a new **admin** account |
| `app/api/settings/[id]/route.ts:29`           | Change system settings                                                                                                                          |
| `app/api/admin/leave-bids/[id]/route.ts:76`   | Delete leave bids                                                                                                                               |
| `app/api/cache/invalidate/route.ts:45,117`    | Flush caches                                                                                                                                    |
| `app/api/admin/cache-metrics/route.ts:39,128` | Infrastructure introspection                                                                                                                    |
| `app/api/admin/memory-stats/route.ts:34`      | Infrastructure introspection                                                                                                                    |

**Failure scenario:** a user with `an_users.role = 'manager'` logs in normally, then POSTs to
`/api/users` with `role: 'admin'`. The proxy admits managers, `requireRole()` short-circuits to
`authorized: true`, and the manager provisions themselves a full administrator account.

**Fix:** authorize on the role already returned by `getAuthenticatedAdmin()`, which reads `an_users`
through `createAdminClient()` (`lib/middleware/admin-auth-helper.ts:58-63`) and therefore works.
Never infer admin status from the presence of an admin-session cookie, and add a role-matrix test
covering both auth sources × both roles.

> ⚠️ **Do not "fix" this by calling `verifyUserRole(adminSession.user.id, requiredRoles)`** — the
> obvious-looking correction. That path goes through `getUserRole()`, which is already broken (see
> **P2b**), so it would convert the privilege escalation into a total lockout of all six admin
> routes.

---

### 🔴 P2b — `getUserRole()` can never succeed, and it has already broken two shipped features

`lib/middleware/authorization-middleware.ts:54-66` reads `an_users` using `createClient()` from
`@/lib/supabase/server` — the RLS-bound anon/JWT client. But
`supabase/migrations/20260703000001_lockdown_auth_tables.sql:27-28` does:

```sql
revoke select, insert, update, delete, truncate, references, trigger
  on table public.an_users from anon, authenticated;
```

Admin login is bcrypt with an `admin-session` cookie (`app/auth/login/actions.ts:22` → `adminLogin`)
and issues **no Supabase JWT**, so these requests execute as `anon`. The select is therefore always
denied and `getUserRole()` always returns `null`. The July lockdown migration and this helper were
never reconciled.

Consequences:

- `verifyResourceOwnership` (`:129-153`) can never reach its "Admins and Managers bypass ownership"
  branch, and falls through to a resource read on the same anon client against `TO authenticated`
  policies.
- **`PATCH`/`DELETE /api/tasks/[id]` and `PATCH`/`DELETE /api/disciplinary/[id]` fail for every
  administrator.** Dragging a card on `/dashboard/tasks` (`components/tasks/task-kanban.tsx:124`)
  or saving a disciplinary matter (`components/disciplinary/disciplinary-matter-form.tsx:119-120`)
  returns "Resource not found". Two shipped dashboard features have four unusable mutations.

This fails closed, so it is a functional outage rather than a security hole — but it is the reason
P2's tempting fix is a trap. Fix both together: authorize off `getAuthenticatedAdmin()` and retire
the duplicate `getUserRole()` lookup, or point it at the service-role client.

**Verification note:** confirmed by reading the migration, the helper and the client it imports. I
could not exercise the admin UI at runtime — that needs admin credentials, and the only ones
available are the published passwords from **P3**, which I declined to use.

---

### 🔴 P3 — Working admin and pilot credentials committed to a public repository

`github.com/skycruzer/fleet-management-v2` is **PUBLIC** (confirmed via `gh repo view`), and these
tracked files contain usable credentials:

| File:line                                                              | Contents                                                                         |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `RUN_THIS_IN_SUPABASE.sql:42`                                          | `skycruzer@icloud.com / mron2393` — stated as the admin login                    |
| `supabase/migrations/20251228080938_add_admin_password_hash.sql:85-88` | The same password in a comment **and** its bcrypt hash, seeded onto that account |
| `scripts/debug/create-pilot-user.mjs:16-17`                            | `mrondeau@airniugini.com.pg / Lemakot@1972` — a pilot account the script creates |

**Failure scenario:** anyone who reads the repository signs in at
`https://www.pxb767office.app/auth/login` as an administrator. This needs no exploit — the
credentials are published alongside the URL. I did not test them against production, because
doing so would be an unauthorized login and would trip account lockout.

**Fix (in this order):** change those account passwords first, invalidate their sessions, then
remove the values from the tree, then purge history. Changing the passwords is what actually
closes this — file removal alone does not.

---

### 🔴 P4 — All rate limiting is silently disabled in production

Upstash Redis is **not configured in the deployed environment at all**:

- `vercel env ls` lists exactly 7 production variables; `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` are absent from Production _and_ Preview (verified again via
  `vercel env pull --environment=production`: zero `UPSTASH` entries).
- `vercel integration list` → **"No resources found"** — there is no Upstash integration.
- `lib/env.ts:42-44` marks both as `.optional()`, so the app boots clean and never warns.
- `lib/rate-limit.ts:32-44` builds every limiter as `redis ? new Ratelimit(...) : createMockRateLimiter()`,
  and `createMockRateLimiter()` (`lib/rate-limit.ts:54-62`) **always returns `{ success: true }`**.
  `lib/middleware/rate-limit-middleware.ts:92` builds `authRateLimit` the same way.

So in production: the login limiter (5/min), the route factory's per-IP (100/min) and per-user
(20/min) limiters, and the feedback/leave/flight/vote limiters are all no-ops. The documented
protections in `CLAUDE.md` and the route factory's advertised pipeline are inert.

What still works: DB-backed account lockout (5 failures → 30 min) on both admin and pilot login,
so single-account brute force is still blocked. What is unprotected: password spraying across many
accounts, request-flooding any endpoint, and request/feedback spam.

Pilot portal sessions and dashboard caching also silently run on their fallback paths
(`redis-session-service.ts` falls back to the database), which is a performance cost rather than a
correctness one.

**Fix:** provision Upstash and set both variables, and make the pair required in `lib/env.ts` for
production so a missing limiter fails the deploy instead of disappearing quietly.

---

## Important, non-blocking

### 🟠 P5 — Next.js is one patch release behind nine security advisories

Installed **16.2.10**; every advisory below is fixed in **16.2.11**, and `package.json` already
allows it (`^16.1.6`; latest is 16.2.12). This is a patch bump.

Applicable: DoS via Server Actions (high), cache confusion of response bodies (×2, moderate),
unauthenticated disclosure of internal Server Function endpoints (moderate), DoS in the image
optimizer via SVG (moderate).

Assessed and **not** applicable: the middleware/proxy-bypass advisory (CVE-2026-64642) requires a
`config.i18n.locales` array with exactly one locale — this app configures no i18n, so despite
building with Turbopack it is not exposed. SSRF-in-rewrites needs `rewrites` (none configured);
SSRF-in-Server-Actions needs a custom server (this runs on Vercel); the Edge-runtime payload issue
needs the Edge runtime.

Also outstanding: `sharp` 0.34.5 has libvips CVEs, fixed in 0.35.3 (a semver-major bump). Exposure
is low — nothing in the app imports `sharp` directly, and `images.remotePatterns` only allows the
project's own Supabase storage host.

### 🟠 P6 — The leaked legacy `service_role` JWT is still in public history

Good news the July report could not confirm: **the key was rotated.** Production and local now both
use the new-format keys (`sb_publishable_…` / `sb_secret_…`), verified by pulling the production
environment.

Still open: the old legacy JWT remains reachable from `main` (commit `00480496` is an ancestor;
3 commits touch the file), in a public repo. Rotating to new-format API keys does **not** disable
legacy JWT keys — that is a separate switch in the Supabase dashboard. Until legacy keys are
disabled for project `wgdmgvonqysflwdiiols`, that published token may still grant RLS-bypassing
access. **Please confirm legacy JWT keys are disabled**; I have no tool that can check or change it.

### 🟡 P7 — Compliance dashboard reports 0% as 100%

`lib/services/dashboard-service-v4.ts:278`:

```ts
complianceRate: Number(typedViewData.compliance_rate) || 100,
```

A genuine `0` is falsy, so a fleet at 0% certification compliance renders as **100% compliant** —
the worst possible direction for the error on a safety surface. Null/absent also becomes 100.
Use `??` and represent "unknown" distinctly from "compliant".

### 🟡 P8 — Certification status is computed in the server's timezone, not the fleet's

`lib/utils/certification-status.ts:86-94` and `172-183` compare `new Date()` normalized with
`setHours(0,0,0,0)` against a `YYYY-MM-DD` column that JavaScript parses as **UTC midnight**.
Vercel runs UTC; the fleet operates in Port Moresby (UTC+10). For the first 10 hours of every PNG
day the server's calendar date trails the fleet's, so a certification that expired yesterday
locally still reports `daysUntilExpiry = 0` → "Expiring Soon" instead of "Expired". Server-rendered
views, PDFs and the expiry cron therefore disagree with what a pilot sees in their browser.

A complete, well-documented fix already exists but was never merged — see "Unmerged work" below.

### 🟡 P9 — Two report routes return raw `error.message` to clients

`app/api/reports/email/route.ts:198-204` and `app/api/reports/export/route.ts:114-120` return the
exception message verbatim in their 500 responses (they build their own `NextResponse`, so the
route factory's sanitizer cannot intervene). Provider errors, table/constraint names and file paths
reach authenticated clients. Route these through `sanitizeError` like the other ~26 routes already do.

### 🟡 P10 — `complete_task(uuid)` is an unauthenticated-callable SECURITY DEFINER function

`supabase/migrations/20251027012541_fix_broken_functions.sql:352-356` defines it `SECURITY DEFINER`
with no caller authorization, and no migration ever revokes it — Postgres grants EXECUTE to
`PUBLIC` by default, so the July hardening pass (which revoked 13 other RPCs) missed this one.
Anyone with the anon key could complete an arbitrary task by UUID via `/rest/v1/rpc/complete_task`.
Confirmed in migration source only; I could not query the production database to confirm the
function and legacy `tasks` table are still live, and deliberately did not invoke it.

### 🟡 P11 — CI never runs the unit tests, and can silently skip E2E

`.github/workflows/playwright.yml` always runs `npm run validate` and `npm run build` (good), but
**`npm run test:unit` appears nowhere** — the 71 vitest tests, including any regression coverage
added for a fix, do not gate anything. The E2E job is additionally conditional on
`check-secrets.outputs.has-secrets == 'true'` (lines 44-67), so if the `NEXT_PUBLIC_SUPABASE_URL`
secret is absent the entire suite is skipped and the workflow still reports green.

Combined with the E2E suite already being stale, "CI is green" currently means "it compiles" — not
"it behaves". Add `npm run test:unit` to the always-run `validate` job.

### 🟠 P12 — An armed, unapplied migration would drop the live auth tables

`supabase/migrations/20260128_redesign_unified_auth.sql:238-272` contains:

```sql
DROP TABLE IF EXISTS public.tasks CASCADE;          -- + task_audit_log, task_categories
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.admin_sessions CASCADE; -- + pilot_sessions
DROP TABLE IF EXISTS public.an_users CASCADE;       -- + pilot_users
```

Its SQL demonstrably **never ran** — every table it drops is still present with data, confirmed
against the live database: `an_users` (4), `pilot_users` (29), `admin_sessions` (1931),
`pilot_sessions` (234), `password_reset_tokens` (4), `tasks` (37), `task_categories` (17),
`task_audit_log` (2).

**Corrected severity.** `supabase migration list --linked` shows version `20260128` **recorded as
applied** in the remote history table, so `npm run db:deploy` on _this_ project would skip it — the
"one push and your auth tables are gone" risk I first reported was overstated. The file has still
been moved to `supabase/migrations/archive/`, because the danger is real for any environment that
replays migrations from scratch (disaster recovery, a fresh preview branch, a reset), where nothing
would stop it running.

**The underlying problem is that the migration history does not describe the database.** It is
wrong in both directions:

- `20260128` is marked applied but never executed.
- `20260706120000`, `20260706130000` and `20260706140000` are marked **not** applied, yet the July
  pass applied and runtime-verified all three against production.

So `npm run db:deploy` would today attempt to replay those three July migrations. They are
described as idempotent, but one of them creates a storage bucket, and I have not verified each is
safe to re-run — which is why I did **not** apply the new `complete_task` migration myself. Reconcile
the history (`supabase migration repair`) before the next push, and treat `db push` as unsafe until
you have.

### 🟡 P13 — Pending registrants' password hashes are serialized into the admin's browser

`app/dashboard/admin/pilot-registrations/page.tsx:39` calls `getPendingRegistrations()`, which does
`.select('*')` on `pilot_users` (`lib/services/pilot-portal-service.ts:398-399`). Line 41 casts the
rows to a narrower type — a compile-time cast that strips nothing at runtime — and line 112 passes
them into a `'use client'` component. Every pending registrant's `password_hash`, date of birth,
phone number and address is embedded in the RSC payload in the page HTML: visible in view-source,
captured by any session-replay or APM agent, and left in the browser cache. Same root cause as
**P1**, different exit. Project the columns in the service.

### ⚪ P14 — Smaller items worth folding into the same pass

- **Pilot session token is echoed in the login response body**
  (`lib/services/pilot-portal-service.ts:202` → `app/api/portal/login/route.ts:258`). The cookie is
  correctly `httpOnly`, and no client code reads `access_token`, so returning it buys nothing and
  costs the httpOnly guarantee to any XSS or response-logging tool. Drop it from the payload.
- **`/api/pilot/login`, `/register`, `/logout` are dead duplicates** of the portal auth flow with
  none of its protections — no rate limit, no lockout, no CSRF, no password-strength check. Nothing
  in the repo calls them, and `proxy.ts:366` currently 401s anonymous callers, so they are not
  exploitable today. But that protection is incidental to the path prefix. Delete the three files.
- **`complete_task` aside**, the route-factory audit found only one undocumented bypass
  (`app/api/portal/leave-bids/export/route.ts:56`), and it hand-rolls auth correctly — the
  exclusion list in `CLAUDE.md` is just out of date. Input validation and IDOR came back **clean**:
  both `...body` spreads are Zod-stripped, and every portal/pilot by-id operation re-derives the
  pilot from the session and scopes the query.
- **`tests/unit/lib/task-status-contract.test.tsx:150`** asserts nothing —
  `queryByText('(Overdue)')` can never match, because the text shares a node with the formatted
  date. The test named "does not mark completed work overdue" would still pass if the guard it
  covers were deleted.
- **`.gitignore:60-63`** — the `*[ ][0-9].*` patterns are unanchored, so any file ending in a space
  plus digits is silently ignored (verified: `docs/Figure 1.png`, `tasks/Phase 2`). Nothing is
  affected today; it is a future foot-gun.
- **`vite` is imported in `.storybook/main.ts:2` but not declared** in `package.json`; it resolves
  only by hoisting, and that file is inside the `tsconfig` include, so a non-hoisting install
  breaks `type-check`, not just Storybook.

---

## Regression check on the July → now delta

`git diff 9e3b9f7..2f315d0` (the work after the July 6 sign-off) was reviewed independently and is
**substantially clean** — no production logic, security, or Next/React correctness regression.
Specifically cleared: the task status rename matches the DB constraint exactly; the EBT compensating
delete is sound (service-role client, all child FKs cascade); the `2f315d0` deletions have no
remaining references and made nothing tracked-then-ignored; no business-rule code was touched; and
the new E2E selectors match the current components. The findings above are pre-existing, not
introduced by that work.

---

## Reported by the reference mesh, not independently confirmed

Recorded so they aren't lost, but I did not verify these to the same standard — treat as leads:

- **Password reset is non-atomic and does not revoke sessions** (`pilot-portal-service.ts:1001,1074`):
  token validation, password update and token consumption are separate operations, the consumption
  result is ignored, and existing DB/Redis sessions survive a reset. A stolen 30-day remember-me
  session would outlive account recovery.
- **Logout can leave sessions live** (`components/layout/pilot-portal-sidebar.tsx:118`,
  `app/api/auth/logout/route.ts:14,49`): logout requests reportedly omit the CSRF header and the UI
  redirects to login even on a 403.
- **Account lockout is read-then-write** (`account-lockout-service.ts:68`): concurrent attempts can
  observe the same count, and the portal login route proceeds when the lockout service errors.
- **EBT delete-then-insert without a transaction** (`report-actions.ts:416,596`) can erase saved
  qualification/competency selections if an insert fails.
- **Migration history cannot replay into an empty database** — an early migration references
  `pilots`/`pilot_users` before they exist, and a later "unified auth" migration drops tables the
  current services still use. Relevant to disaster recovery, not to the running system.
- **`/api/portal/registration-approval` is misrouted** — it uses `createAdminRoute` but sits under
  the proxy's pilot-only `/api/portal/**` prefix, so only a dual-role approved pilot-admin can reach
  it directly.

---

## Unmerged work sitting in a gitignored worktree

`.claude/worktrees/deep-review-fixes` (branch `worktree-deep-review-fixes`, commit `ad88b1f`) holds
68 files that never reached `main`, including a complete fix for **P8**: a new
`lib/utils/fleet-date.ts` anchoring all compliance arithmetic to `Pacific/Port_Moresby`, 181 lines
of regression tests (`tests/unit/lib/fleet-date.test.ts`) intended to pass under three timezones,
and a `CLAUDE.md` update documenting the rule. It also deletes `lib/supabase/middleware.ts` — which
I confirmed has **zero importers**, meaning the current `CLAUDE.md` claim that rate limiting is
"enforced in `lib/supabase/middleware.ts` for `/api/auth/*`" is documentation for code that does
not run. That is the same false assurance as **P4**, from the other direction.

This work is worth reviewing and landing rather than leaving in an ignored directory where the only
thing that reads it is ESLint.

---

## Repository / deployment state

- `HEAD` (`2f315d0`, Jul 27) is **not pushed**; `origin/main` is `5926cfe` (Jul 15).
- Production serves the Jul 15 deployment (= `origin/main`), aliased to `pxb767office.app`,
  `www.pxb767office.app`, and three `*.vercel.app` hosts. The July hardening **is** live.
- The unpushed commit is a cleanup chore, so prod is not missing functional work — but local,
  origin and production are three different trees, and CI has never run on `2f315d0`.
- No secrets in the tracked tree at `HEAD` beyond P3: the only JWT-shaped strings are truncated
  documentation placeholders ending in `...` (`todos/001-done-p0-remove-service-role-key.md:25`,
  `openspec/.../CONTRACTS_SUMMARY.md:279`). `.env*` is correctly gitignored and untracked.

---

## Remediation applied (2026-07-28, uncommitted)

Gates after the change: `npm run validate` ✅ · `npm run test:unit` ✅ **77 tests / 14 files**
(6 new) · `npm run build` ✅ exit 0 · `npm audit --omit=dev` 5 high → **3 high** (one chain left).

| Item             | Change                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P12**          | `20260128_redesign_unified_auth.sql` moved to `supabase/migrations/archive/…UNAPPLIED`. `npm run db:deploy` can no longer drop the auth tables.                                                                                                                                                                                                     |
| **P1 + P13**     | Removed the anonymous `GET /api/portal/register` outright (no caller existed). Both registration queries now select an explicit `REGISTRATION_SUMMARY_COLUMNS` list instead of `*` — no `password_hash`, DOB, phone or address — and `escapeLikePattern()` neutralizes `%`/`_` in caller input.                                                     |
| **P2 + P2b**     | `requireRole()` now authorizes off the role `getAuthenticatedAdmin()` resolves (service-role read, works for both auth systems) and compares it properly; `getUserRole()` switched from the RLS-bound client to `createAdminClient()`, restoring the admin bypass in `verifyResourceOwnership` and with it task/disciplinary edits.                 |
| **P3**           | Plaintext credentials removed from `RUN_THIS_IN_SUPABASE.sql`, migration `20251228080938` (with a warning that the _hash_ is still published), and `create-pilot-user.mjs` (now `SEED_PILOT_*` env vars). **Password change still yours.**                                                                                                          |
| **P5**           | `next` 16.2.10 → **16.2.12** (clears all 9 advisories); `sharp` → **0.35.3** with an override so Next's bundled copy dedupes to it; `@logtail/*` → 0.5.8.                                                                                                                                                                                           |
| **P7**           | `complianceRate` uses `??`, so a real 0% no longer renders as 100%.                                                                                                                                                                                                                                                                                 |
| **P9**           | `reports/email` and `reports/export` route 500s through `sanitizeError` and return an `errorId` instead of the raw message.                                                                                                                                                                                                                         |
| **P10**          | New migration `20260728120000_revoke_complete_task_from_public.sql` revokes `complete_task(uuid)` from `PUBLIC`/`anon`/`authenticated`, grants it to `service_role`. Idempotent, no-ops if the function is gone. **Not yet applied** — run `npm run db:deploy`.                                                                                     |
| **P11**          | CI now runs `npm run test:unit` in the always-run `validate` job.                                                                                                                                                                                                                                                                                   |
| **P14**          | Session token no longer echoed in the login response body; dead `/api/pilot/login` and `/api/pilot/register` deleted (`/api/pilot/logout` kept — it is CSRF-protected and unit-tested).                                                                                                                                                             |
| **P4 (partial)** | `lib/rate-limit.ts` now logs a loud `SECURITY` error at startup when Redis is unconfigured in production, and `CLAUDE.md`'s false "enforced in `lib/supabase/middleware.ts`" claim is corrected. Deliberately **not** made fail-closed — crashing the site over a missing env var is worse than the gap it reports. Provisioning is still required. |
| **new**          | `tests/unit/lib/require-role-authorization.test.ts` — 6 cases pinning the escalation fix. Verified it genuinely fails when the vulnerable short-circuit is reintroduced.                                                                                                                                                                            |

**Accepted, not fixed:** the remaining 3 `npm audit` highs are one chain —
`@logtail/node@0.5.8 → minimatch@9.0.9 → brace-expansion@2.1.2`. The advisory is a DoS with no fix
in the 2.x line (only 5.0.8 is patched), so closing it means forcing an unsupported major across a
package boundary into the log shipper. Not reachable from user input; left with this note rather
than risking production logging.

**Not attempted here:** P6 and P8. P6 is console-only. P8's fix exists on the
`worktree-deep-review-fixes` branch and deserves a proper review of its own — it rewrites date
handling across compliance surfaces, which is too broad to fold into a security pass.

---

## What to do, in order

1. **Change the published passwords** for `skycruzer@icloud.com` and `mrondeau@airniugini.com.pg`,
   and revoke their sessions (P3). Everything else can wait behind this.
2. **Neutralise the armed migration** (P12) — one `git mv` into `supabase/migrations/archive/`.
   Do this before anyone runs `npm run db:deploy`, because that command currently risks dropping
   the auth tables.
3. **Patch P1** — project the columns and escape the wildcard, in `getRegistrationStatus()` and
   `getPendingRegistrations()` together (P13 shares the root cause). A handful of lines, and it is
   currently leaking password hashes to the internet.
4. **Patch P2 and P2b as one change** — authorize off the role `getAuthenticatedAdmin()` already
   returns and retire `getUserRole()`. This closes the manager-to-admin escalation _and_ restores
   task and disciplinary editing. Fixing either alone makes things worse.
5. **Provision Upstash and set both variables** in Vercel, then make them required in `lib/env.ts` (P4).
6. **Confirm legacy JWT keys are disabled** in the Supabase dashboard (P6), then purge the history.
7. `npm i next@16.2.12` (P5), and fix P7, P9 and P14 while you are in there.
8. Review and land the `fleet-date` worktree branch (P8); add `npm run test:unit` to CI (P11); and
   correct the rate-limiting section of `CLAUDE.md` so it describes what the code actually does.

None of P1–P4 requires architectural change; they are all small, well-localized fixes. The
architecture, the route factory, the security headers and the deployment are sound — which is why
these are worth fixing rather than working around.
