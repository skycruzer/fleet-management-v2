# Production-Readiness Re-Verification (2026-07-28) — COMPLETE

Goal: full review and verify the project is production ready.
**Verdict: 🔴 NOT production ready.** Full report in PRODUCTION-READINESS.md.

- [x] Hard gates: validate ✅, build ✅, validate:naming ✅, test:unit ✅ (71 tests)
- [x] Runtime verification vs live prod: health ✅, auth gates hold ✅, security headers ✅
- [x] Service*role key: ROTATED ✅ (prod + local both on new `sb_secret*` format)
- [x] Git history: legacy JWT still reachable from main; repo is PUBLIC — purge still pending
- [x] MOA reference-mesh review (2 independent agents) + hand-verified every load-bearing finding
- [x] Compile verdict + rewrite PRODUCTION-READINESS.md

## Confirmed blockers found (detail in PRODUCTION-READINESS.md)

- [ ] **P1** `GET /api/portal/register` leaks full `pilot_users` row incl. `password_hash` to
      anonymous callers; `.ilike()` accepts `%` wildcard → dump newest account without any email
- [ ] **P2** `requireRole()` authorizes ANY admin-session for ADMIN-only routes without checking
      the role → managers can `POST /api/users` with `role: 'admin'` (privilege escalation)
- [ ] **P3** Working admin + pilot passwords committed in the PUBLIC repo (RUN_THIS_IN_SUPABASE.sql,
      migration 20251228080938, scripts/debug/create-pilot-user.mjs)
- [ ] **P4** Upstash Redis absent from Vercel prod → every rate limiter is a no-op mock
- [ ] **P5** Next 16.2.10 → 16.2.11+ fixes 9 advisories (proxy-bypass CVE assessed N/A: no i18n)
- [ ] **P6** Confirm legacy Supabase JWT keys are DISABLED (rotation alone doesn't revoke them)
- [ ] **P7** `complianceRate: Number(x) || 100` renders 0% compliance as 100%
- [ ] **P8** Certification status uses server TZ (UTC) not fleet TZ (UTC+10) → expired shows as
      "expiring" for 10h/day; fix already written in `.claude/worktrees/deep-review-fixes`, unmerged
- [ ] **P9** 2 report routes return raw `error.message` to clients
- [ ] **P10** `complete_task(uuid)` SECURITY DEFINER never revoked from PUBLIC
- [ ] **P11** CI never runs unit tests; E2E job silently skips when secrets absent
- [ ] **P2b** `getUserRole()` reads `an_users` with the anon client, but migration 20260703000001
      revoked that grant → always null → task + disciplinary PATCH/DELETE broken for all admins.
      MUST be fixed together with P2 (the obvious P2 fix routes through this and would lock out
      every admin route).
- [ ] **P12** `supabase/migrations/20260128_redesign_unified_auth.sql` is UNAPPLIED but armed and
      DROPs an_users/pilot_users/sessions/tasks CASCADE. `npm run db:deploy` (= `supabase db push`)
      could take prod down. Archive it.
- [ ] **P13** `getPendingRegistrations()` `.select('*')` → registrant password hashes + PII
      serialized into the admin browser's RSC payload (same root cause as P1)
- [ ] **P14** session token echoed in login response body; dead `/api/pilot/*` duplicates;
      no-op unit test; over-broad .gitignore; undeclared `vite` dep

## Remediation pass (2026-07-28) — CODE COMPLETE, uncommitted

Gates: validate ✅ · test:unit ✅ 77 tests / 14 files (6 new) · build ✅ exit 0 ·
prod audit 5 high → 3 high.

- [x] P12 archived armed destructive migration → `supabase/migrations/archive/…UNAPPLIED`
- [x] P1 + P13 removed anonymous GET; explicit column projection + LIKE-wildcard escaping
- [x] P2 + P2b authorize off getAuthenticatedAdmin(); getUserRole() → service-role client
- [x] P9 sanitizeError in reports/email + reports/export
- [x] P7 complianceRate `??` instead of `||`
- [x] P14 session token out of login response; deleted dead /api/pilot/{login,register}
      (kept logout — CSRF-protected + unit-tested)
- [x] P5 next → 16.2.12, sharp → 0.35.3 (+override), @logtail/\* → 0.5.8
- [x] P3 credentials scrubbed from tracked files
- [x] P10 migration 20260728120000 authored (NOT applied — run `npm run db:deploy`)
- [x] P11 test:unit added to CI validate job
- [x] P4 loud production warning + CLAUDE.md corrected (provisioning still required)
- [x] NEW regression test: tests/unit/lib/require-role-authorization.test.ts (proved it fails
      when the vulnerable short-circuit is reintroduced)

## Remediation applied to PRODUCTION (2026-07-28)

- [x] **Published passwords ROTATED + verified.** Admin hash was byte-identical to the one in the
      public repo (compromise was live). Both accounts now have strong random passwords, verified
      by read-back; sessions revoked (admin 1878, pilot 150; active admin sessions 1880 → 2).
      New passwords in `.env.rotated-credentials.local` (mode 600, gitignored) — USER: log in,
      change to your own, delete the file.
- [x] Verified leaked service_role JWT is DEAD (doesn't match either active legacy key → JWT
      secret was rolled). Legacy key types still enabled = hardening, not a blocker.

## BLOCKING — one item left

- [ ] **Provision Upstash** + set UPSTASH*REDIS_REST*{URL,TOKEN} in Vercel. User handles
      provisioning; then I wire vars + verify a real 429.

## Needs care — DO NOT run `npm run db:deploy` blindly

- [ ] Migration history is out of sync with the DB **in both directions**: `20260128` is marked
      applied but its SQL never ran (all its DROP targets still exist with data); the three
      `202607061x0000` July migrations are marked NOT applied but were applied + verified live.
      A push would replay those three (one creates a storage bucket). Run
      `supabase migration repair` first, THEN apply `20260728120000_revoke_complete_task_from_public.sql`.
- [ ] Commit + push (HEAD is unpushed; CI has never run on 2f315d0)

## Deferred by design

- [ ] Disable legacy JWT key types + purge git history — now hygiene, not incident response
- [ ] P8 fleet-timezone fix exists on `worktree-deep-review-fixes`; rewrites date handling across
      compliance surfaces — wants its own review, not a fold-in to a security pass
- [ ] 3 remaining audit highs = @logtail/node → minimatch → brace-expansion; no fix in the 2.x
      line, DoS only, not user-reachable. Accepted with rationale.

## Notes

- HEAD `2f315d0` is UNPUSHED; origin/main = prod = `5926cfe` (Jul 15). July hardening IS live.
- All remediation is uncommitted, for human review.

---

# Production-Readiness Review Loop (started 2026-07-05)

## Full Project Error Review (2026-07-15)

- [x] Capture current git state and preserve pre-existing work
- [x] Run type-check, lint, format check, naming validation, unit tests, build, and E2E tests
- [x] Trace every reproducible failure to its root cause and inspect sibling call paths
- [x] Apply minimal fixes with regression coverage where practical
- [x] Re-run all applicable quality gates until clean or document environment-only blockers
- [x] Inspect the final diff and obtain an independent read-only review

Results: `npm run validate`, `npm run validate:naming`, `npm run test:unit` (13 files / 71
tests), `npm run build`, `npm run build-storybook`, and the repaired 7-test Playwright smoke set
all pass (6 passed, 1 credential-dependent test skipped). Production dependency audit reports zero
vulnerabilities. The historical full Playwright suite remains a separate curation item below; a
115-test sample ran for 21 minutes before being stopped, then its concrete smoke-test failures were
fixed. Independent Opus review found no blocking or important findings.

Principal-level full review of frontend + backend. Loop until every gate passes clean.
Findings tracked here; per-domain status in PRODUCTION-READINESS.md.

## Iteration 1

### Hard gates

- [x] G1. npm run validate — PASS (exit 0)
- [x] G2. npm run validate:naming — PASS (exit 0)
- [x] G3. npm run build — PASS (exit 0, all routes compiled)
- [~] G4. npm test — 308 passed / 323 failed / 10 skipped. Failures are ENVIRONMENTAL,
  not regressions: 2288 "Auth session missing!" + 1144 assorted — the local test-login
  harness isn't establishing Supabase sessions. Consistent with known aspirational/flaky
  local suite; Vercel CI is source of truth per CLAUDE.md. NOT a code blocker.

### Review fan-out — COMPLETE (12 dims, hand-verified; see PRODUCTION-READINESS.md)

- [x] R1. Route factory — a few bypasses (cache/health, leave-bids/review, EBT exports)
- [x] R2. Service layer — direct writes in leave-bids + EBT route/action code
- [x] R3. Cache invalidation — ~12 mutation paths skip domain helpers
- [x] R4. Zod/errors — ~10 routes lack Zod; ~25 leak raw error.message
- [x] R5. Rate limiter / auth separation — shared authRateLimit bucket; admin login NO lockout (HIGH)
- [x] R6. Env/secrets — 🔴 CRITICAL committed service_role key (fixed in code; rotation=user)
- [x] R7. Supabase advisors — 0 ERROR; 72 anon-exec SECURITY DEFINER fns; 9 always-true write policies; ebt PII isolation
- [x] R8. TanStack tables — EBT reports table hand-rolls state (medium)
- [x] R9. Next 16 — legacy [id] routes sync params (build green); push/refresh inversions; console PII
- [x] R10. UI/design — EBT dead CSS tokens, AI-slop gradients, dark-mode gaps, missing loading.tsx
- [x] R11. EBT wiring — 🟠 signatures bucket MISSING (sign-off broken); Roles 404; orphan code
- [x] R12. Security/completeness — audit CSV export broken; .env.example drift; stale dup removed

### Fixed this pass

- [x] Removed hardcoded service_role key → env (scripts/debug/check-disciplinary-data.mjs)
- [x] Deleted stale route 2.ts duplicate
- [x] Authored draft hardening migration 20260706120000 (ebt revoke + renewal_plan_history)
- [x] PRODUCTION-READINESS.md written (per-domain status + ranked findings)

### Pass 2 — FIXED (validate + build green, 87 files)

- [x] Admin login lockout + IP attribution (admin-auth-service, login/actions)
- [x] EBT `signatures` bucket created (prod + migration 20260706130000)
- [x] Error sanitization across ~26 API routes (sanitizeError)
- [x] Zod on ~10 mutation routes; disciplinary PATCH allowlist; reschedule userId spoofing fixed
- [x] Cache invalidation on ~14 mutation paths
- [x] cron pilot-retirement-check fail-closed; renewal email example.com fallback removed
- [x] EBT: Roles 404 removed, error boundary dark-mode, examiner name, 3x loading.tsx, orphan deletes
- [x] nav-order (6 files), PII log redaction, .env.example parity
- [x] Migration 20260706120000 extended: ebt anon/auth revoke + renewal_plan_history + 15 RPC revokes

### Pass 3 — FIXED (validate + build green)

- [x] DB hardening migration APPLIED to prod + verified (ebt grants revoked, renewal_plan_history anon-write closed, 13 sensitive RPCs locked to service_role via REVOKE FROM PUBLIC)
- [x] 12 anon-key scripts/debug/\*.mjs → env (zero hardcoded keys remain)
- [x] cache/health → createAdminRoute; leave-bids review/review-option → leave-bid-service
- [x] audit CSV export schema drift fixed (real columns; verified vs live DB); /dashboard/audit no longer 400s
- [x] legacy pilot [id] routes → await params (Next 16)
- [x] EBT ebt.css: token scope fixed, 19 gradients→solid, glassmorphism/glow/decorative-fonts removed, dark-mode block

### Pass 4 — FIXED (validate + build + GitHub CI green)

- [x] CI green on pushed HEAD (fixed prettier format:check on 2 files — .mjs outside lint-staged globs)
- [x] Committed both applied migrations (20260706120000, 20260706130000); PR #74 updated + commented
- [x] Follow-up migration 20260706140000: revoked inert anon write grants on 6 audit/feedback tables (applied+verified)
- [x] Reviewed & accepted always-true authenticated policies + ~57 low-sensitivity SECURITY DEFINER fns (rationale in migration comments)
- [x] Removed orphaned ebt/pilots/pilot-actions.ts; export-audit-button → recordId

### Pass 5 — code review + runtime verification (CI green on acb3f7c)

- [x] Self code-review of hardening diff (43fc81f..HEAD, 108 files) via 3 finder angles + verify
- [x] Fixed 3 minor edges: --rf-\* dark-mode gap (report view light island); monthsAhead 0→400; reschedule reason ''→400
- [x] Refuted 1 candidate (disciplinary null — incident_type_id/pilot_id are NOT NULL in DB)
- [x] RUNTIME-VERIFIED hardening on prod via real anon client: ebt schema → 401 (PII closed),
      validate_pilot_session RPC → 401 (locked), baseline check_types → 200 (key works)

### Remaining — USER ACTIONS + accepted follow-ups

- [ ] USER (ONLY REMAINING BLOCKER): rotate leaked service_role key + purge git history
- [ ] USER: eyeball admin-auth login lockout + EBT theme (light/dark) + audit export in the running app (need admin creds)
- [ ] E2E suite curation (separate project; 323 stale specs) OR treat Vercel CI as the gate
- [ ] Tiny/accepted: signature-pad canvas decorative font (cosmetic); per-item review of remaining SECURITY DEFINER fns if desired

---

# EBT → Fleet: make `/dashboard/ebt` fully functional

Goal: single Supabase + single Vercel. EBT domain in `ebt` schema of fleet project
(`wgdmgvonqysflwdiiols`); pilots unified onto `public.pilots`.
Full design in /Users/skycruzer/.claude/plans/can-we-migrate-this-swirling-hennessy.md

EBT source DB: `omicxkfwdsadyycetmsk` (reachable via Supabase MCP). Local repo:
`/Users/skycruzer/Desktop/Current Development Projects/B767 EBT DB`.

## Phase A — Schema (into fleet project)

- [x] A1. Full introspect of EBT DB — done (25 tables, 6 enums, 5 pilot FKs, 6 auth.users FKs)
- [x] A2. Got authoritative pg_dump (schema 78k + data 451k) via linked repo + Docker — no conn string needed
- [x] A3. Authored `supabase/migrations/20260705090000_ebt_schema.sql` (public→ebt; ebt.pilots = compat VIEW over public.pilots; 5 FKs→public.pilots; ebt.pilot_ext). AUDIT feature fully stripped (7 triggers, hook, event trigger, vault, cron — none present).
- [x] A4. Storage buckets empty (0 objects) — nothing to migrate; buckets to create later if needed
- [x] A5. Diff-review: 0 unexpected public.\* refs; audit refs=0; auth.users FKs dropped
- [x] A6. APPLIED to fleet prod via `supabase db push` (migration-history drift repaired first). restore point 2026-07-05T09:04Z
- [x] A7. Exposed `ebt` via PostgREST role config (pgrst.db_schemas) + grants on view/pilot_ext; types regenerated (public+ebt). CAVEAT: re-saving dashboard API settings could reset the exposed-schemas list.

## Phase B — Data

- [x] B1. Pilot reconciliation → 27⊂35, 8 departed pre-seed (inactive). scratch/ebt/pilot_reconciliation.md
- [x] B2. Data transform authored (ebt_data_load.sql): pilot remap 27, pilot_ext seed 35, triggers-disabled load
- [x] DRY RUN GREEN on Postgres 17 (Docker): schema+data apply clean; row counts == exact source; ZERO orphan pilot FKs; compat view resolves fleet pilots
- [ ] B3. (audit removed → no auth.users copy needed; 6 auth FKs dropped, identity via ebt.profiles/user_roles)
- [ ] B4. Storage: none (empty buckets)
- [x] B5. Data APPLIED to fleet prod + VERIFIED: 142 reports, 2095 grades, 35 pilot_ext, 8 preseeded inactive; ZERO orphans; compat view resolves (staff 2393 = Maurice RONDEAU)

## Phase C — Code

- [x] C1. Rewired EBT auth gate → fleet admin auth (getAuthenticatedAdmin; fleet admin→ebt admin, manager→fleet_manager)
- [x] C2. EBT server client → service-role (RLS bypass, section gated by fleet admin). Pilot reads resolve via ebt.pilots compat view; embeds work at runtime (verified via REST)
- [x] C3. Pilot create/edit pages + actions redirect to fleet roster (pilots fleet-owned). types.ts→@/types/supabase
- [x] C4. tsc 0 errors, eslint 0, prettier clean. (PDF export untouched—already used server client; pilot_ext editing = follow-up)
- [ ] C5. LIVE browser test /dashboard/ebt as admin (user logged in)

## Phase D — Cutover

- [ ] D1. Playwright/manual E2E of /dashboard/ebt/\* as admin
- [ ] D2. Repoint pdf-service env; end-to-end finalization test
- [ ] D3. Merge PR #74; deploy; watch 3-7 days
- [ ] D4. Pause EBT Vercel + Supabase; delete after 30 clean days

## Status log

- 2026-07-05: fixed branch login bug (merged main → proxy service-role client).
  Root-caused EBT menu bounce = EBT gate wants Supabase JWT `user_role`, fleet admin
  uses bcrypt admin-session cookie. User chose FULL functional path. MCP reaches EBT DB.
- 2026-07-05: production-readiness review loop started (see top section).
