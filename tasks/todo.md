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
