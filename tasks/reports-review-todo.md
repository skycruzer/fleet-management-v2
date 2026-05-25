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

- [x] **C1** ✓ Batch 3 — Pass `REPORT_CACHE_CONFIG.TTL_SECONDS * 1000` so `getOrSet` receives ms. Local cache now lives 5 min; Redis gets 300 s.
- [x] **C2** ✓ Batch 3 — Added `getReportCacheTag(reportType)` helper; `getOrSet` call now passes `{ tags: [tag] }`. `invalidateReportCache()` is no longer a no-op.
- [x] **C3** ✓ Batch 3 — Replaced broken `JSON.stringify(filters, Object.keys(filters).sort())` (replacer-as-allowlist that stripped nested keys) with `stableStringify()` that recursively sorts object keys. Arrays remain unordered to preserve `groupBy` semantics (set-semantic arrays like `rank` accept a one-time 2× cache cost for reorderings — acceptable trade-off vs the correctness risk of sorting `groupBy`).
- [x] **C4** ✓ Batch 3 — Replaced truncated base64 prefix with full SHA-256 digest (also base64url). Prefix collisions can't happen.

### Timezone & date math (FAA compliance impact)

- [x] **C5** ✓ Batch 2 — Cert pipeline now uses shared `getDaysUntilExpiry()` (setHours(0,0,0,0) + Math.ceil). Report and dashboard agree for the same cert. `formattedExpiryDate` now goes through `formatAustralianDate` for consistency.
- [x] **C6** ✓ Batch 2 — Both `formatAustralianDate` and `formatAustralianDateTime` pass `timeZone: 'Pacific/Port_Moresby'`. Date-only `YYYY-MM-DD` strings get string-sliced to `DD/MM/YYYY` before the Date-roundtrip to skip any TZ shift entirely.
- [x] **C7** ✓ Batch 4 — Anchor switched to local-time constructor (`new Date(2025, 9, 11)`). Output uses date-fns `format(date, 'yyyy-MM-dd')` instead of `toISOString().split('T')[0]` so the returned date strings reflect local calendar days. `generateRosterPeriods`' today-comparison also switched to local format so it doesn't mix UTC `today` with local `endDate`. (The dual-anchor situation between `roster-periods.ts` and `roster-utils.ts` is mathematically consistent — RP12 anchor + 28 days = RP13 anchor — and was left as-is. A future refactor could consolidate to one anchor module.)
- [x] **C8** ✓ Batch 2 — `parseLocalDate` exported from `retirement-utils.ts`. Propagated to: `reports-service.ts` pilot-info enrichment (with Feb-29 clamp); `retirement-forecast-service.ts` via new private `computeRetirementDate(dob, age)` helper used in both forecast and timeline paths; `succession-planning-service.ts` candidate loop + readiness-score Captain loop.
- [x] **C9** ✓ Batch 2 — Bucket walk rewritten as counter-based `new Date(year, month + i, 1)`. Walking by `setMonth(+1)` on day-31 dates silently skipped months; now every month gets its bucket.

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

- [x] **C15** ✓ Batch 5 — `PROCESSING` removed from `ReportFiltersSchema` and leave-bids form. `WITHDRAWN` checkbox added to the form alongside the existing schema entry and summary bucket.
- [x] **C16** ✓ Batch 5 — `filters.status` is now split into `workflowStatuses` (applied to `pilot_requests` via `workflow_status`) and `bidStatuses` (applied to `leave_bids` via `status`). When the user actively filters status, each source is included only if at least one of its applicable statuses was selected — prevents over-permissive "no applicable filter → all rows" leaks.
- [x] **C17** ✓ Batch 5 — DB-level `.in('roster_period_code', ...)` filter removed. Replaced with a post-enrichment filter against `bid.roster_periods_all`, which is the union of the primary roster period and every option's computed period. Multi-period bids now match when their options span the selected period.

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

- [x] **I1** ✓ Batch 6 — Threshold filter now requires `>= 0`, so "Expiring in 30 days" stops including already-expired certs. (If users need a combined "needs attention" view, that's a separate UX addition.)
- [x] **I2** ✓ Batch 6 — Summary's `isExpiringSoon` now respects the user's threshold (falls back to `DEFAULT_THRESHOLDS.EXTENDED_WARNING_DAYS=90` when unset). Summary buckets and the visible table now agree on what counts as "soon".
- [x] **I3** ✓ Batch 6 (partial) — Report now references `DEFAULT_THRESHOLDS.EXTENDED_WARNING_DAYS` from `certification-status.ts` instead of magic number 90. The 30 vs 90 difference between the badge default and the report default is documented inline as deliberately distinct operational concepts (30 = mandatory advance notice, 90 = renewal-planning window). Sidebar-badges (60) is a third UX-level intermediate not covered here.
- [ ] **I4** `reports-service.ts:1187,1220 + paginated-report-table.tsx:813-814` — Status color in PDF matched against rendered text `"EXPIRING SOON"`. Fragile to i18n/casing.
- [x] **I5** ✓ Batch 5 — `draft` bucket added to leave summary. `totalRequests` once again equals the sum of category buckets.
- [x] **I6** ✓ Batch 5 — `approvalRate` is now omitted (set to `undefined`) whenever a status filter is active, since rate-of-filtered-subset is misleading (filtering to APPROVED would always show 100%). The PDF service already guards on `summary.approvalRate !== undefined` so it simply skips the line.
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
