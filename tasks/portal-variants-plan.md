# Pilot Portal — 5 Variants Playground

**Goal:** Single self-contained HTML file with 5 distinct design systems applied to 4 hero screens.

**Deliverable:** `tasks/portal-variants.html` — opens in browser, top tab switches V1–V5, each shows all 4 hero screens stacked.

## Constraints (memory-enforced)

- No gradients, glassmorphism, aviation decor, multi-fonts, glow shadows, celebration animations
- Single font family per variant (V1 all-mono, V2-V5 all-sans with different weight/tracking treatments)
- Realistic pilot data (Captain Maurice Rondeau, RP5/2026, staff ID, seniority, cert expiry)

## Hero screens

- [x] Login (`app/portal/(public)/login/page.tsx`) — Staff ID + password + remember me + forgot
- [x] Dashboard (`app/portal/(protected)/dashboard/page.tsx`) — Roster card, cert compliance, expiry countdown, retirement, leave bids, quick actions, pending counts
- [x] Requests list (`app/portal/(protected)/requests/page.tsx`) — Tabs: Leave | RDO/SDO, list rows, new-request button
- [x] New leave request (`app/portal/(protected)/leave-requests/new/page.tsx`) — Leave type select, date range, reason textarea, late-request alert, sick-leave file upload

## Variants

- [ ] **V1 Ops Console** — dense, monospace everywhere, dark bg, compact rows, uppercase statuses
- [ ] **V2 Airline Calm** — generous whitespace, warm off-white, deep green accent, settings-app feel
- [ ] **V3 Mobile-First Cards** — phone-framed, stacked rounded cards, bottom nav, large targets
- [ ] **V4 Status Board** — FIDS-inspired, black bg, large colored tiles, uppercase labels
- [ ] **V5 Linear-style Pro** — compact rows, keyboard hints, subtle borders, command-palette hint

## Tasks

- [ ] Build HTML scaffold with variant tab switcher + shared page chrome
- [ ] V1 Ops Console — all 4 screens
- [ ] V2 Airline Calm — all 4 screens
- [ ] V3 Mobile-First Cards — all 4 screens
- [ ] V4 Status Board — all 4 screens
- [ ] V5 Linear-style Pro — all 4 screens
- [ ] Self-review against constraint list
- [ ] Screenshot each variant via preview tools, share with user
- [ ] Await pick → spec real-code migration as separate task

## Out of scope

- Real React components in the codebase
- Auth / API / data wiring
- The other 17 portal pages (they inherit the winning system later)
