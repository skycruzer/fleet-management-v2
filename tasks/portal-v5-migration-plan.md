# Pilot Portal V5 Migration Plan

**Decision:** V5 Linear-style density + information architecture, re-palleted to the existing Expo monochrome system (`#000` primary, no purple). We keep the tokens you already have and add only the composition patterns V5 introduces.

**Ship-fast principle:** Each phase is a small, reviewable, buildable PR. After each, we verify in the browser, merge, and move on. Any phase can roll back independently.

---

## What V5 actually requires (after existing-system audit)

| V5 pattern                                               | Status in codebase                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Monochrome palette                                       | ✅ already there (`globals.css` Expo system)                                        |
| Badge / pill with dot                                    | ✅ `components/ui/badge.tsx` has `dot`, `warning`, `success`, `info`, `destructive` |
| Breadcrumb                                               | ✅ `components/ui/breadcrumb.tsx` + `components/navigation/page-breadcrumbs.tsx`    |
| Command palette (`⌘K`)                                   | ✅ `components/ui/command.tsx` exists — not yet wired                               |
| **Page header** (breadcrumb + title + subtitle + action) | ❌ needs new primitive                                                              |
| **Dense list row** (id / name / meta / status / chev)    | ❌ needs new primitive                                                              |
| Filter chip bar                                          | 🟡 can be assembled from existing `Button` variants                                 |
| Keyboard hint (`<kbd>` inside buttons)                   | 🟡 small utility class, one-line addition                                           |

Net new code: **2 small primitives** (`PageHead`, `ListRow`) + **1 utility** (`Kbd`). Everything else is composition.

---

## Phase 1 — Primitives (tiny PR, zero page changes)

Deliverable: ~3 files added, 0 pages touched. Storybook stories colocated.

- [ ] `components/ui/page-head.tsx` — breadcrumb row + title + subtitle + action slot + optional tabs slot
- [ ] `components/ui/list-row.tsx` — `<ListRow id={...} name={...} sub={...} status={...} meta={...} href={...} />` composing existing Badge + Card styles
- [ ] `components/ui/kbd.tsx` — `<Kbd>⌘K</Kbd>` utility (mono font scoped to this atom only — defensible as functional, not decorative)
- [ ] Storybook stories for all three
- [ ] `npm run validate` + `npm run build` green

**Gate:** Maurice reviews primitives in Storybook before any page migration begins.

---

## Phase 2 — Dashboard (highest-visibility surface)

One file: `app/portal/(protected)/dashboard/page.tsx` (+ optionally the cards it composes).

- [ ] Replace custom page header with `<PageHead>`
- [ ] "At a glance" → 4-col `kgrid` of existing `Card` components with dot-prefixed labels
- [ ] Expiring certs section → `<ListRow>` list using existing expiry data
- [ ] Active requests section → `<ListRow>` list
- [ ] Remove duplicate cert alert sections (Phase 1 critical finding from April review — [memory](../../.claude/projects/-Users-skycruzer-Desktop-Current-Development-Projects-fleet-management-v2/memory/project_portal_ux_review.md))
- [ ] Quick-actions kept as 2-col large cards (V5 still values discoverable CTAs)
- [ ] `npm run build` green, manual smoke in preview

**Gate:** Screenshot comparison before/after, Maurice approves.

---

## Phase 3 — Requests flow (most-used path)

Two files: `app/portal/(protected)/requests/page.tsx`, `app/portal/(protected)/leave-requests/new/page.tsx`.

- [ ] Requests page: migrate tab state from `useState` → `nuqs` (April review recommended this)
- [ ] `<PageHead>` with tabs + filter-chip strip
- [ ] Table → `<ListRow>` grid (ref / name-sub / status / dates / chev)
- [ ] New-leave page: `<PageHead>` with breadcrumb + `<Alert>` components using existing `inline-alert.tsx`
- [ ] Submit button: `<Button>Submit request <Kbd>⌘↵</Kbd></Button>`
- [ ] Consolidate duplicate form component (April review critical finding)
- [ ] Verify CSRF still wired, cache invalidation still fires

**Gate:** End-to-end manual test: submit a leave request, see it appear in list, verify admin notification path untouched.

---

## Phase 4 — Public surfaces (Login + cert/notification pages)

Four files: `login/page.tsx`, `certifications/page.tsx`, `notifications/page.tsx`, + 1 light cleanup.

- [ ] Login: strip `motion` shake / entrance (nice-to-have, not core), keep `ThemeToggle`, use V5 compact form layout
- [ ] Certifications: already the "gold standard" per April review — light touch only, add `<PageHead>` + swap table to `<ListRow>` if density improves, else skip
- [ ] Notifications: `<PageHead>` + `<ListRow>`

---

## Phase 5 — Remaining 14 pages (batched)

Three PRs, roughly one per batch:

- **Batch A** — profile, settings, about (pure layout)
- **Batch B** — feedback list/new/history, leave-bids
- **Batch C** — flight-requests (list/new/edit), leave-requests list, auth (register/forgot/reset/change-password)

Each batch: run validate + build, spot-check in preview, ship.

---

## Out of scope

- Admin portal (`/dashboard/*`) — completely separate system, untouched
- API / service layer changes
- Data model changes
- Storybook visual regression tests (nice-to-have, not blocking)

---

## Rollback plan

Every phase is its own PR. If a phase regresses pilot UX, revert that PR — earlier phases stay. Primitives (Phase 1) are purely additive and safe to keep even if we abandon the migration.

---

## Open questions for Maurice before Phase 1

1. **Keep V5 `Kbd` mono-font atom?** Functional convention, matches your `<kbd>` browser default, but technically two fonts. Your call.
2. **Wire `⌘K` command palette now or defer?** `components/ui/command.tsx` exists; wiring it into the portal layout is ~15 min but adds scope.
3. **April UX review crossover** — OK to fold those findings (duplicate forms, nuqs tab state, duplicate cert alerts) into the relevant phases? They overlap the same files so merging them saves churn.

If all three are "yes, proceed default" I'll start Phase 1.
