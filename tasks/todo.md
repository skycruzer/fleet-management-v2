# Production-Readiness Review Loop (started 2026-07-05)

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

### Remaining — USER ACTIONS + accepted follow-ups

- [ ] USER (ONLY REMAINING BLOCKER): rotate leaked service_role key + purge git history
- [ ] Eyeball EBT section in both themes behind admin auth (CSS de-slop done + build-verified in code)
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
