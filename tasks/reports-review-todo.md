# Admin Reports — Thorough Review Findings

**Date**: 2026-05-25
**Scope**: `/dashboard/reports` (6 implemented reports — Leave, Flight, Leave Bids, Certifications, Pilot Info, Forecast)
**Reviewers**: 5 parallel review agents (Leave/Bids, Certs, Forecast+secondary, UX/UI, PDF formatting)
**Method**: Code review only (no app run, per request)

## Headline Numbers

- **CRITICAL**: 22 findings (real data bugs, broken outputs, accessibility blockers)
- **IMPORTANT**: 31 findings (edge cases, inconsistencies, missing affordances)
- **NICE-TO-HAVE**: 18 findings (polish, power-user features)
- **DESIGN RECOMMENDATIONS**: 5 (bigger ideas worth your call)
- **VERIFIED CORRECT**: 30+ items confirmed working

## Two themes worth flagging up front

1. **The previous leap-year/TZ fix only landed in one place.** Commit `568b96e` patched `retirement-utils.ts` with `parseLocalDate`, but the same broken pattern (`new Date(YYYY-MM-DD)` + `setFullYear(...)`) is still in `retirement-forecast-service.ts`, `succession-planning-service.ts`, and `reports-service.ts` Pilot Info path. Two screens already show different retirement dates for the same pilot.
2. **The 5-minute report cache is silently dead.** TTL passed in seconds where the cache helper expects milliseconds, so local cache lives 300ms and Redis gets `Math.floor(300/1000)=0`. Plus `invalidateReportCache()` calls `invalidateCacheByTag()` but no tags were ever attached. Every preview re-runs the full query pipeline. Hidden today; will surface bigger problems when fixed (see cache-key bug below — different filters can collide on the same key).

---

## CRITICAL FINDINGS

### Cache & invalidation (affects every report)

- [ ] **C1** `lib/services/reports-service.ts:2169-2197` — Cache TTL passed in seconds (300); unified-cache-service expects ms. Local cache expires in 300ms, Redis gets 0s. 5-min cache is fiction.
      **Fix**: pass `REPORT_CACHE_CONFIG.TTL_SECONDS * 1000`.

- [ ] **C2** `lib/services/reports-service.ts:2208-2212` — `invalidateReportCache()` calls `invalidateCacheByTag()` with no tags ever attached on `getOrSet`. Silent no-op.
      **Fix**: pass `{ tags: [...] }` as 4th arg of `getOrSet`.

- [ ] **C3** `lib/services/reports-service.ts:61-70` — `generateCacheKey` uses `Object.keys(filters).sort()` as JSON.stringify replacer **allowlist**. Nested object keys (e.g. `dateRange.startDate`, `dateRange.endDate`) are stripped → different date ranges produce the same cache key → stale data when caching works. Same with array order: `rank: ['Captain','First Officer']` vs reversed = two cache entries for identical results.
      **Fix**: deep-sort serializer, e.g. recursive key sort or stable hash.

- [ ] **C4** `lib/services/reports-service.ts:69` — `.substring(0, 48)` of base64 JSON. Filter sets sharing 48-char prefix collide.
      **Fix**: SHA-256 hash or full string.

### Timezone & date math (FAA compliance impact)

- [ ] **C5** `lib/services/reports-service.ts:479-486` — Cert `daysUntilExpiry`: `new Date()` keeps current time; date-only column `expiry_date` parses to UTC midnight. After ~14:00 PNG, a cert expiring **today** shows as **EXPIRED (-1 day)**. Plus `Math.floor` rounds toward -∞ where `certification-status.ts:68-76` uses `Math.ceil` after `setHours(0,0,0,0)`. **Same cert: dashboard shows yellow, report shows red.**
      **Fix**: use the shared `getDaysUntilExpiry()` and `getCertificationStatus()` utils.

- [ ] **C6** `lib/utils/date-format.ts:25,52` — `formatAustralianDate`/`formatAustralianDateTime` pass no `timeZone` to `toLocale*`. On Vercel (UTC), PNG dates render off-by-one or 10 hours behind.
      **Fix**: pass `timeZone: 'Pacific/Port_Moresby'`; for date-only strings, split on `-` to avoid TZ shift entirely.

- [ ] **C7** `lib/utils/roster-periods.ts:54-87` — **Second roster anchor that disagrees with `roster-utils.ts`.** Uses `new Date('2025-10-11')` (UTC midnight) + `setDate()` (local) + `toISOString().split('T')[0]` (back to UTC). On PNG/Sydney servers this drifts the roster start/end by one day. CLAUDE.md anchor (RP13/2025 = 2025-11-08) is honored in `roster-utils.ts` but violated by `roster-periods.ts`. **All roster-period filters that route through `roster-periods.ts` miss the last day of every period.**
      **Fix**: use `new Date(2025, 9, 11)` constructor + date-fns `format(date, 'yyyy-MM-dd')`; reconcile to a single anchor module.

- [ ] **C8** `lib/services/reports-service.ts:1781-1798` (Pilot Info) / `lib/services/retirement-forecast-service.ts:76-78, 307-309` / `lib/services/succession-planning-service.ts:189-212` — None use the new `parseLocalDate` helper. Feb-29 / TZ bug from commit `568b96e` only fixed in `retirement-utils.ts`. Pilots born late month get off-by-one retirement dates; can land in wrong 2yr/5yr horizon or skip monthly buckets.
      **Fix**: import `parseLocalDate` or extract shared `computeRetirementDate(dob, age)` util.

- [ ] **C9** `lib/services/retirement-forecast-service.ts:296-308` — Bucket walk uses `current.setMonth(current.getMonth() + 1)` starting from `today`. On the 31st of months without 31 days, JS silently rolls forward (Jan 31 → Mar 3), **skipping Feb entirely**. Pilots retiring in skipped month → `monthlyBuckets.get(...)===undefined` → dropped silently.
      **Fix**: `new Date(today.getFullYear(), today.getMonth() + i, 1)` with counter.

- [ ] **C10** `lib/services/retirement-forecast-service.ts:319` — Timeline uses `<= today` to filter past retirements; 2yr/5yr counters use `< 2.0`/`< 5.0`. Pilot retiring exactly on cutoff dropped from BOTH.
      **Fix**: pick one boundary convention and apply across all three callsites.

- [ ] **C11** `lib/services/retirement-forecast-service.ts:458-459` — `captainUtilization = requiredCaptains / runningCaptains * 100`. When `runningCaptains === 0` → `Infinity`. When negative (data error) → negative %, classified `'none'` despite clear shortage. Summary `avgCaptainUtil` → NaN.
      **Fix**: guard `runningCaptains <= 0` → treat as `critical`.

### Broken outputs

- [ ] **C12** `lib/services/reports-service.ts:1141-1156` (PDF `flight-requests` branch) — references `item.pilot?.first_name`, `item.flight_date`, `item.description`, `item.status`. None of these exist on unified `pilot_requests` rows (uses `name`, `start_date`, `workflow_status`). **Every Flight Requests PDF renders "undefined undefined" / "N/A" for every cell.** Preview works because it uses a generic table.
      **Fix**: route the `flight-requests` PDF branch through the `rdo-sdo` branch (the service already redirects) or rewrite to use unified-schema fields.

- [ ] **C13** `lib/services/reports-service.ts:971,1005,1147,1182,1215` — Pilot name composed via `` `${item.pilot?.first_name} ${item.pilot?.last_name}` ``. When pilot soft-deleted → cell shows literal `"undefined undefined"`.
      **Fix**: guard `item.pilot ? ... : 'N/A'`; leave/rdo branches already do this.

- [ ] **C14** `lib/services/reports-service.ts:1187-1235` — Cert status column uses color-only differentiation. Yellow `#F1C40F` on white = ~1.7:1 contrast (**WCAG AA fails**). No symbol/icon. PDFs are routinely printed B&W by compliance auditors.
      **Fix**: prefix with text marker (`! `, `X `, `OK `) — default font lacks unicode glyphs; darken yellow; bold EXPIRED/EXPIRING SOON for redundancy.

### Schema/UI ↔ DB mismatches

- [ ] **C15** `components/reports/leave-bids-report-form.tsx:104-107` + `lib/validations/reports-schema.ts:91-94` — Form/Zod exposes `PROCESSING` status. **DB constraint allows only PENDING|APPROVED|REJECTED|WITHDRAWN**. Filter by Processing → always 0. `WITHDRAWN` missing from UI.
      **Fix**: drop `PROCESSING`; add `WITHDRAWN` checkbox + summary bucket.

- [ ] **C16** `lib/services/reports-service.ts:625-641` (All Requests) — Single `filters.status` applied to two incompatible columns (`workflow_status` vs `status`) with disjoint vocabularies. `PENDING` returns 0 pilot_requests; `SUBMITTED` returns 0 leave_bids. Cross-system status filter cannot work as-is.
      **Fix**: map filter values per-table, or compute unified `effective_status`.

- [ ] **C17** `lib/services/reports-service.ts:1535-1537` — Leave-bids `rosterPeriods` filter uses `.in('roster_period_code', ...)` against the primary column only. Multi-period bids (bid options spanning RP13 with primary RP12) **silently filtered out** when RP13 selected.
      **Fix**: post-fetch filter against `roster_periods_all`, or overlap on option start/end dates.

### Pilot Info / Forecast logic

- [ ] **C18** `lib/services/reports-service.ts:1750` — When `qualifications` filter is set, code `return true` for any non-Captain. **Qualification filter is silently ignored for First Officers**, who all pass through. "Examiners" filter returns all FOs + only examiner captains.
      **Fix**: exclude FOs when qualification filter active, OR rename to "Captain Qualifications" and add UI affordance.

- [ ] **C19** `lib/services/reports-service.ts:1716` — Pilot query has no upper bound. Default Supabase limit = 1000 rows. When `activeStatus='all'` includes historical pilots and org grows past 1000, **silent truncation**.
      **Fix**: paginate-to-exhaustion (pattern from commit `4f8216c`).

- [ ] **C20** `lib/services/reports-service.ts:1858-1860` — `(a.seniority_number || 999)` treats `0` as 999, burying pilot #0. Also `lib/services/reports-service.ts:1594` — `bid.pilot?.seniority_number || 0` treats null as 0 → null-seniority pilots sort to top of bid priority.
      **Fix**: use `??` instead of `||`; handle null-seniority explicitly.

- [ ] **C21** `lib/services/reports-service.ts:1922` — Forecast hardcodes `retirementAge = 65`. Other services pull from system settings; if org adjusts, **forecast disagrees with pilot detail card**.
      **Fix**: load from system settings.

- [ ] **C22** `lib/services/succession-planning-service.ts:189-212` — When materialized view missing (`42P01`/`PGRST205` paths), falls back to `yearsOfService >= 15 AND age >= 35` — **arbitrary, ignores certs/quals/license**. User has no signal report ran against fallback. Readiness score in same report derives from these synthesized candidates.
      **Fix**: surface `data_source: 'fallback'` flag in response or fail loudly; align fallback criteria with MV.

---

## IMPORTANT FINDINGS

### Reports service (data layer)

- [ ] **I1** `reports-service.ts:501-505` — Cert `expiryThreshold` filter is `<= filters.expiryThreshold` and inclusive on negative side. "Expiring in 30 days" silently includes already-expired.
- [ ] **I2** `reports-service.ts:518-529` — Cert summary `current` uses hardcoded 90-day `isExpiringSoon` independent of user threshold. When threshold=30, `current` always 0 even though many visible rows are current.
- [ ] **I3** `reports-service.ts:492 vs CLAUDE.md` — **Four different "expiring soon" thresholds**: report=90, util default=30, sidebar-badges=60, detailed-status=90. Same compliance metric, four answers.
- [ ] **I4** `reports-service.ts:1187,1220 + paginated-report-table.tsx:813-814` — Status color in PDF matched against rendered text `"EXPIRING SOON"`. Fragile to i18n/casing.
- [ ] **I5** `reports-service.ts:191-211` — Leave summary lacks `draft` bucket; DRAFT rows in `totalRequests` but not in any breakdown → `sum ≠ total`.
- [ ] **I6** `reports-service.ts:1612, 1644` — `approvalRate` denominator uses post-filter total. Filter to APPROVED → approvalRate=100% always.
- [ ] **I7** `reports-service.ts:1583-1587` — `bid_year` from `enrichedOptions[0].start_date` (storage order, not priority). Year filter (l. 1601-1603) can exclude bid based on wrong year.
- [ ] **I8** `reports-service.ts:686` — `filteredData = allRequests.filter(...)` (uses `allRequests`, not running `filteredData`). Harmless today, fragile.
- [ ] **I9** `reports-service.ts:1062, 1100` — `days_count` default `'1'` when null → multi-day RDO/SDO silently renders as 1-day.
- [ ] **I10** `reports-service.ts:531-537` — `avgCaptainUtil = sum / monthly.length` → NaN when zero.
- [ ] **I11** `retirement-forecast-service.ts:87-89` — `monthsUntilRetirement = Math.floor(diffMs / 30.44 days)` — pilot retiring in exactly 12 cal months may show as 11.
- [ ] **I12** `reports-service.ts:1925-1929` — `getCrewImpactAnalysis` always 5 years regardless of `timeHorizon`. 2yr horizon shows 5yr warnings.
- [ ] **I13** `reports-service.ts:1918-1929` + `reports-schema.ts:124` — Zod accepts `'10yr'` horizon; service implements only 2yr/5yr. **10yr silently falls back to 5yr** with no warning.
- [ ] **I14** `succession-planning-service.ts:178-182` — Years-in-service = `(now - start) / 365.25days` then `Math.floor`. 14.99 → 14 → misses `>= 15` ready threshold. Pilot detail card uses different formula → inconsistent.
- [ ] **I15** `reports-service.ts:1751-1761` — `parseCaptainQualifications` returns null for malformed JSON; filter then returns false → captain disappears from report instead of surfacing data-quality issue.
- [ ] **I16** `reports-schema.ts:64-65` — `<= 365 * 2` rejects 731-day ranges spanning leap year.

### UX / forms

- [ ] **I17** `reports-client.tsx:22-23,37` — Active tab in `useState`, not nuqs. CLAUDE.md says nuqs is used. Not bookmarkable, lost on refresh, per-tab filter state erased.
- [ ] **I18** `reports-client.tsx:38-66` — 6 tabs with `flex-wrap` collapse messily on mobile/tablet into uneven rows; no scroll affordance.
- [ ] **I19** `report-preview-dialog.tsx:43-46, 154-162` — Preview is "first N records", but you can't paginate inside it OR export from it. User goes back to form and re-runs as export.
- [ ] **I20** `Across all 6 forms` — 24 duplicated `useEffect`s (4 per form × 6) registering toast for previewError/exportMutation/etc. Leave-bids form uses mutate callbacks instead — inconsistent contract.
- [ ] **I21** `report-email-dialog.tsx:42, 81-96` — Recipient validation is `min(1)` only, no email format. "joh@" fails silently after roundtrip.
- [ ] **I22** `paginated-report-table.tsx:927-932` — Loading spinner missing `role="status"`, `aria-label`, reduced-motion. Screen readers silent; users with reduced-motion get spinning ring.
- [ ] **I23** `leave-bids-report-form.tsx` vs others — Action button order/variants inconsistent. Leave-bids: `[solid Preview][outline Export][outline Email]`; others: `[outline][solid][secondary]`.
- [ ] **I24** `leave-report-form.tsx:131,450` — Field `statusPending` labelled "Draft" but maps to DB value `DRAFT`. Form variable vs label vs DB term mismatch.
- [ ] **I25** `flight-request-report-form.tsx:118` — "Pending" checkbox maps to `'DRAFT'` but flight requests start at `'SUBMITTED'`. Users filter "Pending", get nothing.
- [ ] **I26** `leave-bids-report-form.tsx:38` / `leave-report-form.tsx:72` / `certification-report-form.tsx:112` — Hardcoded `[2025, 2026]` year ranges, will go stale in 2027. Three different policies across forms.
- [ ] **I27** `leave-report-form.tsx:34` + others — `DatePresetButtons` imported but never rendered (dead code per "user request" comments). Dead handlers too.
- [ ] **I28** `report-preview-dialog.tsx:68` — Fixed `max-w-5xl`. 18-col pilot-info table → horizontal scroll inevitable but no shadow/scroll-hint.
- [ ] **I29** `filter-preset-manager.tsx:37` — Presets only for 4 of 6 report types (excludes pilot-info, forecast). Inconsistent affordance.
- [ ] **I30** `All forms` — Unfiltered preview fires `{}` and returns everything. No "this will fetch all N records, continue?" confirm.
- [ ] **I31** `leave-report-form.tsx:312-322` — Raw `<input type="date">`. No `endDate >= startDate` validation, no clear button.

### PDF

- [ ] **I32** `reports-service.ts:846,955,989,1038,1076,1111,1142,1178,1210,1364,1378,1403,1418,1433` — Every `autoTable` lacks `margin: {top, bottom}` and `didDrawPage` callback to redraw letterhead on every page. Multi-page reports lose branding after p1; rows overlap footer.
- [ ] **I33** `reports-service.ts:989-1108` — No `columnStyles`/widths on flat tables. Long PNG names ("Joseph Tuiavi'i", hyphens) and long roster period strings either truncate or break layout.
- [ ] **I34** `reports-service.ts:982-1444` — Header `fillColor` varies wildly per report (blue/green/purple/sky/red/yellow). Yellow header has default white text → near-invisible. No standardized brand `headStyles`.
- [ ] **I35** `reports-service.ts:838-1463` — No `alternateRowStyles` anywhere in main service (renewal-planning uses them). Dense 8-col tables at fontSize 6-7 are hard to scan without zebra stripes.
- [ ] **I36** `app/api/reports/export/route.ts:113-115` — Filename `{type}-report-{utc-iso-date}.pdf`. No filter signature → "March 2025" and "all-time" exports collide; UTC date is wrong in PNG.
- [ ] **I37** `app/api/reports/export/route.ts:114-115` — `reportType` interpolated raw. Sanitization is cheap defense if enum widens.
- [ ] **I38** `app/api/reports/email/route.ts:115-129` — 10MB guard runs AFTER PDF generation. Lambda CPU/memory burned to build doc we'll refuse.
- [ ] **I39** `app/api/reports/email/route.ts:136-166` — HTML email no plain-text fallback (deliverability), no branded template.
- [ ] **I40** `reports-service.ts:838-1463` — `doc.setProperties({title, author, subject, creator})` never called. PDFs open with filename as title; no DMS/archival metadata.
- [ ] **I41** `reports-service.ts:838-1463` — `report.generatedBy` captured but never rendered on PDF. Loses chain of custody.

---

## NICE-TO-HAVE (selected)

- **N1** `reports-service.ts:494-495` — `formattedExpiryDate` uses `toLocaleDateString()` no locale/TZ → server-default (US on Vercel). Use `formatAustralianDate`.
- **N2** `reports-service.ts:1062, 1100` — When `end_date` null, falls back to `start_date` → shows start as end. `'-'` or "ongoing" clearer.
- **N3** `reports-service.ts:851-856` — Logo `readFileSync` once per PDF; cold starts block. Module-level cache.
- **N4** `leave-bids-pdf-service.ts:140-149` — Different header layout/font sizes vs `reports-service.ts`. Extract `drawReportHeader()` helper.
- **N5** `reports-service.ts:1453-1461` — Footer only "Page X of Y". Mirror leave-bids PDF which adds branding + report short-title.
- **N6** `reports-service.ts:881` — jsPDF default Helvetica has no Unicode → PNG diacritics render as `?`. Embed Noto Sans subset.
- **N7** `reports-service.ts:909-921` — Summary key labels via `replace(/([A-Z])/g, ' $1')` → "Compliance Rate" missing "(%)" etc. Numbers not locale-formatted.
- **N8** `paginated-report-table.tsx:857-907` — Grouping controls show only `roster_period` and `rank`; pilot-info/forecast never expose grouping despite form-level support.
- **N9** `report-email-dialog.tsx` — Email recipient UI is free-text. Chip-style with X-to-remove (Slack pattern) is much better.
- **N10** `report-preview-dialog.tsx` — "Open in new window" for wide tables.
- **N11** Across forms — No CSV/Excel export. Aviation admins typically need spreadsheet data.
- **N12** `reports-client.tsx` — No "Recent Reports" or run history.
- **N13** Across forms — No "scheduled report" (CRON_SECRET infra exists per CLAUDE.md).
- **N14** `filter-preset-manager.tsx:96-110` — No confirm before deleting a preset.
- **N15** `date-filter-toggle.tsx` — Two-option radio could be tighter as segmented control / `ToggleGroup`.
- **N16** `report-preview-dialog.tsx:71-77` — Air Niugini logo as 24px modal-title image is borderline aviation-decor per your no-AI-slop rule.
- **N17** `reports-service.ts:765-770` — Group-by `rank` falls back to `pilot?.role`; unified table has denormalized `rank` column.
- **N18** `reports-service.ts:1716` — `.order('seniority_number', { nullsFirst: false })` — but no upper-bound `.range()`. Default Supabase 1000 limit.

---

## DESIGN RECOMMENDATIONS (bigger ideas — needs your call)

- [ ] **D1 — Group 6 reports into 3 categories** (Operations / Compliance / Planning) to clean up the tab bar on mobile and give users a mental model. Two-level nav.
- [ ] **D2 — Extract `<ReportForm>` shell** to absorb the 4,000 lines of near-duplicate filter/action code across the 6 forms. Single `reportType` + `filterSchema` prop. Forces consistency, easier to add reports later.
- [ ] **D3 — Move action buttons to sticky footer inside the Card** so Preview/Export/Email is always reachable on long forms (cert form has 800px of grids above the buttons).
- [ ] **D4 — Bookmark/share filter URLs via nuqs** — every filter (tab, filterMode, rosterPeriods, status[], rank[]) serialized to query params. Solves both "preserve filters across tab switches" and "share report links." Highest-leverage single UX win.
- [ ] **D5 — Unify Preview + Export into one "Run Report" flow** — Preview-then-Export is two round-trips for the same query. Run once → modal opens with `[Export PDF][Export CSV][Email][Close]` in footer.

---

## VERIFIED CORRECT (sample)

- `request_category='LEAVE'` + `workflow_status` (not `status`) used consistently in `generateLeaveReport`
- `pilot_checks` correct source for certifications (not `pilot_requests`)
- Active-pilot filter (`is_active===true`) correctly excludes inactive pilots
- Roster anchor in `roster-utils.ts` is TZ-stable (`new Date(2025, 10, 8)` local constructor)
- `getAffectedRosterPeriods` handles year wrap (RP13→RP1) correctly
- Leave-eligibility 10+10 rule, per-rank, seniority ordering all match business rules
- Date-range overlap (`lte start, gte end OR null end`) correctly catches ongoing leave
- CSRF + auth + rate-limit middleware pipeline correctly applied to preview/export/email
- `fullExport=true` skips cache and pagination (l. 2143)
- Two-pass PDF page numbering ("Page X of Y") via `getNumberOfPages()` after all tables
- Dynamic imports of jspdf/jspdf-autotable keep ~300KB out of non-PDF code paths
- Export 10MB guard returns 413 with actionable message
- Service-layer hooks (`useReportPreview`, `useReportExport`, `usePrefetchReport`) are exemplary TanStack Query usage
- Color tokens (`var(--color-status-low)`, `var(--color-info)`) consistent, dark-mode-safe
- Roster-period multi-select has keyboard support, chips, select-all/clear-all
- Forecast form correctly disables actions when no section selected
- No gradient/glassmorphism/glow violations spotted across 17 UI files reviewed

---

## Suggested Fix Batches

Per CLAUDE.md "PLAN FIRST → GET APPROVAL" workflow, here are the natural batches in priority order. Each batch fits the "5-8 files, build after each" rule.

- **Batch 1 (Quick wins, low risk)**: C12 (Flight PDF fields), C13 (`undefined undefined` guard), C20 (`||` → `??`), I9 (days_count null), I27 (dead DatePresetButtons), I25 (Pending→Draft label), I26 (year ranges centralize)
- **Batch 2 (Date/TZ correctness — touches many files)**: C5, C6, C8, C9 — get `parseLocalDate` and TZ-aware date utils everywhere; reconcile to single util
- **Batch 3 (Cache correctness)**: C1, C2, C3, C4 — fix TTL, attach tags, fix cache-key replacer, hash instead of substring
- **Batch 4 (Roster anchor reconciliation)**: C7 — single source of truth for roster periods
- **Batch 5 (Schema/UI ↔ DB)**: C15, C16, C17, I5, I6 — leave-bids PROCESSING/WITHDRAWN, All Requests status, multi-period bids
- **Batch 6 (Cert thresholds standardization)**: C14 (color+text), I1, I2, I3 — pick one "expiring soon" definition; respect user threshold in summary
- **Batch 7 (UX papercuts)**: I17 (nuqs for tabs), I19 (export-from-preview), I21 (email validation), I22 (a11y on spinner), I23 (button consistency), I30 (unfiltered-preview confirm)
- **Batch 8 (PDF polish)**: I32 (didDrawPage), I33 (columnStyles), I34 (brand headStyles), I35 (zebra), I36 (filename context), I40 (setProperties), I41 (generated-by)
- **Batch 9 (Forecast accuracy — needs DB awareness)**: C10, C11, C18, C19, C21, C22, I11, I12, I13, I14 — riskier; one batch with careful test coverage
- **Batch 10 (Design recommendations — needs explicit user approval)**: D1–D5
