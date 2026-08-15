# Production-Readiness Review — 2026-08-15

Branch `san-jose` (= `origin/main` @ `0d5fbf4`). Production runs that same commit, deployed Jul 31.

## Starting verdict: NOT production ready

The code was fine. **The database was not.** Five migrations that shipped with PRs #77 and #81 were
never applied, so deployed code was running against an un-hardened, un-migrated database.

## Method

Hard gates on this tree (all green before any change):

- [x] `npm run validate` — exit 0 (type-check, lint, format, RLS guard, credential guard)
- [x] `npm run test:unit` — 165 tests / 31 files
- [x] `npm run build` — exit 0
- [x] `npm audit --omit=dev` — 0 vulnerabilities
- [x] Prod HTTP probes — health 200, auth gates 401/307

Then the part the July pass skipped: compare the **deployed** database against the repo.
`supabase migration list --linked` showed 9 local migrations with `remote = ""`. Each was checked
against the live schema rather than trusted.

| Migration                                          | Ledger | Really applied? | Evidence                                                    |
| -------------------------------------------------- | ------ | --------------- | ----------------------------------------------------------- |
| `20260706120000_prod_hardening_ebt_and_history`    | no     | yes             | `has_schema_privilege('anon','ebt','USAGE')` = false        |
| `20260706130000_create_ebt_signatures_bucket`      | no     | yes             | `storage.buckets` row `signatures` exists                   |
| `20260706140000_followup_revoke_anon_audit_writes` | no     | yes             | anon holds no grants on `audit_logs`                        |
| `20260728120000_revoke_complete_task_from_public`  | no     | no              | `complete_task` ACL still `anon=X, authenticated=X, PUBLIC` |
| `20260731090000_lockdown_pilot_users`              | no     | no              | anon REST read of `pilot_users` returned `password_hash`    |
| `20260731090100_lockdown_settings_tasks_anon`      | no     | no              | anon REST read of `settings`, `tasks`, `task_categories`    |
| `20260731090200_atomic_leave_approval`             | no     | no              | `approve_leave_request_atomic` absent from prod             |
| `20260731163000_atomic_pilot_password_reset`       | no     | no              | `consume_pilot_password_reset` absent from prod             |
| `20260815145319_reconcile_notification_recipients` | no     | no              | trigger absent from prod                                    |

The ledger lied in both directions: three applied-but-unrecorded, five recorded-as-local but
genuinely missing. It also carried a phantom `20260128` marked applied whose SQL never ran —
`an_users`, `pilot_users` and `tasks` all still exist, and that migration would have dropped them.

## Blockers — all FIXED and verified live

- [x] **B1 — CRITICAL, live credential exposure.** Anyone holding the public anon key could
      `GET /rest/v1/pilot_users?select=password_hash` and receive bcrypt hashes plus full pilot PII.
      Verified before: HTTP 200 + a 60-character hash. Cause: policy
      `pilot_users_public_read_for_login` (`TO public`, `USING registration_approved = true`) plus
      `GRANT ALL ... TO anon` inherited from the original schema dump.
      Fixed by applying `20260731090000`. **Now 401 `permission denied for table pilot_users`.**
- [x] **B2 — CRITICAL, feature broken in prod.** Admin leave approval calls
      `approve_leave_request_atomic`, which did not exist. Every approval failed.
      Fixed by applying `20260731090200`. Function now present, ACL `service_role` only.
- [x] **B3 — CRITICAL, feature broken in prod.** Pilot password reset calls
      `consume_pilot_password_reset`, which did not exist. Every reset failed.
      Fixed by applying `20260731163000`. Function now present, ACL `service_role` only.
- [x] **B4 — HIGH.** `pilot_user_mappings` was anon-readable (verified 200 + row). It is a VIEW,
      not a table, so it needed grant removal rather than RLS — the first attempt failed with
      SQLSTATE 42809 and was rewritten. New migration
      `20260815160000_lockdown_pilot_user_mappings.sql`. **Now 401.**
- [x] **B5 — HIGH.** Anonymous read of `settings`, `tasks`, `task_categories`.
      Fixed by applying `20260731090100`. **All three now 401.**
- [x] **B6 — MEDIUM, and a trap.** `20260728120000` applied cleanly but did **nothing**: it guarded
      on `pg_get_function_identity_arguments(oid) = 'uuid'`, and this server returns
      `p_task_id uuid`, so the `DO` block's `IF` was never true. A security migration that reports
      success and changes nothing. Re-fixed without a guard in
      `20260815170000_revoke_security_definer_from_anon.sql`.
- [x] **B7 — NEW, found during verification.** 37 non-trigger SECURITY DEFINER functions were
      executable by `anon` over PostgREST, bypassing RLS. Five were confirmed live: fleet
      compliance %, expiry statistics, check-category distribution, the 12-month expiry series and
      the fleet expiry summary all returned 200 to an anonymous caller.
      Fixed in `20260815170000`. **All five now 401.** The four functions referenced inside RLS
      policies (`is_admin`, `is_admin_or_manager`, `current_user_is_an_admin`, `user_owns_leave_bid`)
      were deliberately left alone — policy expressions run as the querying role, so revoking them
      would break every authenticated read.
- [x] **B8 — LOW.** `set_pilot_documents_updated_at()` had a mutable `search_path`.
      Fixed in `20260815180000`. Security advisors now report 0 findings of that type.

## Verified after the fixes

- Anon REST sweep: `pilot_users`, `pilot_user_mappings`, `settings`, `tasks`, `task_categories`,
  `notifications` → **401**. `pilots` → 200 with 0 rows (RLS).
- Anon RPC sweep: the five leaking statistics functions → **401 permission denied**.
- Only 4 SECURITY DEFINER functions remain anon-executable, all policy helpers, all intentional.
- 19 trigger functions still show in the advisor report. Not reachable: PostgREST returns
  **404 PGRST202** for every one, because it does not expose trigger-returning functions. Left
  alone rather than risk a live trigger for a false positive.
- `supabase db advisors --type security`: **0 ERROR**.
- Production still healthy after every change: `/api/health` 200 (DB connected, 37 pilots,
  dashboard metrics loading), landing/portal login 200, `/dashboard` + `/portal/dashboard` 307,
  `/api/pilots` 401.

## Still open

- [ ] **N1 — user action.** Upstash Redis is still absent from Vercel Production.
      `vercel env ls production` lists 7 vars, neither `UPSTASH_*`. The in-process fallback limiter
      does enforce, but per instance, so the real budget scales with warm instance count. Sessions
      fall back to the DB.
- [ ] **N2 — user action.** `LOGTAIL_SOURCE_TOKEN` absent in Production → no structured logs
      shipping.
- [ ] **N3 — cleanup.** `ENABLE_CSRF_PROTECTION` is set in Preview only and no code reads it.
- [ ] **N4 — user action, recommended.** The pilot bcrypt hashes were publicly readable until
      today. Migration `20260731090000`'s own header says to treat them as compromised. Force a
      password reset for all portal accounts.
- [ ] **N5 — smoke test.** Leave approval and pilot password reset are un-broken at the DB level
      but were not exercised end to end (needs real credentials).

## Uncommitted work found in this tree (not authored by this review)

- Dependency bump: `puppeteer` 24→25, `postcss` 8.5.26, engines `>=22.12.0`, CI Node 20→22,
  security overrides (`dompurify`, `js-yaml`, `undici`, `brace-expansion`).
- `retirement-forecast-service.ts`: puppeteer `networkidle0` → `load`.
- Notification fix: `createPilotNotificationForPilotId()` resolving `pilots.id` → `pilot_users.id`,
  plus migration `20260815145319` and two new test files.
- Test-password literals replaced with `randomUUID()`.

All gates pass with these changes included.

## Remaining steps

- [x] Repair the migration ledger (3 marked applied, phantom `20260128` marked reverted)
- [x] Apply all 9 pending migrations to production
- [x] Re-verify every fix against live production
- [x] Regenerate `types/supabase.ts`
- [ ] Commit, PR to `main`, watch CI on the exact head SHA
- [ ] Rewrite `PRODUCTION-READINESS.md`
