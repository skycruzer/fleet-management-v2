# Design Migration — Option 5 "Operations Navy" (Atlassian-style)

**Decision (2026-06-11):** Adopt the Operations Navy direction from `design-mockups/option-5-ops-navy.html`.
Re-theme only — **zero content, layout, copy, or feature changes on any page.** All restyling flows
through `globals.css` tokens and the canonical components (StatusBadge, PageHeader, Button, Card, Table).

_Previous (completed) plan archived to `tasks/design-remediation-2026-06-10-complete.md`._

## Target design language (from approved mockup)

| Element       | Spec                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| Sidebar       | Navy `#0d2240`, active item `#1a3a63`, text `#b3bdcc` / white active, red count badges  |
| Canvas        | `#f4f5f7` background, white cards, `#dfe1e6` borders                                    |
| Accent        | Blue `#0b5cad` (primary buttons, links, chips), soft tint `#e9f2fb`                     |
| Text          | `#172b4d` primary, `#5e6c84` dim                                                        |
| Radius        | Compact: 4px buttons/chips, 6px cards (replaces pill geometry)                          |
| KPI cards     | 3px color-coded top border (info blue / good green / warn amber / bad red)              |
| Status badges | Uppercase 11px bold, 3px radius, tinted bg (same traffic-light logic, new shades)       |
| Table headers | Uppercase 11.5px, `#f7f8f9` bg, letter-spacing 0.04em                                   |
| Status colors | green `#1f7a4d`, amber `#97570b`, red `#ae2a19` (+ bg tints) — WCAG AA on white         |

Constraints: no gradients, no glassmorphism, no glow shadows, no aviation decor, single font (Inter stays).

## Out of scope (explicitly unchanged)

- Page content, copy, information architecture, routes, features
- PDF reports (`pdf-service`) — stay print-friendly black-on-white
- Email templates (Resend) — untouched
- Business logic, services, API routes

## Decisions (Maurice, 2026-06-11)

- [x] Pilot portal: navy sidebar EVERYWHERE (admin + portal)
- [x] Dark mode: KEEP dual theme — same navy sidebar, darker canvas in dark mode

---

## Phase 0 — Baseline (no visual change)

- [x] Baseline reference set: existing screenshots/design-verify/ (light+dark × desktop+mobile, public pages) — unchanged since remediation pass; authenticated pages blocked on missing VERIFY_EMAIL creds (same as before)
- [x] `npm run build` green before starting (exit 0, 2026-06-11, branch design/operations-navy)

## Phase 1 — Token layer (`app/globals.css`)

Single file; this does ~70% of the migration.

- [ ] Add sidebar token group: `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-active`, `--color-sidebar-muted`, `--color-sidebar-badge`
- [ ] Canvas/surfaces: `--color-background` `#f0f0f3` → `#f4f5f7`; borders → `#dfe1e6`
- [ ] Primary: black → blue system (`--color-primary` `#0b5cad`, rebuild 50–900 scale; foreground white)
- [ ] Text: `--color-foreground` → `#172b4d`; muted/dim → `#5e6c84`
- [ ] Status scales: success → `#1f7a4d`/`#e8f5ee`, warning → `#97570b`/`#fdf3e1`, danger → `#ae2a19`/`#fdeeec` (keep existing token names so StatusBadge and all consumers pick them up automatically)
- [ ] Radius: `--radius-md` → 0.25rem, `--radius-lg` → 0.375rem; stop using `--radius-pill` on buttons/badges (keep token for avatars)
- [ ] Dark theme block: mirror all of the above (pending open decision)
- [ ] Build + visual check

## Phase 2 — Layout chrome (batch ≤ 8 files)

- [ ] `professional-sidebar-client.tsx`: switch to sidebar tokens (navy bg, active state, red count badges, uppercase section labels)
- [ ] `professional-header.tsx`: white bg, bottom border, RP chip style (blue tint, 4px radius)
- [ ] `page-header.tsx`: align title size/weight to mockup
- [ ] `pilot-portal-sidebar.tsx` + `pilot-bottom-nav.tsx`: same treatment (pending open decision)
- [ ] Build + visual check

## Phase 3 — Canonical components (batch ≤ 8 files)

- [ ] `components/ui/button.tsx`: 4px radius, primary = accent blue, secondary = white + border
- [ ] `components/ui/badge.tsx` + `status-badge.tsx`: uppercase bold 11px, 3px radius, tinted backgrounds
- [ ] `components/ui/card.tsx`: 6px radius, flat (border only, no shadow)
- [ ] `components/ui/table.tsx` / `data-table.tsx`: uppercase header row with muted bg, row hover tint
- [ ] `rank-badge.tsx`: align to new badge geometry
- [ ] Build + Storybook spot-check

## Phase 4 — Dashboard KPI treatment (batch ≤ 8 files)

- [ ] Stat/metric cards (`components/dashboard/`): 3px color-coded top border, uppercase labels, tabular-nums values
- [ ] Chart accents (analytics): accent series → `#0b5cad`; status hues from tokens
- [ ] Build + visual check

## Phase 5 — Sweep & verify

- [ ] Grep for hardcoded remnants: `#000` primary usage, `bg-black`, `rounded-full` on buttons/badges (avatars exempt)
- [ ] Visual pass over every dashboard + portal page against Phase 0 reference set
- [ ] WCAG AA contrast check: new status colors, navy sidebar text
- [ ] `npm run validate` + `npm run build` + `npm test` (E2E)
- [ ] Update design memory + CLAUDE.md notes if needed

---

**Rollback:** each phase is a separate commit; reverting the Phase 1 token commit restores the old look app-wide.
