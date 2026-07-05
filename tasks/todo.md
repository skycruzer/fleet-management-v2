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
