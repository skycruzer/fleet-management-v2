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

## Phase 1 — Hub scaffold (≤8 files)

- [ ] `app/dashboard/approvals/page.tsx` — server component: fetch pending leave,
      RDO/SDO, bids, registrations counts + lists (existing services)
- [ ] `components/approvals/approvals-tabs.tsx` — nuqs tab nav with count chips
- [ ] `components/approvals/approval-queue-list.tsx` — left list (selected state, status
      chip, age, impact hint)
- [ ] `app/dashboard/approvals/loading.tsx` + `error.tsx`
- [ ] Build green

## Phase 2 — Decision panel for Leave + RDO/SDO (≤8 files)

- [ ] `components/approvals/decision-panel.tsx` — detail fields, history line, actions row
- [ ] `components/approvals/crew-impact-card.tsx` — green/amber/red impact summary
      ("Approving drops RP6 Captains 11→10 — at minimum")
- [ ] Server: impact computation for selected request (server component data or a small
      `/api/approvals/impact` GET via createAdminRoute)
- [ ] Wire approve/deny/needs-info to existing server actions; optimistic queue advance
- [ ] `components/approvals/use-review-keyboard.ts` — ↑↓/A/D/N via use-keyboard-shortcuts
- [ ] Build green + manual flow check

## Phase 3 — Bids + Registrations tabs (≤8 files)

- [ ] Bids queue + panel: reuse leave-bid review actions; per-option statuses shown;
      deadline banner (bid window dates from settings/service)
- [ ] Registrations queue + panel: reuse registration approve/deny actions
- [ ] Empty states for all four tabs ("Queue clear — nothing awaiting decision")
- [ ] Build green

## Phase 4 — Navigation rewire (≤8 files)

- [ ] `lib/config/admin-nav.ts`: primary item **Approvals** (replaces Requests + Leave Bids
      positions); **Requests → History** demoted to More
- [ ] `use-sidebar-badges`: Approvals badge = pending leave + RDO/SDO + bids + registrations
- [ ] Dashboard quick-action "Approve Requests" → `/dashboard/approvals`;
      pending-approvals widget links there too
- [ ] Leave-bids + registrations pages get banner linking to the hub (pages stay functional)
- [ ] Build green

## Phase 5 — Verify & document

- [ ] New E2E spec `e2e/approvals.spec.ts`: tab counts, select → panel renders impact,
      approve advances queue, keyboard nav
- [ ] `npm run validate` + `npm run build` + targeted `npx playwright test e2e/approvals.spec.ts`
- [ ] Visual pass (light/dark)
- [ ] CLAUDE.md: routes table + redirects section updated; memory updated

## Out of scope (follow-ups)

- Batch approve bids by seniority; review-session notes; full leave-bids page merge;
  /auth/login hydration mismatch (pre-existing, tracked)

**Rollback:** one commit per phase on a `feature/approvals-hub` branch off
`design/operations-navy`.
