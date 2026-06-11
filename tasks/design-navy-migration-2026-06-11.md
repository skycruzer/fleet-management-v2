# Design Migration — Option 5 "Operations Navy" (Atlassian-style)

**Decision (2026-06-11):** Adopt the Operations Navy direction from `design-mockups/option-5-ops-navy.html`.
Re-theme only — **zero content, layout, copy, or feature changes on any page.** All restyling flows
through `globals.css` tokens and the canonical components (StatusBadge, PageHeader, Button, Card, Table).

_Previous (completed) plan archived to `tasks/design-remediation-2026-06-10-complete.md`._

## Target design language (from approved mockup)

| Element       | Spec                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| Sidebar       | Navy `#0d2240`, active item `#1a3a63`, text `#b3bdcc` / white active, red count badges |
| Canvas        | `#f4f5f7` background, white cards, `#dfe1e6` borders                                   |
| Accent        | Blue `#0b5cad` (primary buttons, links, chips), soft tint `#e9f2fb`                    |
| Text          | `#172b4d` primary, `#5e6c84` dim                                                       |
| Radius        | Compact: 4px buttons/chips, 6px cards (replaces pill geometry)                         |
| KPI cards     | 3px color-coded top border (info blue / good green / warn amber / bad red)             |
| Status badges | Uppercase 11px bold, 3px radius, tinted bg (same traffic-light logic, new shades)      |
| Table headers | Uppercase 11.5px, `#f7f8f9` bg, letter-spacing 0.04em                                  |
| Status colors | green `#1f7a4d`, amber `#97570b`, red `#ae2a19` (+ bg tints) — WCAG AA on white        |

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

## Phase 1 — Token layer (`app/globals.css`) — DONE (commit ec8d14d)

- [x] Sidebar token group added (sidebar/foreground/muted/active/border/icon/badge — same navy both themes)
- [x] Canvas `#f4f5f7`, borders `#dfe1e6`, input `#c1c7d0`, ring `#0b5cad`
- [x] Primary black → blue `#0b5cad` with full 50–900 scale
- [x] Text `#172b4d` / dim `#5e6c84`; navy-tinted slate scale
- [x] Status scales: success `#1f7a4d`, warning `#97570b`, danger `#ae2a19` (token names unchanged)
- [x] Radius compacted (sm 3px / md 4px / lg 6px); pill reserved for avatars/spinners
- [x] Dark theme: navy-tinted darks (#0e1624 canvas, #16202e cards), blue `#579dff` primary
- [x] Build green

## Phase 2 — Layout chrome — DONE (commit 59c0aee)

- [x] Admin sidebar on sidebar tokens (navy, active #1a3a63, red count badges, rounded-md active)
- [x] Header/PageHeader: already correct via tokens (white bg + border)
- [x] Pilot portal sidebar + mobile sheet: navy treatment; bell gets className passthrough
- [x] Bottom nav active → primary blue
- [x] Build green

## Phase 3 — Canonical components — DONE (commit 37b58dc)

- [x] button.tsx: 4px radius, blue primary + darken hover, pill sizes retired
- [x] badge.tsx 3px radius; status-badge.tsx uppercase bold 11px signature
- [x] card.tsx: 6px radius, flat default (border only)
- [x] table.tsx: solid muted header strip, zebra stripes removed; responsive-table radius
- [x] rank-badge: inherits new geometry/tokens (no file change needed)
- [x] Build green

## Phase 4 — Dashboard KPI treatment — DONE (commit a50efe3)

- [x] stats-overview (requests) + pilot-stats-bar: 3px color-coded top border, uppercase labels, tabular-nums
- [x] analytics-charts: runtime reads chart tokens (swapped in Phase 1); stale fallbacks aligned
- [x] Build green

## Phase 5 — Sweep & verify

- [x] Sweep: hand-rolled pill chips → rounded-sm (tasks, audit, disciplinary); landing CTAs/chip squared + tokenized; bg-black/50 modal scrims kept (legit overlays)
- [x] WCAG AA: primary 5.9:1, status colors 5.3–6.7:1 on white; sidebar text 8.6:1, sidebar-muted bumped #6b7c95→#8696ad (3.7→5.2:1); dark primary 6.2:1
- [x] `npm run validate` green
- [x] Visual pass (public pages, light+dark × desktop+mobile → screenshots/navy-verify/); authenticated pages still blocked on missing VERIFY_EMAIL creds (pre-existing)
- [ ] Final `npm run build` + `npm test` (E2E)
- [ ] Update design memory + CLAUDE.md notes

## Follow-up found during verify (NOT this branch — behavior, not styling)

- Hydration mismatch on /auth/login: h1 `tabindex="-1"` differs server vs client (focus-management code; pre-existing, unrelated to re-theme)

---

**Rollback:** each phase is a separate commit; reverting the Phase 1 token commit restores the old look app-wide.
