# Code Review Remediation — fix/pilot-page-review-and-rbac-casing

All 15 findings from the xhigh-effort code review have been fixed.

## Group A — RBAC casing migration completion (HIGH) ✅

- [x] **Fix #1a** `app/api/retirement/export/csv/route.ts:42` — lowercase compare
- [x] **Fix #1b** `app/api/retirement/export/pdf/route.ts:42` — lowercase compare
- [x] **Fix #1c** `app/api/analytics/succession-pipeline/route.ts:40` — lowercase compare
- [x] **Fix #1d** `lib/services/user-service.ts` — new `UserRoleLiteral` type alias; types, `getUsersByRole` signature, and `getUserStats` byRole keys lowercased
- [x] **Fix #1e** `lib/validations/user-validation.ts:15` — Zod enum lowercased
- [x] **Fix #1f** `app/dashboard/admin/users/new/page.tsx:34` — default role → `'manager'`
- [x] **Fix #1g** `app/api/users/route.ts:27` — searchParams role type assertion lowercased
- [x] **Skipped** `components/dashboard/personalized-greeting.tsx` — `'Admin'` strings are unreachable display fallbacks (never shown to authenticated users; real role flows from DB)

## Group B — Certifications page client correctness (HIGH) ✅

- [x] **Fix #2 + #8** Dropped `refreshData()` entirely; rely on `router.refresh()` + render-phase prop sync (single source of truth). Fixes the truncate-to-50 bug AND the RSC-vs-client race.
- [x] **Fix #3** Restored DELETE flow — Trash button on the All tab (`certifications-table.tsx`), AlertDialog confirm in page client, DELETE fetch with CSRF token
- [x] **Fix #5** Top-bar Export now scopes to active tab — on Attention, exports only expired/expiring rows; aria-label updates accordingly; filename suffixes `_attention` so the CSV is self-describing
- [x] **Fix #9** `activeStatus` state wired to `CertificationStatCards` — the clicked card now gets the ring-2 highlight
- [x] **Fix #14** `fetchFormData` errors surface via destructive toast
- [x] **Bonus (B2 from review)** Edit button restored to default All tab

## Group C — requireRole admin-session staleness (HIGH) ✅

- [x] **Fix #4** `lib/middleware/authorization-middleware.ts:332` — admin-session branch now delegates to `verifyUserRole(adminSession.user.id, requiredRoles)`, hitting the DB by PK each call. Role demotions take effect immediately.

## Group D — Date arithmetic correctness (MEDIUM) ✅

- [x] **Fix #6** `lib/utils/retirement-utils.ts:63` — day-borrow uses retirement's prior month, not today's
- [x] **Fix #11** `components/pilots/retirement-information-card.tsx` — `careerStartAge` now applies the same birthday-passed adjustment as `currentAge`
- [x] **Fix #13** `lib/utils/retirement-utils.ts` — new `parseLocalDate` helper parses `YYYY-MM-DD` via local-time constructor so Vercel-region TZ can't drift Feb 29 → Feb 28 before the leap clamp

## Group E — Server-side certifications data path (MEDIUM) ✅

- [x] **Fix #7** `lib/services/certification-service.ts:203` — `getCertificationsUnpaginated` loops by `PAGE_SIZE=1000` driven by the DB `total` count; 50-page safety cap (50k rows)

## Group F — Component contracts and UX (MEDIUM) ✅

- [x] **Fix #10** `components/pilots/pilot-certifications-tab.tsx` — added prop-sync `useEffect` mirroring `pilot-detail-tabs:91-93`
- [x] **Fix #12** `components/pilots/pilot-detail-tabs.tsx` — two stacked badges (red for expired, yellow for expiring); each number stays tied to its colour

## Group G — Latent bug (LOW) ✅

- [x] **Fix #15** `lib/services/pilot-service.ts:633` — `createPilotWithCertifications` pilotJson now includes `captain_qualifications` (mirrors `createPilot`)

## Validation

- [x] `npm run lint` — clean
- [x] `npm run format:check` — clean (one Prettier issue in rewritten file auto-formatted)
- [x] `npm run type-check` — fails on pre-existing environmental `aria-query`/`uuid` duplicate type-root errors only; no new TS errors from these edits. Vercel CI remains the source of truth per project convention.

## Files touched (16)

```
app/api/retirement/export/csv/route.ts
app/api/retirement/export/pdf/route.ts
app/api/analytics/succession-pipeline/route.ts
app/api/users/route.ts
app/dashboard/admin/users/new/page.tsx
app/dashboard/certifications/certifications-page-client.tsx
components/certifications/certifications-tabs.tsx
components/certifications/certifications-table.tsx
components/pilots/pilot-detail-tabs.tsx
components/pilots/pilot-certifications-tab.tsx
components/pilots/retirement-information-card.tsx
lib/middleware/authorization-middleware.ts
lib/services/user-service.ts
lib/services/certification-service.ts
lib/services/pilot-service.ts
lib/utils/retirement-utils.ts
lib/validations/user-validation.ts
```

---

# IMPORTANT Reports Findings (2026-05-29)

Plan for the open IMPORTANT items in `reports-review-todo.md`. Verified current code first — several were already fixed and only need ticking.

## Already fixed — tick only

- [ ] I9, I10, I18, I26 (+ I24 label half) — confirmed fixed in code; update checkboxes in findings doc.

## Batch A — correctness bugs (recommended)

- [ ] **I7** `reports-service.ts:1766-1768` — derive `bid_year` from priority/earliest option, not `enrichedOptions[0]` storage order.
- [ ] **I16** `reports-schema.ts:65` — bump `daysDiff <= 365 * 2` to allow 731-day leap-spanning ranges.
- [ ] **I31** `leave-report-form.tsx` — add `endDate >= startDate` cross-field zod validation.
- [ ] **I8** `reports-service.ts:758` — chain `filteredData.filter` instead of `allRequests.filter`.

## Batch A2 — needs domain confirmation

- [ ] **I25** — confirm FLIGHT requests' initial workflow_status; remap or remove the "Draft" checkbox if DRAFT never occurs.

## Batch B — low-risk polish

- [ ] **I27** delete orphan `date-preset-buttons.tsx` · **I24** rename `statusPending`→`statusDraft` · **I28** preview-dialog scroll hint · **I23** standardize button order/variants.

## Batch C — small features

- [ ] **I29** presets for pilot-info + forecast · **I30** "fetch all N records?" confirm on unfiltered preview/export.

## Deferred

- [ ] **I20** dedupe 24 `useEffect` toasts across all 6 forms — broad refactor, low value, risky. Defer to a dedicated PR.
