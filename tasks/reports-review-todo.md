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

- [x] **C10** ✓ Batch 9 — Timeline now uses `< today` (include retire-today) and `>= horizon` (exclude exactly-at-horizon), aligned with forecast counters that use `< 2.0`/`< 5.0`. A pilot retiring exactly on the cutoff lands in exactly one bucket.
- [x] **C11** ✓ Batch 9 — Guard `runningCaptains <= 0` → `Number.POSITIVE_INFINITY`; same for FOs. Critical case still classifies as `'critical'` via the existing `maxUtilization >= 100` check. Average utilisation summary filters non-finite values so a single Infinity no longer poisons the result into NaN.

### Broken outputs

- [ ] **C12** `lib/services/reports-service.ts:1141-1156` (PDF `flight-requests` branch) — references `item.pilot?.first_name`, `item.flight_date`, `item.description`, `item.status`. None of these exist on unified `pilot_requests` rows (uses `name`, `start_date`, `workflow_status`). **Every Flight Requests PDF renders "undefined undefined" / "N/A" for every cell.** Preview works because it uses a generic table.
      **Fix**: route the `flight-requests` PDF branch through the `rdo-sdo` branch (the service already redirects) or rewrite to use unified-schema fields.

- [ ] **C13** `lib/services/reports-service.ts:971,1005,1147,1182,1215` — Pilot name composed via `` `${item.pilot?.first_name} ${item.pilot?.last_name}` ``. When pilot soft-deleted → cell shows literal `"undefined undefined"`.
      **Fix**: guard `item.pilot ? ... : 'N/A'`; leave/rdo branches already do this.

- [x] **C14** ✓ Batch 6 — Status cells now prefix with text markers (`X EXPIRED`, `! EXPIRING SOON`) so distinction survives B&W printing. Yellow darkened from #F1C40F (~1.7:1) to #B58900 (~5.4:1, WCAG AA). Both warning statuses are bold. didParseCell matches on the marker prefix (`startsWith('X ')` / `startsWith('! ')`) so a future i18n/casing tweak doesn't silently lose the color — incidentally addresses I4 too.

### Schema/UI ↔ DB mismatches

- [x] **C15** ✓ Batch 5 — `PROCESSING` removed from `ReportFiltersSchema` and leave-bids form. `WITHDRAWN` checkbox added to the form alongside the existing schema entry and summary bucket.
- [x] **C16** ✓ Batch 5 — `filters.status` is now split into `workflowStatuses` (applied to `pilot_requests` via `workflow_status`) and `bidStatuses` (applied to `leave_bids` via `status`). When the user actively filters status, each source is included only if at least one of its applicable statuses was selected — prevents over-permissive "no applicable filter → all rows" leaks.
- [x] **C17** ✓ Batch 5 — DB-level `.in('roster_period_code', ...)` filter removed. Replaced with a post-enrichment filter against `bid.roster_periods_all`, which is the union of the primary roster period and every option's computed period. Multi-period bids now match when their options span the selected period.

### Pilot Info / Forecast logic

- [x] **C18** ✓ Batch 9 — Qualifications filter now `return false` for non-Captains (was `return true` — letting all FOs through). Filtering "Examiners" now returns only examiner Captains. Malformed `captain_qualifications` JSON logs a warning so admins can spot the bad record.
- [x] **C19** ✓ Batch 9 — `generatePilotInfoReport` now paginates pilot fetch to exhaustion (PAGE_SIZE=1000, MAX_PAGES=50). Mirrors the certification-service pattern. Org growth past 1000 no longer silently truncates pilot-info reports.

- [ ] **C20** `lib/services/reports-service.ts:1858-1860` — `(a.seniority_number || 999)` treats `0` as 999, burying pilot #0. Also `lib/services/reports-service.ts:1594` — `bid.pilot?.seniority_number || 0` treats null as 0 → null-seniority pilots sort to top of bid priority.
      **Fix**: use `??` instead of `||`; handle null-seniority explicitly.

- [x] **C21** ✓ Batch 9 — `DEFAULT_RETIREMENT_AGE` constant now exported from `retirement-utils.ts` and consumed in both the forecast report and the pilot-info enrichment. Single source of truth (the real "from system settings" lookup is a future wiring; today every site at least agrees on the same default).
- [x] **C22** ✓ Batch 9 — `getCaptainPromotionCandidates` summary now includes `dataSource: 'materialized_view' | 'fallback'`. UI/reports can surface a warning when the fallback path ran so users know the readiness pool came from a permissive yearsOfService + age heuristic instead of the canonical MV rules.

---

## IMPORTANT FINDINGS

### Reports service (data layer)

- [x] **I1** ✓ Batch 6 — Threshold filter now requires `>= 0`, so "Expiring in 30 days" stops including already-expired certs. (If users need a combined "needs attention" view, that's a separate UX addition.)
- [x] **I2** ✓ Batch 6 — Summary's `isExpiringSoon` now respects the user's threshold (falls back to `DEFAULT_THRESHOLDS.EXTENDED_WARNING_DAYS=90` when unset). Summary buckets and the visible table now agree on what counts as "soon".
- [x] **I3** ✓ Batch 6 (partial) — Report now references `DEFAULT_THRESHOLDS.EXTENDED_WARNING_DAYS` from `certification-status.ts` instead of magic number 90. The 30 vs 90 difference between the badge default and the report default is documented inline as deliberately distinct operational concepts (30 = mandatory advance notice, 90 = renewal-planning window). Sidebar-badges (60) is a third UX-level intermediate not covered here.
- [x] **I4** ✓ Batch 6 (side-effect of C14) — PDF status matcher switched to `startsWith('X ')` / `startsWith('! ')`. Label tweaks (i18n/casing/copy edits) won't lose the color. The paginated-report-table.tsx variant is still text-coupled — left for the UX batch.
- [x] **I5** ✓ Batch 5 — `draft` bucket added to leave summary. `totalRequests` once again equals the sum of category buckets.
- [x] **I6** ✓ Batch 5 — `approvalRate` is now omitted (set to `undefined`) whenever a status filter is active, since rate-of-filtered-subset is misleading (filtering to APPROVED would always show 100%). The PDF service already guards on `summary.approvalRate !== undefined` so it simply skips the line.
- [ ] **I7** `reports-service.ts:1583-1587` — `bid_year` from `enrichedOptions[0].start_date` (storage order, not priority). Year filter (l. 1601-1603) can exclude bid based on wrong year.
- [ ] **I8** `reports-service.ts:686` — `filteredData = allRequests.filter(...)` (uses `allRequests`, not running `filteredData`). Harmless today, fragile.
- [ ] **I9** `reports-service.ts:1062, 1100` — `days_count` default `'1'` when null → multi-day RDO/SDO silently renders as 1-day.
- [ ] **I10** `reports-service.ts:531-537` — `avgCaptainUtil = sum / monthly.length` → NaN when zero.
- [x] **I11** ✓ Batch 9 — New `monthsBetween(from, to)` helper uses calendar arithmetic (year-month diff with day-of-month adjustment). A pilot retiring in exactly 12 calendar months now reads as 12, not 11.
- [x] **I12** ✓ Batch 9 — `getCrewImpactAnalysis` and `getMonthlyRetirementTimeline` accept an optional `horizonMonths` param. Forecast report passes `24` for 2yr / `60` for 5yr. Shortage warnings now respect the user's chosen horizon.
- [x] **I13** ✓ Batch 9 — `'10yr'` removed from both the Zod schema enum and the forecast form's local enum + radio option. Title-generator's horizon-label map drops the unreachable key. Users no longer get a 10yr selection that silently degraded to 5yr.
- [x] **I14** ✓ Batch 9 — `yearsBetween(from, to)` helper added to retirement-utils. Succession-planning fallback now uses calendar-aware years-of-service + age, so a pilot 14 years + 364 days into service correctly reads as 14 (consistent with the pilot detail card).
- [x] **I15** ✓ Batch 9 — Pilot Info qualifications filter now `console.warn`s when a captain has a malformed `captain_qualifications` JSON. Filter still excludes (we can't safely classify them) but admins can now see and fix the underlying data quality issue.
- [ ] **I16** `reports-schema.ts:64-65` — `<= 365 * 2` rejects 731-day ranges spanning leap year.

### UX / forms

- [x] **I17** ✓ Batch 7 — Active tab now uses `useQueryState` + `parseAsStringLiteral` (matches the pattern already used in certifications-page-client.tsx). Tab is URL-synced (`?tab=leave`), shareable, and survives refresh. Per-tab filter state still resets when switching tabs — that's a separate UX call (would require lifting filter state into the URL, which is the bigger D4 nuqs work).
- [ ] **I18** `reports-client.tsx:38-66` — 6 tabs with `flex-wrap` collapse messily on mobile/tablet into uneven rows; no scroll affordance.
- [x] **I19** ✓ Batch 7 — Preview dialog now has Export PDF + Email Report buttons in its footer (gated on the new optional `filters` + `onEmail` props). All 6 forms pass them through, so users can act on what they're previewing without going back to the form. Pagination inside preview is a separate API-shape change (preview endpoint doesn't accept a `page` param yet) — deferred.
- [ ] **I20** `Across all 6 forms` — 24 duplicated `useEffect`s (4 per form × 6) registering toast for previewError/exportMutation/etc. Leave-bids form uses mutate callbacks instead — inconsistent contract.
- [x] **I21** ✓ Batch 7 — `recipientListSchema(allowEmpty)` Zod superRefine splits the input on `,;` and validates each token with `z.string().email()`. Invalid tokens surface inline (`Invalid emails: joh@, blah`). To/CC/BCC all share the validator. The handler no longer needs to split/clean — the schema already did.
- [x] **I22** ✓ Batch 7 — Spinner wrapped in `role="status" aria-live="polite"` with sr-only "Loading report data..." label. `animate-spin` → `motion-safe:animate-spin` so `prefers-reduced-motion` users get a static ring instead of a spinning one. CSS-level fix, no JS hook needed.
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

- [x] **I32** ✓ Batch 8 — `drawReportHeader()` extracted; called once on p1 for the full header + summary, then on subsequent pages via `didDrawPage` (skipping p1 to avoid duplicating the strip). Every `autoTable` now passes `margin: { top: 38, bottom: 16, left: 14, right: 14 }` so rows reserve space for the per-page header and footer.
- [x] **I33** ✓ Batch 8 (partial) — Pilot-info table already had `columnStyles`; standardized headStyles via spread. Other flat tables still use autoTable defaults — column widths there were left for a follow-up since the precise widths depend on actual PNG name lengths in production data.
- [x] **I34** ✓ Batch 8 — `BRAND_HEAD_STYLES` constant (Air Niugini red, white text, bold) replaces the 6 per-report `fillColor` variations (blue/green/purple/sky/red/yellow). Crew Shortage section's WCAG-failing white-on-yellow is now red-on-white. Section colour-coding moved to text/bold treatment where needed.
- [x] **I35** ✓ Batch 8 — `ALTERNATE_ROW_STYLES = { fillColor: [248, 248, 248] }` zebra striping applied to every `autoTable` call in `generatePDF`. Dense 8-col tables at fontSize 6-7 are scannable again.
- [x] **I36** ✓ Batch 8 — Export filename now `{safeType}-report-{filterSlug}-{pngDate}.pdf`. `pngDate` via `Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Port_Moresby' })`. `filterSlug` derived from `rosterPeriods` (e.g. `RP122025-RP132025`) or `dateRange` (e.g. `20250101-20251231`) or `all`. Filtered and all-time exports no longer collide.
- [x] **I37** ✓ Batch 8 — `reportType` sanitized via `replace(/[^a-z0-9._-]/gi, '_')` before interpolation into Content-Disposition. Defensive against future enum widening.
- [x] **I38** ✓ Batch 8 — Row-count pre-check (`MAX_ROWS_FOR_EMAIL = 3000`) runs BEFORE `generatePDF`. Lambda CPU/memory no longer burned on a doc we'll refuse. The 10MB byte guard is now the final safety net for edge cases (long names, wide tables).
- [x] **I39** ✓ Batch 8 — Resend payload now includes `text` field with a plain-text rendering of the same title/description/summary/footer. Improves deliverability (lower spam score) and reaches HTML-stripping ticketing systems + screen readers.
- [x] **I40** ✓ Batch 8 — `doc.setProperties({ title, subject, author, creator, keywords })` + `doc.setLanguage('en-AU')` set up-front. PDFs open with the report title (not the filename); DMS systems can index by author/keywords; screen readers announce the document language.
- [x] **I41** ✓ Batch 8 — `report.generatedBy` now rendered in the top-right of the header strip (`By: <email>` under the Generated timestamp). Chain of custody preserved on every page.

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

- [x] **D1** ✓ Batch 10 — Two-level tab nav landed. Outer category bar (Operations / Compliance / Planning) groups the six reports; inner tabs show the reports within the active category. Categories: Operations = Leave + Flight; Compliance = Certifications + Pilot Info; Planning = Leave Bids + Forecast. The `?tab=` URL param still identifies the specific report — existing links keep working. Mental model is cleaner and the inner tab bar fits without wrapping on common viewport widths.
- [ ] **D2 — Extract `<ReportForm>` shell** — Deferred to a dedicated PR. **Plan below.**
- [ ] **D3 — Move action buttons to sticky footer inside the Card** — Smaller D2 sibling; defer until after D2 lands.
- [ ] **D4 — Bookmark/share filter URLs via nuqs** — Tab state is already nuqs-synced (Batch 7); the rest is deferred to a dedicated PR. **Plan below.**
- [x] **D5** ✓ Batches 7 + 10 — Functionally complete: the preview dialog footer now hosts Export PDF + Email Report (Batch 7), so users can act on the preview without going back to the form. The form action row still keeps its own Email button as a "skip preview" shortcut, which is intentional (some users know exactly what they want to send). Full "Run Report → action footer" with CSV export added would need the new CSV path (N11) first.

### D2 migration plan (extract `<ReportForm>` shell)

**Goal**: collapse the ~4,000 lines of near-duplicate filter/action code across the 6 form components into one shell + per-report config. Forces consistency in action button order, preset wiring, loading state, error toasts, and Preview/Email dialog plumbing.

**Files involved**:

- New: `components/reports/report-form-shell.tsx` (the new shell)
- New: `lib/types/report-form-config.ts` (config interface)
- Refactor: `components/reports/leave-report-form.tsx`, `flight-request-report-form.tsx`, `leave-bids-report-form.tsx`, `certification-report-form.tsx`, `pilot-info-report-form.tsx`, `forecast-report-form.tsx` — each becomes a thin wrapper that supplies its own filter fields + schema and renders the shell.

**Suggested shape**:

```ts
// lib/types/report-form-config.ts
export interface ReportFormConfig<TInput extends Record<string, unknown>> {
  reportType: ReportType
  formSchema: z.ZodSchema<TInput>
  defaultValues: TInput
  /** Map react-hook-form values → ReportFilters for the API call */
  buildFilters: (values: TInput) => ReportFilters
  /** Apply a saved preset back onto the form values */
  applyPreset: (filters: ReportFilters, form: UseFormReturn<TInput>) => void
  /** The report-specific filter UI (date range, status checkboxes, etc.) */
  renderFilters: (ctx: { form: UseFormReturn<TInput>; onChange: () => void }) => ReactNode
}
```

**Shell responsibilities** (absorbed from every form):

- TanStack Query plumbing: `useReportPreview`, `useReportExport`, `usePrefetchReport`
- Toast error/success handling (the 4-useEffect pattern duplicated 6×)
- Action row: Preview / Export / Email buttons with consistent variants + ordering
- Active filter badge
- Filter preset manager
- Email dialog wiring
- Preview dialog wiring (already accepts optional `filters` + `onEmail`)

**Suggested order**:

1. Lift the 4 toast/effect hooks into a `useReportFormActions(reportType)` hook → drop into all 6 forms unchanged (no shell yet). Verify behaviour unchanged.
2. Create `ReportFormShell` that renders the common chrome + accepts `children` for the per-report filter UI. Migrate `leave-report-form.tsx` first (simplest filter set) as the reference implementation.
3. Migrate the other 5 forms one at a time. Verify each manually (load preview, export, email) before moving to the next.
4. Delete the now-unused boilerplate from each form file.

**Risk areas**:

- Saved filter presets reference current field names (e.g. `statusPending`). Renaming them via the migration would invalidate any presets users have already created. Keep field names stable.
- `nuqs` state (if migrated alongside) needs to live in the shell to share across reports; otherwise punt to D4.

### D4 migration plan (nuqs filter sync)

**Goal**: every filter (rosterPeriods, dateRange, status[], rank[], qualifications[], etc.) serialized to URL query params so reports can be shared via link and survive refresh. Tab state already done (Batch 7).

**Files involved**:

- New: `lib/hooks/use-report-filter-state.ts` (centralizing the parsers)
- Refactor: all 6 report form components — replace the local `useForm` state for filter fields with `useQueryState`-backed equivalents. (D2 makes this a one-file change instead of six; do D2 first.)
- Touch: `lib/utils/roster-periods.ts` (potential helper for parseAsArrayOf roster codes)

**Suggested URL shape**:

```
/dashboard/reports?tab=leave
  &rp=RP12-2025,RP13-2025          # rosterPeriods (csv, no slashes for URL friendliness)
  &from=2026-01-01&to=2026-03-31   # dateRange
  &status=DRAFT,SUBMITTED           # status[] (csv)
  &rank=Captain                     # rank[] (csv)
  &mode=roster                      # filterMode
```

**Suggested order**:

1. After D2: add `useReportFilterState()` hook in the shell that mirrors form state ↔ URL state via `useQueryStates` (nuqs batch API).
2. Add per-report parsers in the hook (lifted from each form's current `buildFilters`).
3. Defaults map to "no filter" (omit from URL), so clean `/reports?tab=leave` keeps current behaviour.
4. Add a "Copy report link" affordance to the action row.

**Risk areas**:

- Saved filter presets stored in the DB shouldn't conflict with URL state — load order matters (preset overrides URL on apply).
- Long roster-period lists could blow out URL length (RFC 2616 recommends < 2048 chars). Cap or use a deflated representation if a user picks > ~30 periods.
- Browsers/clients that strip query params from share previews would degrade gracefully (back to default filters).

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
