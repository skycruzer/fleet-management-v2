# Phases 2 & 3 + security fixes (2026-06-10)

- [x] PR #61 — security: admin auth added to tasks/[id] GET, retirement/timeline,
      renewal-planning/roster-period/[period], dashboard/flight-requests/[id] PATCH;
      leave-bid review staleness fixed. verifyPilotSession consolidation deferred to
      auth-unification (changes authenticated-user set).
- [x] PR #62 — Phase 2: cache-invalidation-helper is single source of truth; 8 new domain
      helpers; 37 files switched to non-blocking helper calls; dead revalidation paths
      dropped (incl. /dashboard/leave-bids\* — bid mutations were revalidating nothing).
- [x] PR #63 — Phase 3 (merged + deployed): certification rule dedup (EXCLUDED_CATEGORIES single export,
      getCertificationStatusKey, countCertificationsByStatus, checksInWindow closure).
      Full service merges NOT needed per analysis: pilot-leave already delegates to
      unified-request-service; leave-bid vs request semantics differ by design.
- [ ] USER ACTION (from Security P0 list): SUPABASE_SERVICE_ROLE_KEY rotation still
      pending (Supabase dashboard → rotate JWT secret → update Vercel env vars + redeploy)

---

# Phase 1b — Factory migration of all standard routes (2026-06-10, branch refactor/route-factory-phase-1b)

- [x] Wave 1: 36 routes (pilots, certifications, tasks, requests, leave-requests, users,
      settings, user/\*, check-types, search, sidebar-badges, notifications, 9 portal routes)
- [x] Wave 2: 44 routes (roster-periods/reports, published-rosters, renewal-planning,
      analytics, audit, reports, feedback, disciplinary, admin/\*, cache, registration-approval)
- [x] Wave 3: 12 routes (retirement, activity-codes, contract-types, deadline-alerts,
      leave-stats, legacy pilot routes, portal flight-requests, medical-certificate upload)
- [ ] e2e verification (leave-bids baseline + leave-requests + admin-leave-requests)
- [ ] PR, CI, merge

96 routes total now on the factory. Not migrated by design: auth/login/logout/register/
password flows, csrf, health, cron (different auth models).

## SECURITY FINDINGS from migration audit (each route left byte-identical; needs own fix)

- [ ] `app/api/tasks/[id]/route.ts` GET — NO auth check at all
- [ ] `app/api/retirement/timeline/route.ts` GET — NO auth check at all
- [ ] `app/api/renewal-planning/roster-period/[period]/route.ts` — NO route-level auth
- [ ] `app/api/dashboard/flight-requests/[id]/route.ts` PATCH — no route-level admin auth
      (relies on service-layer auth only)
- [ ] `pilot/leave/[id]` + `pilot/flight-requests/[id]` use a THIRD auth primitive
      (`verifyPilotSession` — Redis session only, no registration_approved gate); consolidate
      with getCurrentPilot semantics deliberately, not in a refactor

---

# Role-Casing Fix (2026-06-10, branch fix/require-role-casing)

`an_users.role` stores lowercase ('admin' x3, 'manager' x1) but code compares capitalized.
Normalize on lowercase (matches DB + working auth path in admin-auth-helper).

Confirmed-broken sites (capitalized comparisons against lowercase DB):

- [x] `lib/middleware/authorization-middleware.ts` — UserRole enum values → lowercase;
      `getUserRole` lowercases DB value (fixes ~15 requireRole routes for Supabase-auth admins)
- [x] `app/api/retirement/export/pdf/route.ts:42` — broken for EVERYONE (both auth sources)
- [x] `app/api/retirement/export/csv/route.ts:42` — broken for EVERYONE
- [x] `app/api/audit/export/route.ts:51` — broken for EVERYONE
- [x] `app/api/analytics/succession-pipeline/route.ts:40` — broken for EVERYONE
- [x] `lib/services/user-service.ts` — stats byRole always 0; getUsersByRole filter empty;
      role union types → lowercase (keep byRole.Admin/Manager/User display keys)
- [x] `lib/validations/user-validation.ts` — UserRoleEnum accepts any case, stores lowercase
      (currently user creation would write 'Admin' → user locked out of portal)
- [x] `app/dashboard/admin/users/new/page.tsx` — option values + default → lowercase
- [x] `app/api/users/route.ts` GET — normalize ?role= param
- [x] Follow-up after merge: add `roles: [ADMIN, MANAGER]` to leave-bids review +
      review-option routes (deferred from PR #58)
- [x] Verify: tsc/eslint/prettier + grep sweep for remaining capitalized comparisons

---

# API Route Factory — Phase 1 of architecture consolidation

Approved direction (2026-06-10): proceed with redesign recommendations in ROI order:
route factory → tag-based invalidation → opportunistic service merges.
Auth unification (Supabase-only) deferred to its own planned migration.

## Phase 1: `createApiRoute` factory + leave-bids proof of concept (this branch)

- [ ] Create `lib/middleware/create-api-route.ts` with `createAdminRoute` / `createPilotRoute`
      factories implementing the standard pipeline: CSRF → auth → rate limit →
      role check → Zod body validation → handler → cache revalidation → sanitized errors
- [ ] Migrate `app/api/admin/leave-bids/review/route.ts` (preserve behavior; drop redundant
      inline role query — `getAuthenticatedAdmin` already enforces admin/manager)
- [ ] Migrate `app/api/admin/leave-bids/review-option/route.ts`
- [ ] Migrate `app/api/admin/leave-bids/[id]/route.ts` (keep per-user `authRateLimit` +
      `requireRole` + `invalidateLeaveCaches` semantics)
- [ ] Migrate `app/api/portal/leave-bids/route.ts` (GET keeps no rate limit — shared-office-IP
      lesson; POST/PUT/DELETE keep current limits and revalidate paths)
- [ ] `npm run validate` + `npm run validate:naming` (local build may hang — Vercel CI is
      source of truth per prior sessions)
- [ ] Run `e2e/leave-bids.spec.ts` locally if dev server cooperates
- [ ] Commit, push, open PR, watch CI run matching head SHA

## Behavior-preservation notes

- Pipeline order standardized to CSRF → auth (portal POST/PUT previously auth → CSRF;
  only affects which error wins when both fail)
- `review` route intentionally still does NOT revalidate paths (current behavior; flagged
  as follow-up staleness fix)
- Validation error responses move to the standard `validationErrorResponse` shape
  (`success:false, error, errorCode, validationErrors`) — same `error` string field clients read

## Follow-ups (separate branches)

- [ ] Phase 1b: migrate remaining ~114 routes to factory in batches of 5–8 with build checks
- [ ] Phase 2: tag-based cache invalidation (`revalidateTag` + domain tag taxonomy),
      replace 138 manual `revalidatePath` call sites
- [ ] Phase 3: merge service pairs opportunistically (pilot/pilot-portal, certification/
      pilot-certification, leave-bid/unified-request)
- [ ] CONFIRMED BUG (pre-existing): `an_users.role` is lowercase ('admin' x3, 'manager' x1)
      but `UserRole` enum compares 'Admin'/'Manager' — `verifyUserRole` 403s every
      Supabase-authenticated admin; `requireRole` only passes via the admin-session
      fallback short-circuit. Affects all routes using `requireRole`. Fix enum values
      (or normalize casing in `getUserRole`) in a dedicated PR.
- [ ] `review` route: add revalidation after bid approval (staleness bug, behavior change)

---

# Dashboard Data Accuracy Fixes (2026-05-31)

Audit found the admin dashboard's headline numbers are wrong: materialized-view schema
drift + a stale view + a pending-status logic gap.

## Fix 1 — CRITICAL: realign TS mapping to real view columns (code only)

View `pilot_dashboard_metrics` (v2.0.0) returns `current_certifications`,
`expiring_certifications`, `denied_leave`, `expiring_this_week`, `retirement_due_soon`,
`overdue_retirement`, `leave_this_month`. The mapping read non-existent names
(`valid_certifications`, `expiring_soon_certifications`, `rejected_leave`, `total_expired`,
`total_expiring_30_days`, `pilots_due_retire_2_years`) → `undefined || 0`. Most visible
effect: FleetInsights "Expiring" always rendered 0 (green).

- [ ] Rewrite `types/database-views.ts` `PilotDashboardMetrics` to match the real view
- [ ] Fix mapping in `lib/services/dashboard-service-v4.ts` `fetchDashboardMetricsFromView()`

## Fix 2 — CRITICAL: view counts only PENDING/SUBMITTED as pending leave (DB migration)

App's pending set is `('SUBMITTED','IN_REVIEW')`; all 6 current pending leave requests are
`IN_REVIEW` → view says 0.

- [ ] New migration: redefine view with `pending_leave` including `IN_REVIEW`
- [ ] Apply to production + refresh + verify live numbers

## Fix 3 — HIGH: nothing refreshes the view (26 days stale)

`refresh_dashboard_metrics()` is only called by two manual admin routes; no cron.

- [ ] Add `/api/cron/refresh-dashboard-metrics` (CRON_SECRET-authed, mirrors existing cron)
- [ ] Register it in `vercel.json` crons

## Fix 4 — MEDIUM: "expiring within 7 days" includes already-expired certs (copy)

- [ ] Today's Priorities: relabel to "expired or expiring within 7 days"
- [ ] FleetInsights "Pending" card: relabel to "Pending Leave" (its data is leave-only)

## Out of scope (noted, not changed)

- Fix 5 (LATENT): view's retirement buckets hardcode ages 60/58/55, ignoring configurable
  `pilot_retirement_age`. Not displayed (RetirementForecastCard uses live service).

## Status — COMPLETE (2026-05-31)

- [x] Fix 1: `types/database-views.ts` + `dashboard-service-v4.ts` mapping realigned
- [x] Fix 2: migration `20260531000001_fix_dashboard_pending_leave_in_review.sql` written
      AND applied to production DB (view now v2.1.0)
- [x] Fix 3: refresh piggybacked onto `certification-expiry-alerts` cron (no new Vercel cron)
- [x] Fix 4: Today's Priorities + FleetInsights "Pending Leave" labels corrected

## Verification (done)

- [x] ESLint clean on all 5 changed TS/TSX files
- [x] `tsc --noEmit`: no new errors (only 2 pre-existing macOS @types artifacts)
- [x] Prettier: TS/TSX clean (`prettier --check .` skips .sql — no CI impact)
- [x] Live DB after migration matches a live recompute EXACTLY:
      expired 3=3, expiring 20=20, pending_leave 6=6 (was 0)
- [x] `refresh_dashboard_metrics()` CONCURRENTLY now succeeds (no 55000); last_refreshed advances

## Deploy note

- Production DB already fixed (migration applied via MCP). Code fixes live only on this
  branch — deploy (merge → Vercel) so FleetInsights "Expiring" reads the correct column
  (currently still 0 on old deployed code; "Pending" already reads 6).
- When `npm run db:deploy` next runs, the committed migration re-applies idempotently.

---

# Security P0 Fixes (2026-06-10) — from docs/PROJECT-REVIEW-2026-06-10.md

- [x] **S1** Untracked + deleted `.env.production 2.local`; .gitignore hardened. CRON_SECRET + RESEND_API_KEY rotated (2026-06-10, Vercel + .env.local; old Resend key "Fleet Management" left active until deploy verified — then delete in Resend dashboard). **REMAINING: SUPABASE_SERVICE_ROLE_KEY rotation** (dashboard → rotate JWT secret; also invalidates anon key → update both Vercel vars + redeploy).
- [x] **S2** RETRACTED — verified `ENABLE_CSRF_PROTECTION` is read by no code; `validateCsrf()` enforces unconditionally. Dead flag removed from local env files AND deleted from Vercel production (2026-06-10).
- [x] **S3** Route-level `getAuthenticatedAdmin()` added to renewal-planning/pilot/[pilotId], audit/[id], retirement/impact routes.

---

# Pilot Document Attachments — Plan (2026-06-10, APPROVED with decisions)

Feature: attach documents (PDF, Word .doc/.docx, JPEG) to (A) pilot details and (B) sick-leave requests. Full discovery in `docs/PROJECT-REVIEW-2026-06-10.md` session. Reuses the existing medical-certificate pipeline (`lib/services/file-upload-service.ts`, `components/ui/file-upload.tsx`, private-bucket + signed-URL + magic-byte pattern).

## Decisions (Maurice, 2026-06-10)

- [x] **D1** Pilot-profile documents: **admin + fleet manager** upload (`requireRole([ADMIN, MANAGER])`); not pilot-initiated.
- [x] **D2** Multiple attachments via `pilot_documents` table (recommended option accepted with "continue").
- [x] **D3** **10MB confirmed**; allowed types PDF / DOC / DOCX / JPEG / PNG.

## Phase 1 — Shared plumbing — DONE (code) / PENDING (apply)

- [x] Extend `lib/validations/file-upload-schema.ts`: add `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` MIME types
- [x] Extend `validateFileWithMagicBytes()` in `file-upload-service.ts`: DOCX = ZIP header `50 4B 03 04`, legacy DOC = OLE2 `D0 CF 11 E0`
- [x] Migration written: `20260610000001_pilot_documents_storage.sql` (also adds Word MIME to medical-certificates bucket) — APPLIED to prod 2026-06-10 (post-apply fix: bucket came up public; corrected via storage API + ON CONFLICT now updates `public`): private bucket `pilot-documents` (copy `20260202000002_create_medical_certificates_bucket.sql` pattern, 10MB, new MIME list)
- [x] Migration written: `20260610000002_create_pilot_documents_table.sql` — APPLIED to prod 2026-06-10: `pilot_documents` table — `id`, `pilot_id` FK→pilots, `document_type` (CONTRACT | MEMO | QUALIFICATION | MEDICAL | OTHER), `title`, `file_path`, `file_name`, `file_size`, `mime_type`, `uploaded_by` FK→an_users, `request_id` nullable FK→pilot_requests (links sick-leave attachments), timestamps; RLS per `20251120000002_fix_pilot_requests_rls_policies.sql` pattern
- [x] Migrations applied via `supabase db push` after FULL HISTORY REPAIR (2026-06-10): 24 out-of-band migrations recorded as applied, 6 ghost remote entries reverted, duplicate date-only 2026-01 files archived. `db push` is usable again. `npm run db:types` run; temporary cast removed.

## Phase 2 — Service + API (admin) — DONE

- [x] `lib/services/pilot-document-service.ts` (ServiceResponse<T>): list, upload, signedUrl, delete
- [x] `app/api/pilots/[id]/documents/route.ts` — GET list / POST upload (full pipeline: validateCsrf → getAuthenticatedAdmin → rate limit → service → revalidatePath)
- [x] `app/api/pilots/[id]/documents/[docId]/route.ts` — GET signed URL / DELETE (DELETE gated by `requireRole([ADMIN, MANAGER])`)

## Phase 3 — Pilot details UI — DONE

- [x] `components/pilots/pilot-documents-tab.tsx` — list (type badge, name, size, date, uploader) + upload via existing `FileUpload` + view (signed URL) + delete (`useConfirm`)
- [x] Third "Documents" tab in `components/pilots/pilot-detail-tabs.tsx`

## Phase 4 — Sick-leave attachments — DONE

- [x] Portal form (multi-file list; Word accepted via shared ACCEPT_STRING; uploads then links via document_ids)
- [x] Upload API: extend/parallel `app/api/portal/upload/medical-certificate/route.ts`; ownership via `getCurrentPilot().pilot_id`, path `{pilot_id}/{timestamp}-{filename}`
- [x] Admin request review UI: Attachments card added to `app/dashboard/requests/[id]/page.tsx` (re-signs URLs; legacy `source_attachment_url` fallback — it was previously displayed NOWHERE)
- [x] Auto-surface request attachments on the pilot's Documents tab (they share `pilot_documents`)

## Phase 5 — Validation — PARTIAL

- [x] ESLint clean + Prettier formatted on all touched files; tsc deferred to Vercel CI (known local hang)
- [ ] E2E: upload→list→view→delete on pilot details; sick-leave submit with attachment visible to admin (follow-up after PR #56)
- [x] CI green on PR #56 head (validate 20.x + check-secrets pass)
