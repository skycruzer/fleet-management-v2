# Project Review — 2026-06-10

Comprehensive 7-dimension review (BMad project-review). Six parallel review agents + manual verification of all critical claims. **No code was changed during this review.**

## Executive Summary

The project is functionally mature and recently hardened (35 reports-module criticals closed, RBAC casing migration, UX review applied). The biggest risks are **not** feature gaps — they are: (1) a production secrets file tracked in git, (2) inconsistent enforcement of the project's own architecture rules (service layer, env access, ServiceResponse), and (3) tests that are broad but shallow. (An initially-reported "CSRF disabled in production" finding was retracted on verification — see S2.)

**Overall score: 39 / 70**

| Dimension            | Score  | One-liner                                                                      |
| -------------------- | ------ | ------------------------------------------------------------------------------ |
| Feature completeness | 8/10   | Core flows complete; deferred items already well-tracked in tasks/             |
| Architecture         | 5/10   | Strong patterns documented, inconsistently enforced (17 pages bypass services) |
| Code quality         | 5/10   | 33% ServiceResponse adoption, 322 `any`, six 1.5k–2.5k-line services           |
| Testing              | 4/10   | 48 e2e specs but mostly visibility checks; crew-eligibility logic untested     |
| Documentation        | 6.5/10 | CLAUDE.md accurate; ~15 stale Oct-2025 phase docs clutter docs/                |
| Production readiness | 7/10   | Health check, error boundaries, crons solid; logging adoption incomplete       |
| Security             | 5/10   | Tracked secrets file is the big one; CSRF finding retracted (S2)               |
| Performance          | 6.5/10 | Good Redis/view layers; force-dynamic layout + N+1 patterns                    |

---

## Critical Findings (verified by hand, not just agent-reported)

### S1. Production secrets committed to git — CRITICAL

`.env.production 2.local` (a stray duplicate created during a `vercel env pull`, name contains a space so `.gitignore`'s `.env.production` rule does not match it) is **tracked in git** since the baseline commit `c2620bd`. It contains:

- `SUPABASE_SERVICE_ROLE_KEY` (bypasses all RLS on the production DB)
- `RESEND_API_KEY`
- `CRON_SECRET`
- `VERCEL_OIDC_TOKEN`

Additionally, commit `ca406e1` added 2 lines to `.env.production`, so that file also exists in git history.

**Remediation:** rotate the Supabase service-role key, Resend key, and CRON_SECRET; `git rm --cached ".env.production 2.local"` and delete it; add `.env*` + `!.env.example` style ignore rules that survive filename variants; optionally scrub history (repo appears private, so rotation matters more than history rewriting).

### S2. ~~CSRF protection disabled in production~~ — RETRACTED after code verification (was: CRITICAL)

`ENABLE_CSRF_PROTECTION=false` exists in env files, but **no code reads that variable** — `validateCsrf()` (lib/middleware/csrf-middleware.ts:157) enforces the double-submit check unconditionally for all mutation methods; the only `NODE_ENV` branches are log/message wording. CSRF protection is active in production. The flag is dead, misleading config.

**Remediation (done 2026-06-10):** dead flag removed from local `.env.local` / `.env.production`; also delete the `ENABLE_CSRF_PROTECTION` env var in the Vercel dashboard to prevent future confusion.

### S3. Route-level auth missing on several API routes — MEDIUM (downgraded after verification)

`app/api/renewal-planning/pilot/[pilotId]/route.ts`, `app/api/audit/[id]/route.ts`, `app/api/retirement/impact/route.ts` perform **no auth check in the route handler**. They are currently protected only because `proxy.ts:349-403` gates all `/api/*` paths behind an admin session at the edge. That is a single point of failure (defense-in-depth gap): any future change to the proxy matcher/allowlist silently exposes them. Note: the security agent claimed `renewal-planning/generate` was also unprotected — verified false; it has full CSRF + auth.

**Remediation:** add `getAuthenticatedAdmin()` to every `/api/*` handler regardless of proxy coverage; consider an ESLint rule or CI grep gate.

---

## High-Priority Findings

| #   | Finding                                                                                                                                                                                                                          | Evidence                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | 17 `page.tsx` files + multiple cron/API routes make direct `supabase.from()` calls, violating the mandatory service layer                                                                                                        | `app/portal/(protected)/profile/page.tsx:92`, `app/dashboard/planning/page.tsx:28`, `app/dashboard/settings/page.tsx:29`, `app/api/cron/certification-expiry-alerts/route.ts:53` |
| H2  | E2E assertions are ~70% visibility-only; crew-eligibility business logic (10 Capt + 10 FO) has no real unit tests (only RPC mocks); 40+ `waitForTimeout()` hard waits                                                            | `e2e/leave-requests.spec.ts:131-136`, `tests/unit/lib/leave-eligibility-rank-separation.test.ts`                                                                                 |
| H3  | `force-dynamic` on `app/dashboard/layout.tsx:21` disables caching/ISR for the entire dashboard tree                                                                                                                              | app/dashboard/layout.tsx                                                                                                                                                         |
| H4  | N+1 / fetch-all-then-filter patterns: per-record `getAlertThresholds()` in `expiring-certifications-service.ts:170`; 3 summary functions in `pilot-certification-service.ts:100-227` fetch the full cert table then filter in JS | lib/services/                                                                                                                                                                    |
| H5  | Email service duplication: `pilot-email-service.ts` (1,837 lines) + `pilot-email-notification-service.ts` (962 lines) overlap heavily; 14 sends lack idempotency keys (already tracked)                                          | lib/services/                                                                                                                                                                    |
| H6  | ServiceResponse adoption at 33% (19/58 services); callers juggle throw-vs-return                                                                                                                                                 | lib/services/                                                                                                                                                                    |
| H7  | Logging: ~397 `console.*` calls in api/services vs 3 routes using the Logtail logger; 7+ raw `process.env` usages bypass `lib/env.ts`                                                                                            | app/api/, lib/services/                                                                                                                                                          |

## Medium / Housekeeping

- 6 orphaned services never imported: `base-service.ts`, `pdf-service.ts`, `pilot-registration-service.ts`, `roster-pdf-service.ts` (+2 near-orphans) — delete.
- 13 services > 800 lines; `reports-service.ts` at 2,459 lines.
- 322 `any` usages (app/ + lib/).
- ~15 stale Oct-2025 phase docs in docs/ — move to `docs/archive/`.
- TanStack Query default staleTime 60s applied to stable reference data (apply `queryPresets.static`).
- Sequential client fetches on pilot detail page (`Promise.all` candidates).
- Playwright: workers=1, 60s timeouts, no seed strategy; 6 undocumented `test.skip`s.
- README says Next.js 15; code is 16.x.

## What's in Good Shape

- Error boundaries (global + 9 segment-level), `/api/health`, timing-safe CRON_SECRET checks, vercel.json cron sync.
- 108 orderly migrations, recent cadence; strict build config with full security-header set.
- CLAUDE.md spot-checked accurate on all 5 sampled claims.
- No SQLi/XSS/dangerouslySetInnerHTML findings; Supabase client used safely throughout.
- Medical-certificate upload pipeline (magic-byte validation, private bucket, signed URLs) is a solid, reusable precedent.

---

## Prioritized Recommendations

**P0 — do immediately (small, urgent)**

1. Rotate service-role key, Resend key, CRON_SECRET; untrack and delete `.env.production 2.local`; harden .gitignore. (S1)
2. Re-enable CSRF in production after fixing the underlying cookie issue. (S2)
3. Add route-level auth to the 3 unguarded API handlers. (S3)

**P1 — next 1–2 sessions** 4. Fix the dashboard `force-dynamic` + the two N+1 service patterns (H3, H4) — biggest perf win for least effort. 5. Add real unit tests for `leave-eligibility-service` crew math and seniority ordering (H2). 6. Migrate raw `process.env` usages to `lib/env`, and `console.*` → logging-service in API routes (H7). Add ESLint rules to lock both in.

**P2 — scheduled refactors (batch with existing tracked debt)** 7. Service-layer enforcement sweep (H1) — page-by-page, 5-8 files per batch per workflow rules. 8. Consolidate the two email services; add idempotency keys (H5, already partially tracked). 9. Delete 6 orphan services; archive stale docs; split `reports-service.ts`. 10. ServiceResponse migration for the 22 throwing services, opportunistically as files are touched (H6).

Items already tracked in `tasks/todo.md` / `tasks/reports-review-todo.md` (Batch A correctness bugs, I20 form refactor, form-stack unification, etc.) were intentionally not duplicated here.
