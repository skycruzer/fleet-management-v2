# Expo Design System Migration

## Overview

Replace the current MiniMax blue/white design with the Expo monochromatic, gallery-paced aesthetic. Remove AI slop patterns throughout.

## AI Slop to Remove

- Gratuitous gradients (`gradient-aviation`, `gradient-horizon`, `gradient-sky`, animated text gradients)
- Aviation-themed decorative elements (`.altitude-accent`, `.horizon-line`, `.runway-pattern`, `.bg-sky-gradient`, `.fly-across` plane animation)
- Purple glow shadows (remnant from old indigo scheme)
- Glassmorphism effects (`.glass`, `.glass-strong`)
- Excessive animations (confetti, fly-across, pulse-ring, gentle-rotate, gradient-shift)
- Over-designed loading states (confetti, success-bounce, ripple)
- Over-complex shadow system (glow-accent, shadow-primary with brand color tint)
- DM Sans + Outfit dual-font system (replace with Inter only)
- Decorative color for the sake of color (badge rainbow palette in non-semantic contexts)

## AI Slop to Remember (avoid in new code)

- No decorative gradients — visual richness from content, not decoration
- No brand-tinted shadows (purple/blue glow effects)
- No aviation theme ornamentation
- No glassmorphism
- No multi-font systems — Inter handles everything
- No animated gradient text
- No confetti/celebration animations
- Shadows are whisper-soft, not architectural statements

---

## Phase 1: Foundation (CSS Variables + Fonts)

Biggest lever — cascades changes to every component automatically.

- [ ] 1.1 Update `app/globals.css` color tokens to Expo palette
  - Background: `#f0f0f3` (Cloud Gray) instead of pure white
  - Card/surface: `#ffffff` (Pure White)
  - Foreground/text: `#1c2024` (Near Black)
  - Muted text: `#60646c` (Slate Gray)
  - Tertiary text: `#b0b4ba` (Silver)
  - Border: `#e0e1e6` (Border Lavender)
  - Input border: `#d9d9e0`
  - Primary CTA: `#000000` (Expo Black)
  - Link color: `#0d74ce` (Link Cobalt)
  - Ring/focus: `#2547d0` (Dark Focus Ring)
  - Keep semantic colors (success/warning/destructive) but tone them down
- [ ] 1.2 Update border-radius tokens to Expo scale
  - sm: 4px, md: 6px, lg: 8px, xl: 16px, 2xl: 24px, pill: 9999px
- [ ] 1.3 Update shadow tokens to Expo whisper system
  - Remove purple/blue glow shadows
  - Whisper: `rgba(0,0,0,0.08) 0px 3px 6px, rgba(0,0,0,0.07) 0px 2px 4px`
  - Elevated: `rgba(0,0,0,0.1) 0px 10px 20px, rgba(0,0,0,0.05) 0px 3px 6px`
- [ ] 1.4 Update typography tokens
  - Remove DM Sans + Outfit, switch to Inter only
  - Add JetBrains Mono for code
  - Update heading weights: 700-900 for display, 600 for headings
  - Add letter-spacing tokens for display text (-1.6px to -3px)
- [ ] 1.5 Remove AI slop from globals.css
  - Delete gradient definitions (aviation, horizon, sky)
  - Delete `.glass`, `.glass-strong` glassmorphism
  - Delete `.text-gradient-*` animated text effects
  - Delete `.altitude-accent`, `.horizon-line`, `.runway-pattern`, `.bg-sky-gradient`
  - Delete `.fly-across`, `.confetti-fall`, `.gentle-rotate`, `.gradient-shift` animations
  - Delete `.glow-hover` brand-tinted glow
- [ ] 1.6 Update `app/layout.tsx` fonts
  - Replace DM Sans + Outfit imports with Inter
  - Replace GeistMono with JetBrains Mono
  - Update body classes
- [ ] 1.7 Build verification

## Phase 2: Layout Chrome (Sidebar + Header + Navigation)

These affect every page — update once, visible everywhere.

- [ ] 2.1 Update `professional-sidebar.tsx` / `professional-sidebar-client.tsx`
- [ ] 2.2 Update `professional-header.tsx`
- [ ] 2.3 Update `mobile-nav.tsx` / `bottom-nav.tsx`
- [ ] 2.4 Update `dashboard-content-area.tsx` / `page-container.tsx`
- [ ] 2.5 Update `sidebar-shell.tsx` / `sidebar-collapse-provider.tsx`
- [ ] 2.6 Update portal layout + `pilot-portal-sidebar.tsx`
- [ ] 2.7 Build verification

## Phase 3: Base UI Components (shadcn/ui)

- [ ] 3.1 Button — Expo variants (white-border default, black pill CTA)
- [ ] 3.2 Card — Pure White on Cloud Gray, Border Lavender, whisper shadow
- [ ] 3.3 Input / Textarea — Clean borders, 6px radius
- [ ] 3.4 Select / Combobox
- [ ] 3.5 Badge — Pill-shaped, monochromatic variants
- [ ] 3.6 Dialog / Sheet — Expo elevation
- [ ] 3.7 Table — Clean, minimal borders
- [ ] 3.8 Tabs — Pill-shaped tab geometry
- [ ] 3.9 Toast / Sonner — Clean notifications
- [ ] 3.10 Skeleton — Monochromatic loading states
- [ ] 3.11 Build verification

## Phase 4: Admin Dashboard Pages (Batch 1 — Core, ~15 files)

- [ ] 4.1 Dashboard home
- [ ] 4.2 Pilots pages (4)
- [ ] 4.3 Certifications pages (4)
- [ ] 4.4 Requests pages (3)
- [ ] 4.5 Build verification

## Phase 5: Admin Dashboard Pages (Batch 2 — Secondary, ~15 files)

- [ ] 5.1 Analytics
- [ ] 5.2 Reports
- [ ] 5.3 Renewal planning (4)
- [ ] 5.4 Tasks (4)
- [ ] 5.5 Disciplinary (3)
- [ ] 5.6 Build verification

## Phase 6: Admin Dashboard Pages (Batch 3 — Admin + Misc, ~20 files)

- [ ] 6.1 Admin sub-pages (9)
- [ ] 6.2 Audit logs, feedback, help, support, FAQs
- [ ] 6.3 Notifications, settings, planning, published-rosters
- [ ] 6.4 Build verification

## Phase 7: Pilot Portal Pages (~21 files)

- [ ] 7.1 Auth pages (5)
- [ ] 7.2 Dashboard, profile, settings, about
- [ ] 7.3 Certifications, requests, flight-requests, leave-requests, leave-bids
- [ ] 7.4 Feedback pages
- [ ] 7.5 Build verification

## Phase 8: Auth + Static + Cleanup (~15 files)

- [ ] 8.1 Auth pages
- [ ] 8.2 Static pages (home, docs, privacy, terms, offline)
- [ ] 8.3 Not-found + error pages
- [ ] 8.4 Key feature components (dashboard widgets, forms, skeletons)
- [ ] 8.5 Final build + visual spot-check
