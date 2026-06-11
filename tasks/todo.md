# Dashboard pattern adoption — Kiranism next-shadcn-dashboard-starter

**Goal (2026-06-11):** Adopt [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
(Next.js 16 App Router + React 19 + TS + Tailwind v4 + shadcn/ui — exact stack match) as a
**pattern source** for fleet-management-v2. Borrow liftable UI/page patterns (data tables,
dashboard layouts) into our existing design system — NOT a redesign. Operations Navy theme,
StatusBadge/PageHeader, Supabase auth, service layer, and API factory all stay untouched.
Prove fit on ONE screen before any wider rollout.

## Guardrails

- UI patterns only — zero changes to auth, services, middleware, or API routes
- No new dependencies (we already have nuqs, TanStack Query/Table, RHF+Zod, Recharts);
  their Clerk/Zustand/Sentry wiring is explicitly NOT copied
- Design rules apply: flat, token-driven, no gradients/glassmorphism (AI-slop rules)
- One commit per phase on a feature branch; build verified after every batch

## Phase 0 — Acquire & survey (read-only, no project changes) — DONE

- [x] Clone repo to a sibling reference dir (`../_reference/next-shadcn-dashboard-starter`)
- [x] Inventory: ported the data-table system (`src/components/ui/table/*`,
      `use-data-table` hook, parsers, types). Other liftable patterns noted for later:
      feature-folder layout, kanban, profile/settings pages
- [x] Dependency delta: NONE — @tanstack/react-table 8.21.3 already installed

## Phase 1 — Proof of fit (one pattern, one screen) — DONE (commit on branch)

- [x] Branch `feature/dashboard-patterns` off main
- [x] Pilots table view rebuilt on the pattern: `components/ui/data-table/` (6 components),
      `lib/hooks/use-data-table.ts`, `lib/utils/data-table-parsers.ts`, `types/data-table.ts`.
      Table owns filtering in table mode; shared PilotFilterBar still drives cards/grouped
- [x] Adaptations vs reference: client-side processing (reference is server-driven);
      lucide icons; normal-flow container (no fixed-height ScrollArea shell);
      **`'use no memo'` on all table consumers** — React Compiler froze TanStack's
      render-phase mutations (toolbar inputs wouldn't update; root-caused via
      instrumented E2E). Any future TanStack Table consumer needs this directive.
- [x] Operations Navy tokens throughout; pilots page switched to canonical PageHeader;
      StatusBadge N/A (its map is workflow statuses, not active/inactive — kept Badge)
- [x] `npm run build` + `npm run validate` green (also repaired corrupted
      @testing-library/dom install that pre-broke type-check)
- [x] Visual pass light/dark (screenshots in test-results/pilots-table-\*.png)
- [x] e2e/pilots-table-pattern.spec.ts — 6/6 passing (search/faceted filters + URL sync,
      deep-link restore, column visibility, sorting). Pre-existing pilots.spec.ts
      List View failures confirmed identical on main (spec drift, not this change)

## Phase 2 — Checkpoint with Maurice — APPROVED ("continue", 2026-06-11)

- [x] Adopt wider; rollout proceeds on the same branch

## Phase 3 — Rollout

- [x] Batch 2 (commit 13ff802): live /dashboard/certifications page migrated to the
      pattern — search/sort/pagination/column-visibility URL-synced; the documented
      `?filter=` deep-link contract preserved (status Select stays as data pre-filter,
      now in the toolbar with an aria-label); export respects filters
- [x] Legacy `components/ui/data-table.tsx` RETIRED (+ stories + orphaned
      data-table-loading.tsx) — all tables now on `components/ui/data-table/`
- [x] E2E: pattern suite 9/9 green (pilots + certifications); certifications.spec
      List View + Status Color 8/8 (fixed naive status-filter test that broke when the
      Select gained an aria-label — open Radix Select aria-hides the page); the 2
      "Pilot Certification History" failures are pre-existing on main
- [x] validate + build green after each batch
- [ ] Full `npm test` on final tree (deferred — long run; CI is source of truth)
- [ ] CLAUDE.md note if pattern becomes canonical (suggest after requests table)

**Finding for Maurice:** `certifications-table.tsx`, `certifications-tabs.tsx`, and
`certifications-view-toggle.tsx` are UNMOUNTED (zero consumers) — the live page has its
own inline implementation. certifications-table was migrated anyway (so nothing references
the legacy ui/data-table), but the trio is dead code; CLAUDE.md documents `?tab=attention`
consolidation that the live page implements as `?filter=` instead. Decide: delete the dead
trio, or revive the tabs design. Remaining rollout candidate: requests browse table.

**Rollback:** reference clone lives outside the repo; all project changes on
`feature/dashboard-patterns` — abandon = delete branch, zero residue.

---

# Approvals Hub — Option 2 implementation plan

**Decision (2026-06-11):** Build the Approvals Hub from
`design-mockups/content-options/option-2-approvals-hub.html` — every admin decision
(leave, RDO/SDO, leave bids, pilot registrations) in ONE queue with a decision panel
showing crew-eligibility impact BEFORE approving. Addresses the #1 finding of
`tasks/content-ux-review-2026-06-11.md` (requests fragmented across 3 admin surfaces;
10 CPT + 10 FO rule invisible until it blocks).

_Navy migration record archived to `tasks/design-navy-migration-2026-06-11.md`
(all phases done; E2E suite result still pending in background)._

## Design decisions

- **New route `/dashboard/approvals`** — master-detail: left queue list, right decision
  panel. Tabs via nuqs: `?tab=leave | rdo-sdo | bids | registrations`. Pending items only.
- **`/dashboard/requests` SURVIVES as the browse/history surface** (table/cards/calendar,
  filters, exports). Approvals links to it via a "History" button. No redirect; nav demotes it.
- **Crew-impact preview reuses `leave-eligibility-service`** (`checkCrewAvailabilityAtomic`
  read-only / `calculateCrewAvailability`) — server-computed for the selected request.
  Same engine that enforces approval, so preview can never disagree with the gate.
- **Approve/deny reuse existing paths** (`unified-request-service` + existing server
  actions) — they already do the atomic crew check, cache invalidation (domain helpers),
  and notifications. The hub adds NO new mutation logic.
- **Keyboard review**: ↑/↓ select, A approve (confirm), D deny (comment dialog), N needs-info.
  Reuse `use-keyboard-shortcuts`.
- Leave Bids tab reuses the existing bid review actions + adds the deadline banner.
  Batch-approve-by-seniority is OUT of this phase (follow-up).
- Registrations tab reuses `pilot-registrations/actions.ts` + approval client logic.
- All UI on canonical components (Card, StatusBadge, Button) — Operations Navy tokens.

## Phase 1 — Hub scaffold — DONE (commit c3ab892)

- [x] page.tsx fetches pending leave/RDO-SDO (getAllPilotRequests status filter), bids
      (getLeaveBidsForAdmin → PENDING), registrations (getPendingRegistrations)
- [x] approvals-tabs.tsx (URL-driven, count chips) + approval-queue-list.tsx
- [x] loading.tsx + error.tsx
- [x] Build green

## Phase 2 — Decision panel for Leave + RDO/SDO — DONE (commit c3ab892)

- [x] decision-panel.tsx (fields + impact card folded in, server component)
- [x] Crew impact via calculateCrewAvailability (display engine; approve still runs the
      atomic gate) — worst-day before/after, green/amber/red verdict
- [x] approve/deny/needs-info server actions (wrap updateRequestStatus + domain
      invalidation); deny requires comment dialog; auto-advance to next item
- [x] Keyboard review in decision-actions.tsx (↑↓/A/D/N via use-keyboard-shortcuts)
- [x] Build green

## Phase 3 — Bids + Registrations tabs — DONE (commit c3ab892, reduced scope)

- [x] Bids + registrations tabs list pending items with link to their full review pages
      (decision panels for these two deferred to follow-up — see Out of scope)
- [x] Empty states for all four tabs
- [x] Build green

## Phase 4 — Navigation rewire — DONE (commit 7e788b4)

- [x] admin-nav.ts: Approvals primary (ListChecks icon); Leave Bids removed from primary;
      Requests demoted to More as the browse/history surface
- [x] Sidebar badge enrichment retargeted to the Approvals item (existing pendingRequests
      count; widening to include bids/registrations deferred with the badges API)
- [x] Dashboard quick action, todays-priorities link, pending-approvals widget → hub
- [x] Requests page header links to the hub for pending decisions
- [x] Build green

## Phase 5 — Verify & document

- [x] e2e/approvals.spec.ts (read-only: tabs, queue→panel, impact card, keyboard hint,
      history link, sidebar entry)
- [x] `npm run validate` green; builds green after every phase
- [ ] Full `npm test` suite on final tree (running — prior run invalidated: tree changed
      under the hot-reloading test server, so it was killed and restarted clean)
- [ ] Visual pass (light/dark) once test server frees port/lock
- [ ] CLAUDE.md routes table + memory update

---

# Options 1 + 5 (approved 2026-06-11, after hub)

## Option 1 — Morning Brief dashboard — DONE (commit ad8886a)

- [x] A1 crew-eligibility-banner.tsx (worst-day CPT/FO vs 10/10 over remaining RP, CTA to hub)
- [x] A2 todays-priorities.tsx → "Action required today" with NAMED certs (service already
      returned items; widget now renders them) + queue link
- [x] A3 Deadlines: reused DeadlineWidgetWrapper (maxPeriods=2) in the brief zone — no new
      component needed (bid-window deadline still deferred, no data source)
- [x] A4 fleet-insights KPIs → overdue / expiring ≤30d / awaiting decision / compliance;
      dashboard-content reordered; PendingApprovalsWidget retired (duplicated the hub)
- [x] Build green + committed

## Option 5 — Pilot-First portal

- [x] B1 Portal dashboard: RosterPeriodCard moved to top; NextCheckCard hero (soonest
      expiry across all attention tiers, RP it falls in); request-deadline band when the
      22-day review window is open (getFinalReviewAlert); RequestsSnapshot ("what changed")
- [x] B2 Portal certifications: urgent (expired/critical) pulled into a top section
      regardless of category; all groups sorted soonest-expiry first
- [ ] Build green + commit

## Final verification (both options)

- [ ] `npm run validate` + build + full `npm test` rerun (was stopped for Maurice's
      Chrome session) + visual pass light/dark

## Out of scope (follow-ups)

- Batch approve bids by seniority; review-session notes; full leave-bids page merge;
  /auth/login hydration mismatch (pre-existing, tracked)

**Rollback:** one commit per phase on a `feature/approvals-hub` branch off
`design/operations-navy`.
