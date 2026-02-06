# UX/UI Upgrade Implementation Plan

**Created**: February 7, 2026
**Based on**: 5 agent review reports in `tasks/ux-review/`

---

## Phase 1: Quick Wins (< 30 min each, high impact)

- [x] 1.1 Replace emoji spinners (`⏳`) with `Loader2` component (leave/new, certifications/new)
- [x] 1.2 Replace `alert()` with toast in analytics export
- [x] 1.3 Move UrgentAlertBanner above roster periods in dashboard
- [x] 1.4 Fix `support@example.com` placeholder in portal error page
- [x] 1.5 Add `aria-hidden="true"` to decorative icons (support buttons, requests table)
- [x] 1.6 Add `aria-label` to checkboxes in requests table
- [x] 1.7 Add `aria-expanded` + `aria-label` to expand/collapse buttons in requests table
- [x] 1.8 Differentiate Audit Logs and Reports sidebar icons
- [x] 1.9 Fix phone number Calendar icon on profile page (should be Phone)
- [x] 1.10 Add `role="alert"` to error containers in leave form
- [x] 1.11 Mount `<GlobalAnnouncer />` in root layout
- [x] 1.12 Remove dead CSS (.btn-\*, .card, .input classes) from globals.css
- [x] 1.13 Replace hardcoded hex colors with CSS variable tokens (sidebar, dialog, sheet)
- [x] 1.14 Remove emoji prefixes from analytics section headers

## Phase 2: Component Fixes (1-2 hours each)

- [x] 2.1 Replace raw HTML `<select>` with shadcn Select component (leave/new, certifications/new)
- [x] 2.2 Replace `window.confirm()` with styled ConfirmDialog in pilot portal
- [x] 2.3 Fix unauthorized redirect on requests page (redirect to login instead of bare text)
- [x] 2.4 Add `aria-sort` to sorted table column headers (data-table, requests-table)
- [x] 2.5 Remove duplicate focus trap from Dialog component (Radix already handles it)
- [x] 2.6 Add `aria-describedby` + `aria-invalid` to leave form fields for error association
- [x] 2.7 Migrate badge.tsx to semantic color tokens
- [x] 2.8 Migrate alert.tsx to semantic color tokens
- [x] 2.9 Fix light-theme-only error colors (`bg-red-50`) in forms

## Phase 3: Layout & Navigation (2-4 hours each)

- [x] 3.1 Add mobile responsive sidebar with Sheet drawer for admin dashboard
- [x] 3.2 Standardize page backgrounds in pilot portal (use `bg-background` token everywhere)
- [x] 3.3 Standardize auth pages visual design (login/register/forgot-password)
- [x] 3.4 Add pagination to certifications page (follow audit-logs pattern)
- [x] 3.5 Fix reports tab layout breaking on small screens (scrollable tabs)
- [x] 3.6 Create `PageContainer` component for consistent page headers/spacing
- [x] 3.7 Add quick action buttons to pilot portal dashboard
- [x] 3.8 Make stat cards clickable/linkable on pilot portal dashboard

## Phase 4: Design System Consistency (1 day)

- [x] 4.1 Add surface elevation tokens (`--color-surface-0` through `--color-surface-3`)
- [x] 4.2 Create `STATUS_COLORS` constant and refactor feature components
- [x] 4.3 Fix z-index raw values in Sheet, Toast, Select to use CSS variables
- [x] 4.4 Standardize sidebar active states between admin and pilot portal
- [x] 4.5 Add `--color-interactive-*` and `--color-border-*` tokens
- [x] 4.6 Standardize heading hierarchy across all pages

## Phase 5: Structural Improvements (multi-day)

- [x] 5.1 Resolve redundant request pages in pilot portal (3 pages -> 1)
- [x] 5.2 Fix/replace `command.tsx` stub with proper cmdk integration
- [x] 5.3 Resolve FormField naming collision (3 components export same name)
- [x] 5.4 Unify table Column<T> interface between data-table and responsive-table
- [x] 5.5 Create SidebarShell abstraction shared between portals
- [x] 5.6 Add real charts/visualizations to analytics page
- [x] 5.7 Add column sorting to certifications table

---

## Reference

Full review reports: `tasks/ux-review/01-05`
