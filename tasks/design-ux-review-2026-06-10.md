# Design / UX / UI Review — All Web App Pages

**Date**: 2026-06-10
**Method**: Code-level review (no dev server running — no screenshot pass). Five parallel reviewers:
admin core pages, admin secondary pages, pilot portal, auth/public pages, and the shared design
foundation. All 83 pages + shared chrome covered.

---

## Verdict

The design **foundation is genuinely strong** — documented Expo-inspired monochromatic token system
(1,159-line `globals.css` with light+dark coverage, z-index/spacing/radius/motion tokens, exemplary
reduced-motion kill-switch), Inter + JetBrains Mono only, and the AI-slop hard rules hold in live
code (no gradients, glassmorphism, glow shadows, celebration animations, or aviation decor — the
only violations are in dead files).

The **execution drifts hard at the edges**: dark mode is broken at the primitive level, status
rendering is reinvented in 100+ places, five competing page-header patterns, a legacy parallel
pilot portal still reachable, and a test-credentials page live in production. The review also
surfaced ~13 functional bugs (404s, dead filters, broken Next 16 async params) that masquerade as
design issues.

---

## P0 — Broken or dangerous (fix before any polish)

| #   | Issue                                                                                                                                                                                                                                | Evidence                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1   | **SECURITY: `/login` renders real admin credentials** ("Test Credentials: mrondeau@airniugini.com.pg / test123") on a live, unauthenticated route (proxy.ts falls through to allow). Third parallel admin login; delete or redirect. | `app/login/page.tsx:107-116`                                                                             |
| 2   | **Admin "Forgot password?" 404s** — links to `/auth/forgot-password`, which does not exist. Primary recovery path on the canonical admin login is dead.                                                                              | `app/auth/login/login-form.tsx:90-95`                                                                    |
| 3   | **Creating an admin user lands on a 404** — success redirect and Cancel both target `/dashboard/admin/users`, a route that doesn't exist.                                                                                            | `app/dashboard/admin/users/new/page.tsx:57,188`                                                          |
| 4   | **`/dashboard/audit` filters/pagination/sort silently broken** — `searchParams` consumed synchronously (Next 16 makes it a Promise); every param resolves `undefined`.                                                               | `app/dashboard/audit/page.tsx:23-49`                                                                     |
| 5   | **Every `/dashboard/audit/[id]` URL 404s** — same sync-`params` bug; `uuidRegex.test(undefined)` → `notFound()`.                                                                                                                     | `app/dashboard/audit/[id]/page.tsx:18-34`                                                                |
| 6   | **All "expiring certifications" deep links broken** — certifications page never reads query params; `?tab=attention` (next.config redirect) and `?filter=expiring` (dashboard widgets) land on an unfiltered ~600-row list.          | `app/dashboard/certifications/page.tsx:139`; `fleet-insights-widget.tsx:120`; `todays-priorities.tsx:42` |
| 7   | **Analytics "Fleet Readiness" number invisible in light mode** — `text-primary-foreground` (white) on white card.                                                                                                                    | `app/dashboard/analytics/page.tsx:258`                                                                   |
| 8   | **Portal leave-bid form has no CSRF header** (prior UX review critical #3, still unresolved) — POST/PUT sends only Content-Type; cancel path does send `csrfHeaders()`. Either submits fail 403 or route is unprotected.             | `components/portal/leave-bid-form.tsx:179-188`                                                           |
| 9   | **Portal leave-cancel: missing CSRF/credentials + stale list** — DELETE without headers, errors via native `alert()`, and `router.refresh()` can't update client-state list, so a cancelled request stays visible as SUBMITTED.      | `components/pilot/leave-requests-list.tsx:43-57`                                                         |
| 10  | **Portal requests page swallows fetch errors** — `catch { /* silently */ }`; a pilot on flaky data sees "No leave requests found" instead of an error+retry.                                                                         | `app/portal/(protected)/requests/page.tsx:50-51,64-65`                                                   |
| 11  | **`global-error.tsx` renders completely unstyled** — replaces root layout without importing any CSS; the worst failure state is Times New Roman.                                                                                     | `app/global-error.tsx:28-29`                                                                             |
| 12  | **Renewal calendar silently omits RP01** — copy-pasted loader uses date-range filtering that the sibling page's own comment says misses RP01; the main page deliberately uses `.like('%/year')`.                                     | `app/dashboard/renewal-planning/calendar/page.tsx:30-31` vs `renewal-planning/page.tsx:26-33`            |
| 13  | **Task edit form can't assign users** — `TaskForm` rendered without `users` prop (defaults `[]`); assignee select is empty on edit. New-task page also runs two dead queries (pilots/categories never consumed).                     | `app/dashboard/tasks/[id]/edit/page.tsx:45`; `task-form.tsx:39`                                          |
| 14  | **Support page links to nonexistent routes** — `/dashboard/docs` and `/dashboard/tutorials` 404 from a help surface; FAQ anchors die through the `/faqs→/help` redirect.                                                             | `app/dashboard/support/page.tsx:23,28,34,117`                                                            |
| 15  | **"Clean" requests stat card lies** — applies the same filter as "Pending" (no late/past-deadline exclusion).                                                                                                                        | `components/requests/stats-overview.tsx:114-119`                                                         |
| 16  | **Pilot-registrations false all-clear** — server component fetches own API over HTTP and swallows all failures to `[]` → auth/network errors render as "All caught up! ✅".                                                          | `app/dashboard/admin/pilot-registrations/page.tsx:33-48`                                                 |

---

## P1 — Systemic design issues (highest leverage)

### 1. Dark mode is broken at the primitive level

- `components/ui/badge.tsx:11-19` — every variant hardcodes light hexes (`bg-[#f0f0f3]`,
  `bg-[#fff0f0]`…), **zero** `dark:` overrides, imported by **100 files**. Every badge is a light
  chip on dark cards.
- `components/ui/input.tsx:10-15` — `bg-white text-[#1c2024]`, zero `dark:`. Every form field is a
  white box in dark mode. (Sibling `select.tsx` does it right via tokens.)
- Sonner `<Toaster>` not wired to next-themes — light toasts in dark mode (`app/layout.tsx:120`).
- Global `a { color: #0d74ce }` raw hex — ~3.9:1 on dark background, below AA (`globals.css:569`).
- `button.tsx:14-27` carries a parallel shadow palette (`#3a3f47`, `#2b2f36`, `#edeef0`) not in the
  token file; Button h-9 vs Input h-10 misalign inline forms.

### 2. Status rendering is fragmented (the #1 product-consistency issue)

- Canonical `components/ui/status-badge.tsx` has **zero imports**; 116 files inline
  `var(--color-status-*)` markup; 241 files inline arbitrary `var(--color-*)` values.
- Vocabulary drift: live tables use DRAFT/SUBMITTED/IN_REVIEW/DENIED/WITHDRAWN; the dead canonical
  component speaks PENDING/REJECTED. Pilots see "Not Approved" on the dashboard and raw "REJECTED"
  on the bids page for the same bid; raw enums (SUBMITTED, IN_REVIEW, ADMIN_PORTAL) leak to UI on
  requests detail and RDO tables; APPROVED renders as neutral gray in the RDO table.
- **Blocker before adoption**: `status-badge.tsx:77-81` builds classes by template interpolation —
  JIT-unsafe; classes only compile because other files contain the literals. Rewrite as static map.
- Cert red/yellow/green logic IS centralized (`lib/utils/certification-status.ts`) but the
  color→class mapping is re-implemented in 6 files; portal cert thresholds (14/60 days) contradict
  the documented FAA rule (≤30) and the dashboard mixes 14/30/60-day windows on one screen.

### 3. Light-mode contrast failures from `-400` tokens (~28 files)

`text-[var(--color-warning-400)]` (#fbbf24) etc. on `*-muted` (≈white) backgrounds — ~1.6–2.5:1 vs
AA 4.5:1. The correct tokens exist (`--color-*-muted-foreground`, `--color-status-*`). Mechanical
sweep: admin leave-bids stats, legacy /pilot pages, portal settings alerts, notifications page.

### 4. No shared PageHeader — five competing patterns

`h1 text-xl font-semibold` + Breadcrumb (the de-facto standard: admin, help, feedback) vs
`h1 text-3xl font-bold` vs `h2 text-2xl font-bold` (all create/edit forms — no h1 at all) vs
`← Back` text arrows vs `ArrowLeft` icons vs nothing. Extract one `PageHeader` component
(title, description, breadcrumb, actions slot) and sweep.

### 5. Legacy/dead surfaces confuse real users (~2,000+ lines)

- **`/pilot/*` tree**: a complete parallel pilot portal (Supabase-Auth based, vs live Redis
  sessions), publicly reachable, register page actively recruits into it, bell links to a 404.
  Redirect all 5 routes to `/portal/*` equivalents; delete after verifyPilotSession unification.
- Redirected-but-present pages: `faqs` (315 lines), `leave` + client (416), `leave/approve` (340 —
  but its `actions.ts` is imported by live code, relocate first), `leave/calendar/page.tsx`
  (sibling client IS live), `certifications/expiring` (181).
- Redirect gaps: `/dashboard/leave/new` and `/dashboard/leave/[id]` are still live and linked
  (`quick-entry-button.tsx:70`, `leave-request-group.tsx:243`).
- `/dashboard/planning` orphaned (no nav links in) and duplicates analytics (507-line near-copy)
  - renewal planning; `/dashboard/audit` vs `/dashboard/audit-logs` are two full audit viewers
    (sidebar links only the weaker one; the richer one is nav-orphaned with broken filters).
- Dead components: `premium-pilot-card.tsx`, `certifications-page-client.tsx`,
  `empty-state-illustrated.tsx` (aviation SVGs + 82 gradient refs — violates 3 owner rules),
  `auth/login/simple.tsx` + `page.tsx.complex`, `ui/toaster.tsx`, portal widgets
  (`recent-activity-widget`, `team-status-widget`, `getting-started-card`).
- **Product has six names** across surfaces ("Fleet Management", "…V2", "…System", "Air Niugini
  B767 Fleet Management System", "B767 Pilot Portal", "…V2 - B767 Pilot Management System") and
  three version strings (v0.1.0 / v2.0.0 / v2.5.0).

### 6. Pilot portal mobile ergonomics (its audience is on phones)

- No bottom nav; hamburger-drawer-only for 7 destinations; drawer is hand-rolled (no focus trap,
  no Escape, no `aria-modal`) while admin uses Radix Sheet (`pilot-portal-sidebar.tsx:183-209`).
- Touch targets below 44px across primary chrome: nav rows `min-h-[36px]`, hamburger 40px,
  notification bell 36px, tab buttons `px-1 pb-3`.
- RDO/SDO table: 7 columns, Cancel action off-screen on mobile, while the adjacent leave tab uses
  stacked cards — same page, two paradigms. Leave-bids table similar (5 col).
- Sidebar identity inverted: bold "Pilot" (rank never passed by layout), name demoted
  (`pilot-portal-sidebar.tsx:240-241`; `layout.tsx:62`).
- Notifications page: not in nav (bell-only entry), broken badge classes
  (`bg-[var(--color-info-bg)]0`), unreadable solid chips, delete without confirm,
  `window.location.href` navigation.

---

## P2 — Consistency cleanups (recurring patterns)

1. **Loading states: 4+ dialects.** Matched skeletons (best: dashboard, published-rosters) vs
   `Loader2` spinner cards vs hand-rolled border spinner (feedback) vs text "Loading…"
   (notifications); several route `loading.tsx` files model layouts their page doesn't render
   (pilots, certifications, portal dashboard double-skeleton swap).
2. **URL state**: nuqs is the stated standard, used by requests; pilots view/filters, reports tab,
   certifications filters, portal requests tab all in `useState` — back button/deep links lose state.
3. **Three pagination implementations** (audit-logs prev/next, disciplinary all-page-numbers —
   breaks at 20+ pages, portal-users pager) and **two table systems** (shadcn Table vs raw
   `<table>` in audit/audit-logs/disciplinary/admin-settings).
4. **Malformed token classes** generating no CSS: `text-[var(--color-info)]-foreground` in
   audit-logs:75, disciplinary:107, disciplinary/[id]:91, admin settings-client:380 (hover);
   `bg-[var(--color-info-bg)]0` portal notifications:146; `bg-[var(--color-info-bg)]0/10`
   profile:526.
5. **Form a11y is three-tiered**: `certifications/new` has full `aria-invalid`/`aria-describedby`
   wiring (the template); pilot forms and quick-entry have none. Copy drift on the same field
   ("exactly 6 digits" vs "4-6 digits"). Validation summary on create but not edit.
6. **Destructive-action confirmation gaps**: bulk Approve/Deny All (requests), registration Deny,
   renewal-planning `clearExisting` (destroys plans, 874-line page, zero confirms), portal
   notification delete — while single deletes correctly use `useConfirm`/AlertDialog.
7. **Unsaved-changes protection**: `use-unsaved-changes` exists and is used by admin forms; zero
   adoption in the portal (leave/flight/feedback forms lose typed input + attachments silently).
8. **Stats-cards-first anti-pattern**: audit, audit-logs, tasks, disciplinary, leave-bids,
   check-types, admin-settings open with 3–5 stat cards (several fake — "Active Types" =
   total count, hardcoded ACTIVE badges, "Security Level: High") pushing the working surface below
   the fold. Several violate "cards only when they're the interaction unit."
9. **Icon system fraying**: emoji-as-icon (⚙️✅🔒⚓📋🏖️🔧⏳ in admin settings, users/new,
   registrations), ~12 hand-rolled inline SVGs duplicating lucide (audit, leave-bids, tasks,
   disciplinary), literal "←"/"→" text arrows.
10. **Date formatting splits 3 ways**: `date-utils.formatDate` vs `date-fns format` vs hardcoded
    `toLocaleDateString('en-AU')`.
11. **`<Link><Button/></Link>` nested interactive elements** app-wide — should be `Button asChild`.
12. **Copy/placeholder leakage**: `support@example.com` (offline), `privacy@fleetmanagement.com`,
    two different support emails in portal, stale tech-stack list on /docs (says Next 15), "PDF"
    exports that download `.txt`/`.html` files (analytics, leave-bids), marketing fluff on an
    internal tool ("600+ Certifications", "Why Choose Our Platform?", "24/7 support",
    "Database Status: Connected" hardcoded).
13. **Service-layer violations in pages** (direct supabase): admin/leave-bids ×3, tasks/new,
    disciplinary ×3, settings-client (browser-side!), portal layout, renewal-planning
    (service-role client in page).
14. **Navigation chrome**: admin mobile nav is a separate hardcoded 14-item array missing Leave
    Bids + Published Rosters (`app/dashboard/layout.tsx:81-152`); invisible white-on-#f5f5f5 Plane
    icon (`mobile-nav.tsx:38-40`); duplicate skip-link systems; active sidebar item mixes
    `rounded-lg`+`rounded-full` and two accent colors; `--z-toast-viewport`/`--z-select` collide
    at 100; portal layout mounts a second QueryProvider.

---

## What's working well (keep and replicate)

- **Dashboard home**: per-widget ErrorBoundary + `DataDegradedBanner` ("silent zeros on a
  compliance dashboard are unsafe"), two-tier card tones, EmptyState — the pattern library the
  rest of the app should use.
- **Requests page**: URL-driven tabs/filters via nuqs, clickable stat-card filters with ring
  active state, Suspense-per-section skeletons.
- **Published-rosters**: model page — shimmer skeleton, distinct loading/empty states, useConfirm,
  CSRF, escape-to-exit fullscreen.
- **Portal-users table**: reference table — debounced search, server-side sort/filter/pagination.
- **`/auth/login`**: best auth UX (aria-live errors, eye toggle with label, autocomplete, generic
  failure copy, cross-portal link) — template for the rest.
- **certifications/new**: only form with complete aria error wiring — the form template.
- **Token discipline in pages** is strong overall; focus-visible/WCAG 2.2 outline rules and the
  reduced-motion kill-switch in globals.css are exemplary.

---

## Detailed per-page verdicts

### Admin core

| Page                                      | Verdict                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| /dashboard (home)                         | good                                                                                    |
| /dashboard/analytics                      | **poor** (invisible metric, fake PDF, duplicated page, double header)                   |
| /dashboard/pilots                         | good (URL state + tab semantics gaps)                                                   |
| /dashboard/pilots/[id]                    | needs-work (spinner not skeleton, generic error copy)                                   |
| /dashboard/pilots/[id]/edit, /new         | needs-work (h2-no-h1, no aria error wiring, copy drift)                                 |
| /dashboard/certifications                 | needs-work (**dead deep-link params**, mismatched skeletons, client-side 600-row fetch) |
| /dashboard/certifications/new, /[id]/edit | needs-work                                                                              |
| /dashboard/requests                       | good (Clean-card filter bug, unconfirmed bulk actions, RDO/SDO vs Flight naming)        |
| /dashboard/requests/[id]                  | needs-work (raw enums, UUID-as-subtitle, Priority Score: 0)                             |
| /dashboard/requests/quick-entry           | needs-work (43-line instructions card above the fold, zero aria on the most-used form)  |
| /dashboard/planning                       | **poor** (orphaned, duplicates 2 nav destinations, tabs without semantics)              |
| /dashboard/reports                        | good (tab not in URL, repetitive card copy)                                             |

### Admin secondary

| Page                                    | Verdict                                                                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /dashboard/admin                        | good (best-in-repo)                                                                                                                                                  |
| /dashboard/admin/settings               | **poor** (dead "Add Setting" button, emoji icons, data rendered 3×, silent success)                                                                                  |
| /dashboard/admin/check-types            | needs-work (fake ACTIVE column, no search/sort on ~50 rows)                                                                                                          |
| /dashboard/admin/leave-bids             | needs-work (contrast fails, inline SVGs, service-layer bypass ×3)                                                                                                    |
| /dashboard/admin/leave-bids/[id], /edit | good                                                                                                                                                                 |
| /dashboard/admin/pilot-registrations    | needs-work (false all-clear, unconfirmed Deny)                                                                                                                       |
| /dashboard/admin/portal-users           | good (reference table; aria-sort missing)                                                                                                                            |
| /dashboard/admin/users/new              | needs-work (**404 redirect**, emoji spinner, native select)                                                                                                          |
| /dashboard/audit                        | **poor** (sync searchParams — all filters broken; nav-orphaned)                                                                                                      |
| /dashboard/audit/[id]                   | needs-work (**sync params — always 404s**)                                                                                                                           |
| /dashboard/audit-logs                   | needs-work (rows not clickable to detail, raw table, misleading stat)                                                                                                |
| /dashboard/tasks                        | needs-work; /[id] good; /[id]/edit needs-work (**empty assignee select**); /new good                                                                                 |
| /dashboard/disciplinary                 | needs-work (page-number pagination, double-rendered fields on [id])                                                                                                  |
| /dashboard/notifications                | needs-work (no per-item read, no pagination, opacity stacking)                                                                                                       |
| /dashboard/settings                     | needs-work (3 fake stat cards, browser-side an_users query, version conflicts)                                                                                       |
| /dashboard/support                      | **poor** (404 links, fake status copy)                                                                                                                               |
| /dashboard/help                         | good (canonical header pattern)                                                                                                                                      |
| /dashboard/faqs                         | dead code (315 lines, redirected)                                                                                                                                    |
| /dashboard/feedback                     | good                                                                                                                                                                 |
| /dashboard/published-rosters            | good (fullscreen overlay needs role=dialog/focus trap)                                                                                                               |
| /dashboard/renewal-planning             | good; /calendar needs-work (**RP01 bug**); /generate needs-work (**unconfirmed destructive clear**, 874-line client); /roster-period needs-work (mixed scale labels) |
| /dashboard/leave/\*                     | dead code except `/new` and `/[id]` which are **still live + linked** (redirect gap)                                                                                 |

### Pilot portal

| Page                               | Verdict                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Layout + sidebar                   | needs-work (36px targets, no bottom nav, hand-rolled drawer, inverted identity, SSR slide-in flash)                                    |
| /portal/dashboard                  | needs-work (3 conflicting expiry windows, dark-mode invisible roster header, 2 mismatched skeletons, loudest element ≠ most important) |
| /portal/certifications             | good (hardcoded hex rings, 14/60 threshold drift, list rows don't reflow)                                                              |
| /portal/requests                   | needs-work (**silent errors, stale cancel, missing CSRF**, raw enums, gray APPROVED, 7-col mobile table)                               |
| /portal/leave-requests/new         | needs-work (no unsaved-changes, no date min/ordering constraints, 1.8s artificial wait)                                                |
| /portal/flight-requests/new, /edit | needs-work (Description vs Reason confusion, fetch-all-to-edit-one, redirect chains)                                                   |
| /portal/leave-bids                 | needs-work (**no CSRF on submit**, PENDING vs "Pending Review" drift, "PDF" exports HTML, "Selected" badge guesses priority 1)         |
| /portal/feedback, /new             | needs-work (off-system px-8 padding, 4th loading dialect, no RHF/Zod, unconfirmed Clear Form)                                          |
| /portal/notifications              | **poor** (broken classes, unreadable chips, not in nav, full-reload nav, unconfirmed delete)                                           |
| /portal/profile                    | good (broken icon-tile class, passport in plain text, decorative semantic colors)                                                      |
| /portal/settings                   | needs-work (raw inputs, unlabeled eye toggles, -400 contrast)                                                                          |
| /portal/about                      | good (orphan — nothing links to it)                                                                                                    |

### Auth & public

| Page                    | Verdict                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| / (landing)             | good (fake stats, hand-rolled hex CTAs, brochure copy)                                                                                       |
| /login                  | **poor — delete** (test credentials, ✈️ emoji, third login)                                                                                  |
| /auth/login             | needs-work (forgot-password 404; otherwise the template)                                                                                     |
| /portal/login           | needs-work (**ignores ?error/?message/?redirect** from proxy — silent bounces, dropped deep links; double-toggling checkbox)                 |
| /portal/register        | good (3s forced redirect, label→Select association)                                                                                          |
| /portal/forgot-password | good                                                                                                                                         |
| /portal/reset-password  | needs-work (spring scale-0 success pop = celebration-adjacent + ignores reduced-motion; unlabeled eye toggles; louder styling than siblings) |
| /portal/change-password | good (unlabeled toggles, raw inputs, weak client rule)                                                                                       |
| /pilot/\* (5 pages)     | **poor — legacy tree, redirect + delete** (404 bell link, 1.6:1 contrast text, recruits registrations)                                       |
| /docs                   | needs-work (six dead-end cards, stale/wrong tech stack listing)                                                                              |
| /privacy                | good (placeholder email)                                                                                                                     |
| /terms                  | good                                                                                                                                         |
| /offline                | needs-work (support@example.com, admin-only destination for a pilot audience, Serwist credit, shadow-2xl)                                    |
| error.tsx               | good; **global-error.tsx needs-work (unstyled)**; not-found needs-work (no portal-aware way back)                                            |

---

## Hardcoded-color audit summary

- Hex colors: **12 files** (worst: `empty-state-illustrated.tsx` 57 — dead;
  `analytics-charts.tsx` 16 — stale terracotta SSR fallbacks; `roster-grid.tsx` 11;
  `activity-code-legend.tsx` 11; `auth/login/simple.tsx` 11 — dead; then badge 8 / button 6 /
  input 4 / landing 8).
- Off-palette Tailwind: 8 files (published-rosters hue maps — defensible activity coding but
  off-token) + 6 files/40 occurrences of raw red/amber/green status classes.
- Banned patterns in live code: gradients 1 (functional shimmer mask), glassmorphism 0,
  celebration 0 (except reset-password spring pop), extra fonts 0, glow shadows 0.

---

## Reviewer agent IDs (for follow-up via SendMessage)

- Admin core: a8a9270b572b22e63
- Admin secondary: aa844d4abfaabb7f8
- Pilot portal: a91f0d72b434a7659
- Auth/public: a36acd62ffa9d7629
- Foundation: a7e430930e7619f69
