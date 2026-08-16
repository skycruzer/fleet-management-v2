# Production Readiness Report

**Reviewed at:** `main` @ `0d5fbf4` · **Shipped as:** `4a60d6b` (PR #85) · **Date:** 2026-08-15
**Method:** hard gates on the working tree, then a direct comparison of the **deployed database**
against the repo, then live probes of `https://www.pxb767office.app` and the Supabase REST API with
the public anon key.

> Supersedes the 2026-07-28 report (kept in git history). That report's verdict — "✅ production
> ready" — was true of the code and false of the deployment. Every defect below existed while that
> report was green, because the July pass verified the code it wrote and the HTTP surface, but never
> asked whether the database migrations that shipped alongside it had actually been applied.

## Verdict: ✅ Production ready

Eight defects were found and fixed, including a **live credential exposure**. All fixes are applied
to the production database and verified by measurement.

### The root cause of all of it

`supabase migration list --linked` showed nine local migrations with no remote counterpart. The
migration ledger was wrong in both directions:

| Migration                                          | Ledger said | Reality | Evidence                                                    |
| -------------------------------------------------- | ----------- | ------- | ----------------------------------------------------------- |
| `20260706120000_prod_hardening_ebt_and_history`    | not applied | applied | `has_schema_privilege('anon','ebt','USAGE')` = false        |
| `20260706130000_create_ebt_signatures_bucket`      | not applied | applied | `storage.buckets` row `signatures` exists                   |
| `20260706140000_followup_revoke_anon_audit_writes` | not applied | applied | anon holds no grants on `audit_logs`                        |
| `20260728120000_revoke_complete_task_from_public`  | not applied | missing | `complete_task` ACL still `anon=X, authenticated=X, PUBLIC` |
| `20260731090000_lockdown_pilot_users`              | not applied | missing | anon REST read returned `password_hash`                     |
| `20260731090100_lockdown_settings_tasks_anon`      | not applied | missing | anon REST read of `settings`, `tasks`, `task_categories`    |
| `20260731090200_atomic_leave_approval`             | not applied | missing | `approve_leave_request_atomic` absent                       |
| `20260731163000_atomic_pilot_password_reset`       | not applied | missing | `consume_pilot_password_reset` absent                       |
| `20260815145319_reconcile_notification_recipients` | not applied | missing | recipient-validation trigger absent                         |

It also carried a phantom `20260128` marked **applied** whose SQL never ran — `an_users`,
`pilot_users` and `tasks` all still hold data, and that migration would have dropped them CASCADE.

PRs #77 and #81 shipped code and migrations together. The code deployed to Vercel on Jul 31. The
migrations never ran. Production spent 15 days running new code against an old database.

## Defects found and fixed

| #   | Severity | Defect                                                                   | Status                            |
| --- | -------- | ------------------------------------------------------------------------ | --------------------------------- |
| B1  | CRITICAL | `pilot_users.password_hash` + full pilot PII readable with the anon key  | Fixed — now 401                   |
| B2  | CRITICAL | Leave approval calls `approve_leave_request_atomic`, which did not exist | Fixed — function present          |
| B3  | CRITICAL | Password reset calls `consume_pilot_password_reset`, which did not exist | Fixed — function present          |
| B4  | HIGH     | `pilot_user_mappings` view anon-readable (pilot email, name, rank)       | Fixed — now 401                   |
| B5  | HIGH     | `settings`, `tasks`, `task_categories` anon-readable                     | Fixed — all 401                   |
| B6  | MEDIUM   | `20260728120000` applied cleanly but was a silent no-op                  | Fixed — re-done without the guard |
| B7  | MEDIUM   | 37 SECURITY DEFINER functions anon-executable, bypassing RLS             | Fixed — 5 confirmed leaks now 401 |
| B8  | LOW      | `set_pilot_documents_updated_at()` had a mutable `search_path`           | Fixed — advisors clean            |

### B1 — live credential exposure

Policy `pilot_users_public_read_for_login` was scoped `TO public` with
`USING (registration_approved = true)`, and the original schema dump's `GRANT ALL ... TO anon` had
never been revoked. Together they made the pilot portal's credential store readable by anyone.

Measured before: `GET /rest/v1/pilot_users?select=password_hash&limit=1` with the public anon key →
**HTTP 200 and a 60-character bcrypt hash**. Also exposed: email, first/last name, employee_id,
rank, date_of_birth, phone_number, address, seniority_number.

Measured after: **HTTP 401**, `permission denied for table pilot_users`.

### B6 — the trap worth remembering

`20260728120000_revoke_complete_task_from_public.sql` guarded its work on
`pg_get_function_identity_arguments(p.oid) = 'uuid'`. This server returns `p_task_id uuid` for that
function, so the `IF` was never true, the `DO` block did nothing, and the migration reported
success. **A security migration that succeeds and changes nothing looks exactly like one that
worked.** Verify the effect, not the exit code.

### B7 — the class the earlier passes accepted

PostgreSQL grants EXECUTE to PUBLIC by default, so every `SECURITY DEFINER` function in `public` was
callable as `/rest/v1/rpc/<name>` with the anon key — and SECURITY DEFINER bypasses RLS. Five were
confirmed leaking live to an anonymous caller:

- `get_fleet_compliance_stats` → 200, fleet compliance percentage
- `get_expiry_statistics` → 200, expired / expiring counts
- `get_check_category_distribution` → 200, per-category check counts
- `get_monthly_expiry_data` → 200, 12-month expiry series
- `get_pilot_fleet_expiry_statistics` → 200, expiry summary

All five now return **401 permission denied**.

Four functions were deliberately left anon-executable: `is_admin()`, `is_admin_or_manager()`,
`current_user_is_an_admin()` and `user_owns_leave_bid()`. They are referenced inside RLS policy
expressions, which run as the querying role — revoking them would make every authenticated read
fail. They return only booleans about the caller.

Nineteen trigger functions still appear in the Supabase advisor report. They are not reachable:
PostgREST returns **404 PGRST202** for each, because it does not expose trigger-returning functions.
They were left alone rather than risk a live trigger to silence a false positive.

## Verification after remediation

Anonymous REST sweep with the public anon key:

| Target                             | Before      | After             |
| ---------------------------------- | ----------- | ----------------- |
| `pilot_users`                      | 200 + row   | **401**           |
| `pilot_users?select=password_hash` | 200 + hash  | **401**           |
| `pilot_user_mappings`              | 200 + row   | **401**           |
| `settings`                         | 200 + row   | **401**           |
| `tasks`                            | 200 + row   | **401**           |
| `task_categories`                  | 200 + row   | **401**           |
| `notifications`                    | 200, 0 rows | **401**           |
| 5 statistics RPCs                  | 200 + data  | **401**           |
| `pilots`                           | 200, 0 rows | 200, 0 rows (RLS) |

Database:

- `approve_leave_request_atomic` and `consume_pilot_password_reset` exist, ACL `service_role` only
- `complete_task(uuid)` ACL `service_role` only
- `supabase db advisors --type security` → **0 ERROR**
- Migration ledger and database now agree

Application, after every change:

- `/api/health` → 200, DB connected, 37 pilots, dashboard metrics loading
- `/` and `/portal/login` → 200 · `/dashboard`, `/portal/dashboard` → 307 · `/api/pilots` → 401

Working tree gates: `npm run validate` exit 0 · `npm run test:unit` 165 tests / 31 files ·
`npm run build` exit 0 · `npm audit --omit=dev` 0 vulnerabilities.

## Post-merge remediation (same day)

- **N4 — DONE.** `pilot_users.must_change_password` set to `true` for all 29 accounts (28 updated,
  1 already set). Enforcement was verified in code before the data change:
  `app/portal/(protected)/layout.tsx:47` redirects when the flag is on, and
  `app/portal/change-password/page.tsx` sits outside the `(protected)` group so there is no redirect
  loop; `proxy.ts` permits any `/portal/*` path for a valid session, so it does not fight the
  redirect. The form requires the old password, so this is a forced _change_, not a lockout.
  Sessions were deliberately not revoked — `pilot_sessions` has been anon-401 since
  `20260703000001`, so no token was ever exposed, and the layout catches logged-in pilots on their
  next page load.
- **N5 — DONE at the DB layer.** Both restored functions were smoke-tested against production with
  inputs that touch no real data: `approve_leave_request_atomic` with a non-existent request id
  returned `{"success": false, "reason": "Request not found"}` (the function executes and reports
  properly), and `consume_pilot_password_reset` with a bogus token returned `null`, which
  `pilot-portal-service.ts` maps to "Invalid or expired reset link". Full UI walkthrough still needs
  real credentials.
- **N3 — DONE.** `ENABLE_CSRF_PROTECTION` deleted from Preview. It was already removed from
  Production in June 2026. No code reads it — `validateCsrf()`
  (`lib/middleware/csrf-middleware.ts:157`) enforces unconditionally.

## N1 — Upstash Redis: DONE

The resource `fleet-management-redis` (Upstash for Redis, primary region `sin1`, matching the
Supabase project's `ap-southeast-1`) is provisioned and connected to Production, Preview and
Development.

**The gap that mattered.** The integration injects `KV_REST_API_URL`, `KV_REST_API_TOKEN`,
`KV_REST_API_READ_ONLY_TOKEN`, `KV_URL` and `REDIS_URL`. The code reads none of those — it reads
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (`lib/rate-limit.ts:34`,
`lib/middleware/rate-limit-middleware.ts:33`, `lib/services/redis-cache-service.ts:39`,
`lib/services/redis-session-service.ts:89`). Provisioned-but-unread would have looked exactly like
provisioned-and-working from the dashboard. Two aliases were added in all three environments,
pointing at the same credentials, and production was redeployed to pick them up. The code was not
changed.

**Verified, in order:**

1. `GET <upstash>/ping` → `PONG`; `dbsize` → 0 on a fresh database.
2. After production traffic, `dbsize` → 13 with keys written by the app itself:
   `dashboard:metrics:v3` (dashboard cache), `tag:pilots` / `tag:certifications` / `tag:dashboard`
   (cache invalidation), and `ratelimit:auth-middleware:<ip>:<window>` (the limiter).
3. The `ratelimit:auth-middleware` prefix and its 5-per-minute sliding window match
   `lib/middleware/rate-limit-middleware.ts:93-95`, which proves the **Redis-backed** limiter is
   running and not `lib/rate-limit-fallback.ts`.
4. Counter values read back as real per-IP integers.

**Why no 429 appeared in the probe, and why that is not a defect.** 48 POSTs to
`/api/portal/register` all returned 403 (CSRF), never 429. Reading Redis explains it: those requests
arrived from **30 distinct source IPs**, and every bucket held `value=1`. The limiter is per-IP at
5/min, so no bucket came close. The reviewing sandbox egresses through a rotating address pool; the
July 2026 probe that did produce a 429 ran from a single address. Rate limiting is enforcing — this
environment simply cannot exercise it. A same-IP burst is still worth running from a normal network.

## N2 — Better Stack logging: DONE

Two sources created on the Better Stack free tier (1 GB/month, 3-day log retention), both platform
`JavaScript • Node.js`:

| Source                         | Ingesting host                               | Env vars                                                                 |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------ |
| `Fleet Management V2 - Server` | `s2682835.eu-central-1a.betterstackdata.com` | `LOGTAIL_SOURCE_TOKEN`, `LOGTAIL_INGESTING_HOST`                         |
| `Fleet Management V2 - Client` | `s2682840.eu-central-1a.betterstackdata.com` | `NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN`, `NEXT_PUBLIC_LOGTAIL_INGESTING_HOST` |

**This one needed a code change, for the same reason as the previous two items.** Sources created in
Better Stack's Telemetry UI ingest on a **per-source host**. `@logtail/node@0.5.8` still defaults to
the legacy shared endpoint. Measured against the live sources:

```
POST https://s2682835.eu-central-1a.betterstackdata.com  ->  202 Accepted
POST https://in.logs.betterstack.com                     ->  401 Unauthorized
```

Setting only the tokens — the obvious reading of "add `LOGTAIL_SOURCE_TOKEN`" — would have produced
a system that looks instrumented and ships nothing. The SDK batches asynchronously, so every `log()`
call still resolves and the rejected batch never surfaces.

`lib/utils/logtail-endpoint.ts` resolves the host for both runtimes and logs `[logtail] DEGRADED`
when a token is configured without one, so the failure cannot be silent again. The three
construction sites — `lib/services/logging-service.ts`, `lib/utils/error-sanitizer.ts` and
`app/api/reports/preview/route.ts` — pass it through.

Local `.env.local` deliberately does **not** carry these vars: local development keeps logging to
the console rather than consuming the 1 GB monthly quota.

### The second silent-drop, fixed in the same pass

Pointing the SDK at the right host is necessary but not sufficient. `@logtail/node` batches for
about a second and the send is fire-and-forget, while Vercel may freeze the invocation the moment a
response is returned. An error logged during a request was therefore liable to be discarded before
its batch was ever flushed — the logger reporting success the whole time.

`scheduleLogtailFlush()` closes that: it defers the flush with `after()` from `next/server`, which
keeps the invocation alive until the batch lands, and falls back to an un-awaited flush outside a
request scope (scripts, module init) where `after()` throws. Failures are swallowed and logged —
logging must never break the request it is describing.

**Covered by `tests/unit/lib/logtail-endpoint.test.ts` (9 tests), and the tests were
mutation-checked rather than assumed:**

| Bug reintroduced                          | Result           |
| ----------------------------------------- | ---------------- |
| `scheduleLogtailFlush` made a no-op       | **4 tests fail** |
| Configured endpoint ignored (the 401 bug) | **1 test fails** |

**Not yet observed end to end:** a log line originating from the deployed app. Only
`sanitizeError()` ships to Better Stack, so it fires on genuine 500-class errors, and none occurred
during verification — probe traffic produced 401s and 307s, which never reach it. The transport
itself is proven (`202 Accepted`, entry visible in Live tail). The first real production error will
confirm the rest.

## P1 — Function region: compute was on the wrong side of the Pacific

Found while re-checking the Vercel project after the logging work. `vercel.json` set no `regions`,
so functions defaulted to **`iad1` (Virginia)** while Supabase sits in `ap-southeast-1`, Upstash in
`sin1`, and the pilots using the app are in Papua New Guinea. Every query and every rate-limit check
crossed the Pacific twice.

Fixed with `"regions": ["sin1"]`. Measured against production, `/api/health`, 10 samples each:

|        | min    | median | mean   | max    |
| ------ | ------ | ------ | ------ | ------ |
| `iad1` | 1.446s | 1.595s | 1.774s | 2.552s |
| `sin1` | 1.002s | 1.259s | 1.434s | 2.009s |

**Median −21%, mean −19% — and that understates it.** The measurements were taken from Los Angeles,
so moving the function to Singapore _lengthened_ the measuring client's own network path. A static
control route with no database work went the other way over the same change, 1.532s → 1.653s
(+0.12s). Backing that out, the server-side saving is closer to **~0.46s**, and users in Papua New
Guinea gain on both legs rather than trading one for the other.

Still ~1.26s from Los Angeles, so round trips were not the only cost — the remaining time is worth a
separate look at how many sequential queries `/api/health` and the dashboard actually issue. Not a
blocker; recorded rather than guessed at.

## Open items

Everything from this review is closed. One follow-up worth its own pass: the sequential-query cost
noted in P1.

## The lesson, again

The July report recorded exactly the right lesson — "review the deployment, not just the diff" — and
then applied it only to Vercel env vars and HTTP responses. The database is part of the deployment.
`supabase migration list` is not evidence that a migration ran; the schema is. Check the effect.

**The same shape appeared four separate times in this review**, which is what makes it worth naming
rather than fixing case by case:

| Thing that looked done              | What was actually true                                      |
| ----------------------------------- | ----------------------------------------------------------- |
| Migration ledger said "applied"     | The SQL had never run                                       |
| `20260728120000` exited 0           | Its guard was false; it changed nothing                     |
| Upstash resource showed "Available" | The app read different env var names and never connected    |
| Better Stack tokens set             | The SDK's default endpoint 401s; every log silently dropped |

Each one reports success through the interface you would naturally check. The only reliable test is
to look for the **effect** — query the ACL, read the counter, scan for the keys, POST a log and
check the status code. Configuration is not evidence. Measure.
