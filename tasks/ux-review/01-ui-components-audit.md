# UI Component Library Audit

**Auditor**: UI Component Auditor Agent
**Date**: February 7, 2026
**Scope**: 74 files in `components/ui/`
**Stack**: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui + Radix UI

---

## Executive Summary

The component library is **solid and well-structured** overall, with good accessibility foundations and a cohesive dark-theme design language. The library has been extended well beyond standard shadcn/ui with domain-specific components (aviation empty states, roster-specific skeletons). However, there are several consistency gaps, some deprecated/redundant components that need cleanup, and incomplete Storybook coverage.

**Overall Grade: B+** — Good foundations, actionable improvements needed.

---

## 1. Component Inventory (74 files)

### Core Primitives (Radix-based, shadcn/ui patterns)

- `button.tsx`, `badge.tsx`, `alert.tsx`, `card.tsx`, `dialog.tsx`, `sheet.tsx`
- `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `switch.tsx`, `radio-group.tsx`
- `label.tsx`, `form.tsx`, `progress.tsx`, `separator.tsx`, `scroll-area.tsx`
- `tooltip.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `accordion.tsx`, `collapsible.tsx`
- `tabs.tsx`, `toast.tsx`, `toaster.tsx`, `alert-dialog.tsx`, `breadcrumb.tsx`
- `calendar.tsx`, `avatar.tsx`

### Extended/Custom Components

- `data-table.tsx`, `responsive-table.tsx`, `table.tsx` — 3 table implementations
- `pagination.tsx` — with `usePagination` hook
- `command.tsx` — custom (non-cmdk) implementation
- `confirm-dialog.tsx` — with `useConfirm` hook
- `empty-state.tsx`, `empty-state-illustrated.tsx` — 2 empty state components
- `spinner.tsx` — with 4 spinner variants
- `skeleton.tsx` — with 8 skeleton compositions
- `feedback.tsx`, `error-alert.tsx`, `form-error-alert.tsx` — 3 error/feedback components
- `form-field.tsx`, `accessible-form.tsx` — 2 form wrapper components
- `file-upload.tsx`, `pilot-combobox.tsx` — domain-specific
- `modal.tsx` — separate from Radix Dialog
- `network-status-indicator.tsx`, `offline-indicator.tsx`, `retry-indicator.tsx` — 3 network components
- `success-celebration.tsx`, `animated-section.tsx`, `page-transition.tsx` — animation components
- `date-range-picker.tsx`, `data-table-loading.tsx`, `skip-link.tsx`, `route-change-focus.tsx`

### Documentation

- `button-guide.md`, `toast-guide.md`

---

## 2. Critical Issues

### 2.1 CRITICAL: Duplicate/Overlapping Components (Cleanup Needed)

**3 Table components with incompatible APIs:**

- `table.tsx` — Low-level HTML table wrappers (used by data-table)
- `data-table.tsx` — Generic sortable/filterable table with `Column<T>` using `id`, `header`, `accessorKey`
- `responsive-table.tsx` — Mobile-responsive table with `Column<T>` using `key`, `header`, `accessor`

The two high-level tables (`data-table.tsx` and `responsive-table.tsx`) have **different Column type definitions**. `data-table` uses `{ id, accessorKey, accessorFn }` while `responsive-table` uses `{ key, accessor, priority }`. This creates confusion for developers choosing between them.

**Recommendation:** Merge into a single `DataTable` that supports responsive mode via a prop (e.g., `responsive={true}`). Unify the `Column<T>` interface.

---

**3 Error/feedback components:**

- `error-alert.tsx` — **Already marked @deprecated**, should be removed
- `form-error-alert.tsx` — Small wrapper
- `feedback.tsx` — The intended replacement with unified API

**Recommendation:** Delete `error-alert.tsx` (it's deprecated) and migrate remaining usages to `feedback.tsx`.

---

**2 Empty state components:**

- `empty-state.tsx` — Generic with framer-motion animations
- `empty-state-illustrated.tsx` — Aviation-themed with SVG illustrations (24KB!)

Both are active. The illustrated version is very large (24KB single file) with inline SVGs.

**Recommendation:** Keep both but extract SVG illustrations to separate files to reduce bundle size. Consider lazy-loading the illustrated variant.

---

**2 Form wrapper components with conflicting names:**

- `form.tsx` — Standard shadcn/ui React Hook Form integration (exports `FormField`)
- `form-field.tsx` — Custom form field wrapper (exports `FormField`)
- `accessible-form.tsx` — Accessible form with focus management (exports `FormField`)

All three export a component called `FormField` but with **completely different APIs and purposes**. This is a naming collision that will confuse developers.

**Recommendation:** Rename `form-field.tsx` exports to `StandaloneFormField` or `SimpleFormField`, and `accessible-form.tsx`'s export to `AccessibleFormField`.

---

**Dialog vs Modal overlap:**

- `dialog.tsx` — Radix Dialog with focus trap
- `modal.tsx` — Custom accessible modal with built-in focus management

Both serve the same purpose. The custom `modal.tsx` duplicates what `dialog.tsx` provides via Radix.

**Recommendation:** Evaluate if `modal.tsx` provides anything `dialog.tsx` doesn't. If not, deprecate it.

---

### 2.2 CRITICAL: `command.tsx` Is a Stub Implementation

The `command.tsx` is a **simplified custom implementation** that doesn't use `cmdk` (the standard shadcn/ui dependency). Key issues:

- `CommandDialog` is literally `({ ...props }) => <div {...props} />` — a no-op placeholder
- No keyboard navigation support (arrow keys, type-ahead)
- No filtering logic (`shouldFilter` prop is accepted but ignored)
- Missing `role="listbox"`, `role="option"` ARIA attributes on items
- Used by `global-search.tsx` and `pilot-combobox.tsx`

**This means the global search and pilot selector lack keyboard navigation.**

**Recommendation:** Replace with proper `cmdk` integration or add keyboard navigation support. This is a significant accessibility regression.

---

### 2.3 CRITICAL: Inconsistent forwardRef Pattern (React 19)

React 19 no longer requires `forwardRef` — `ref` can be passed as a regular prop. The codebase is mixed:

- **New pattern (function components, no forwardRef):** `button.tsx`, `badge.tsx`, `label.tsx`
- **Legacy pattern (forwardRef):** `card.tsx`, `input.tsx`, `textarea.tsx`, `dialog.tsx`, `select.tsx`, `alert.tsx`, `checkbox.tsx`, `switch.tsx`, `table.tsx`, `popover.tsx`, `tooltip.tsx`, `sheet.tsx`, `toast.tsx`, `progress.tsx`, `form.tsx`

~80% of components still use the legacy `React.forwardRef` pattern.

**Recommendation:** Gradually migrate to the React 19 pattern. Not urgent but should be tracked.

---

## 3. Consistency Analysis

### 3.1 Visual Consistency — GOOD with Gaps

**Border radius:** Mostly consistent

- `rounded-lg` — button, input, textarea, alert, feedback, sheet, form items
- `rounded-xl` — card, dialog, popover, toast, responsive-table, confirm-dialog
- `rounded-full` — badge, progress, avatar, checkbox (rounded, not rounded-full)
- `rounded-md` — command items, dropdown items, tooltip

Minor gap: `rounded-md` vs `rounded-lg` for interactive items in dropdowns vs elsewhere.

**Border colors:** Consistent dark-theme pattern

- `border-white/[0.06]` — Default subtle border (card, table rows, tabs)
- `border-white/[0.08]` — Slightly more visible (dialog, popover, input)
- `border-white/[0.1]` — Hover states
- `border-input` — Some components use semantic token, others hardcode

**Issue:** Inconsistent use of `border-input` (semantic) vs `border-white/[0.08]` (hardcoded). Input uses hardcoded `border-white/[0.08]`, but Select uses `border-input`. Textarea uses `border-border`.

**Recommendation:** Standardize on semantic tokens (`border-input` for form elements, `border-border` for structural borders).

---

### 3.2 Background Colors — Minor Inconsistency

Dialog and Popover use hardcoded dark colors:

- Dialog: `bg-[#111827]` (hardcoded hex)
- Popover: `bg-[rgba(17,24,39,0.9)]` (hardcoded rgba, same color with alpha)
- Sheet: `bg-[#0d1117]` (different hardcoded hex!)
- Toast: `bg-[rgba(17,24,39,0.9)]` (matches popover)
- Card: `bg-card` (semantic token)
- Table footer: `bg-white/[0.03]` (alpha)

**Issue:** 3 different background approaches for overlays (dialog, popover, sheet). Sheet uses a noticeably darker color than dialog.

**Recommendation:** Define CSS custom properties for overlay backgrounds and use them consistently:

```css
--overlay-bg: rgba(17, 24, 39, 0.9);
--overlay-bg-solid: #111827;
```

---

### 3.3 Typography — GOOD

Consistent patterns across the board:

- Titles: `font-semibold` + `tracking-tight`
- Descriptions: `text-muted-foreground text-sm`
- Form labels: `text-sm font-medium`
- Table headers: `text-xs font-medium uppercase tracking-wider`

---

### 3.4 Focus Styles — Mixed

Three different focus patterns in use:

1. **Ring-based (preferred):** `focus-visible:ring-2 focus-visible:ring-ring/20` (checkbox, tabs)
2. **Ring + border:** `focus:ring-2 focus:ring-primary/20 focus:border-primary/50` (input)
3. **Ring + offset:** `focus:ring-2 focus:ring-offset-2` (toast action, switch)
4. **Button-specific:** `focus-visible:ring-[3px] focus-visible:ring-accent/20` (button)

**Issue:** `ring-offset` approach creates visual inconsistency on dark backgrounds (offset adds a gap). Some use `focus:` (always), others use `focus-visible:` (keyboard only).

**Recommendation:** Standardize on `focus-visible:ring-2 focus-visible:ring-{color}/20` without offset for dark theme.

---

### 3.5 Spacing — GOOD

Card padding is consistent at `p-5` throughout (CardHeader, CardContent, CardFooter). Form spacing uses `space-y-1.5` to `space-y-2`. Button gap is `gap-2`. These are well-maintained.

---

### 3.6 Transition Duration — Minor Inconsistency

- Most components: `duration-200`
- Table rows: `duration-150`
- Checkbox: `duration-150`
- Sheet animation: `data-[state=closed]:duration-300 data-[state=open]:duration-500`
- Button: `duration-200`

Sheet's asymmetric timing (300ms close, 500ms open) is intentional UX. But the 150ms vs 200ms split for micro-interactions is inconsistent.

**Recommendation:** Standardize micro-interactions on `duration-150` and larger transitions on `duration-200`.

---

## 4. Prop API Quality

### 4.1 Variant Patterns — GOOD

Consistent use of `class-variance-authority` (CVA) for variant-based components:

- `button.tsx` — 10 variants, 6 sizes
- `badge.tsx` — 7 variants
- `alert.tsx` — 5 variants
- `card.tsx` — 3 variants + `interactive` boolean
- `toast.tsx` — 5 variants
- `feedback.tsx` — 4 types × 3 variants (well-designed matrix)

**Notable:** Button has domain-specific variants (`aviation`, `critical`) which are creative but might bloat the core component. Consider extracting to a `DomainButton` or using `className` overrides.

---

### 4.2 Loading/Error States — Inconsistent

- `button.tsx` — Has `loading` + `loadingText` props ✅
- `data-table.tsx` — No built-in loading state (uses separate `data-table-loading.tsx`)
- `responsive-table.tsx` — Has `loading` prop with built-in skeleton ✅
- `confirm-dialog.tsx` — Has internal `isLoading` state ✅
- `select.tsx` — No loading state ❌
- `input.tsx` — Has `error` + `success` states ✅
- `textarea.tsx` — Has `error` + `success` + `showCharCount` ✅

**Recommendation:** Add `loading` prop to Select for async data fetching use cases.

---

### 4.3 Size Props — Mostly Consistent

- Button: `default | sm | lg | icon | icon-sm | icon-lg`
- Input: `default | sm | lg`
- Spinner: `sm | md | lg | xl`
- Modal: `sm | md | lg | xl | full`

Input and Button both use `default | sm | lg` which is good. Spinner adds `md` and `xl`. Minor inconsistency but acceptable.

---

## 5. Storybook Coverage

### Components WITH Stories (15/74 = 20%)

- `alert.stories.tsx` ✅
- `badge.stories.tsx` ✅
- `button.stories.tsx` ✅
- `card.stories.tsx` ✅
- `data-table.stories.tsx` ✅
- `empty-state.stories.tsx` ✅
- `input.stories.tsx` ✅
- `network-status-indicator.stories.tsx` ✅
- `offline-indicator.stories.tsx` ✅
- `pagination.stories.tsx` ✅
- `select.stories.tsx` ✅
- `skeleton.stories.tsx` ✅
- `spinner.stories.tsx` ✅
- `toast.stories.tsx` ✅
- `toaster.stories.tsx` ✅

### High-Priority Missing Stories

- `dialog.tsx` — Core component, needs stories for size/overlay demos
- `form.tsx` + `form-field.tsx` — Form patterns need visual documentation
- `responsive-table.tsx` — New component, needs mobile/desktop demos
- `feedback.tsx` — Replacement for error-alert, needs all type/variant combos
- `confirm-dialog.tsx` — Interactive component needs stories
- `dropdown-menu.tsx` — Complex component, no visual docs
- `tabs.tsx` — Common component, no stories
- `sheet.tsx` — Side panel variants need documentation
- `file-upload.tsx` — New component, needs interaction stories
- `checkbox.tsx`, `switch.tsx`, `textarea.tsx` — Form primitives without stories

**Recommendation:** Prioritize stories for dialog, form patterns, feedback, and responsive-table.

---

## 6. Accessibility Audit

### Strong Points ✅

- **ARIA labels** on spinner (`role="status"`, `aria-label="Loading"`)
- **ARIA live regions** on textarea char count (`aria-live="polite"`)
- **Focus management** in dialog (custom `useFocusTrap`)
- **Screen reader text** on close buttons (`<span className="sr-only">Close</span>`)
- **Keyboard navigation** on data-table rows (`onKeyDown` for Enter/Space)
- **Skip link** component (`skip-link.tsx`)
- **Route change focus** component (`route-change-focus.tsx`)
- **Reduced motion** support in animations (`useAnimationSettings`)
- **Accessible form** with auto-focus management
- **Sort state** announced via `aria-label` and `aria-pressed`

### Issues ❌

- `command.tsx` — Missing `role="listbox"` on list, `role="option"` on items
- `DataTableSearch` in `data-table.tsx` uses a raw `<input>` instead of the `Input` component, losing consistency and the error/success state support
- `responsive-table.tsx` CardView — Clickable cards lack `role="button"` and `tabIndex`
- `responsive-table.tsx` TableView — Clickable rows lack `tabIndex` and keyboard handlers (data-table.tsx has them, but responsive-table doesn't)
- `empty-state-illustrated.tsx` — Large decorative SVGs lack `aria-hidden="true"` consistently

---

## 7. Dark Mode Support

The library is designed as **dark-mode-first** (aviation theme). This is fine for the fleet management context but creates a gap:

- No light mode toggle capability
- Hardcoded dark colors (`bg-[#111827]`, `bg-[#0d1117]`, `bg-black/60`, `bg-white/[0.04]`) would need full replacement for light mode
- Some components use semantic tokens (`bg-card`, `bg-background`, `text-foreground`) which would adapt
- Others hardcode (`bg-white/[0.06]` for skeleton shimmer, `border-white/[0.06]` everywhere)

**Assessment:** Light mode would require significant effort. Since this is an aviation fleet management tool used in controlled environments, dark-only is acceptable. But document this decision.

---

## 8. Tailwind CSS v4 Usage

### Good Practices ✅

- Proper use of `data-[state=*]:` selectors for Radix states
- CSS variable references (`var(--color-status-high)`, `var(--z-modal)`)
- Modern `has-[>svg]:` selector in button
- `origin-[--radix-dialog-content-transform-origin]` for dynamic transform origins
- `animate-in`/`animate-out` classes for enter/exit animations

### Could Be Improved

- Some components still use `@/lib/utils` → `cn()` with very long class strings that could benefit from Tailwind v4's `@apply` in component CSS or extraction to CVA variants
- No evidence of Tailwind v4's `@theme` directive or CSS-first configuration being used in components (the config may be external)

---

## 9. Missing Components

Components commonly needed in admin dashboards that are absent:

| Component              | Priority  | Rationale                                                                  |
| ---------------------- | --------- | -------------------------------------------------------------------------- |
| `Breadcrumb`           | ✅ EXISTS | Already present                                                            |
| `Command Palette`      | HIGH      | Current `command.tsx` is a stub — needs real implementation                |
| `Combobox`             | MEDIUM    | `pilot-combobox.tsx` exists but is domain-specific; no generic combobox    |
| `Toggle / ToggleGroup` | LOW       | Could enhance filter UIs                                                   |
| `Stepper / Wizard`     | LOW       | Leave request multi-step forms could benefit                               |
| `Timeline`             | LOW       | Could be useful for audit log visualization                                |
| `Stat Card`            | LOW       | MetricCardSkeleton exists in skeleton.tsx but no actual StatCard component |

---

## 10. Prioritized Recommendations

### P0 — Fix Now (Functional Issues)

1. **Fix `command.tsx`** — Either integrate `cmdk` properly or add keyboard navigation + ARIA roles. Global search accessibility depends on this.
2. **Delete deprecated `error-alert.tsx`** — It says @deprecated, migrate any remaining usages to `feedback.tsx`.
3. **Resolve `FormField` naming collision** — Three components export the same name with different APIs.

### P1 — Fix Soon (Consistency)

4. **Unify table Column interface** — `data-table.tsx` and `responsive-table.tsx` should share a single `Column<T>` type.
5. **Standardize border tokens** — Replace hardcoded `border-white/[0.08]` with `border-input` in form elements.
6. **Standardize overlay backgrounds** — Define CSS custom properties instead of hardcoding hex/rgba values across dialog, popover, sheet.
7. **Standardize focus styles** — Use `focus-visible:ring-2` consistently, remove `ring-offset` pattern.
8. **Add keyboard navigation to `responsive-table.tsx`** CardView — Match what `data-table.tsx` already provides.

### P2 — Improve (Quality)

9. **Add Storybook stories** for dialog, form patterns, feedback, responsive-table, confirm-dialog, tabs, sheet (7 high-priority).
10. **Extract SVG illustrations** from `empty-state-illustrated.tsx` into separate files to reduce the 24KB bundle.
11. **Migrate `forwardRef` to React 19 pattern** — Track as tech debt, do gradually.
12. **Evaluate `modal.tsx` vs `dialog.tsx` overlap** — Consider deprecating modal.tsx if dialog.tsx covers all use cases.
13. **Add `loading` prop to Select** for async data patterns.

### P3 — Nice to Have

14. Add a generic `Combobox` component (not domain-specific).
15. Add a `StatCard` component to complement `MetricCardSkeleton`.
16. Standardize transition durations (150ms vs 200ms).
17. Add Tailwind v4 `@theme` or design token documentation.

---

## Appendix: Component-by-Component Quick Reference

| Component        | CVA | forwardRef  | Storybook | ARIA | Loading | Notes                |
| ---------------- | --- | ----------- | --------- | ---- | ------- | -------------------- |
| button           | ✅  | ❌ (new)    | ✅        | ✅   | ✅      | Excellent            |
| badge            | ✅  | ❌ (new)    | ✅        | ✅   | —       | Good                 |
| alert            | ✅  | ✅ (legacy) | ✅        | ✅   | —       | Good                 |
| card             | ✅  | ✅ (legacy) | ✅        | —    | —       | Good                 |
| dialog           | —   | ✅ (legacy) | ❌        | ✅   | —       | Needs stories        |
| sheet            | ✅  | ✅ (legacy) | ❌        | —    | —       | Needs stories        |
| input            | ✅  | ✅ (legacy) | ✅        | ✅   | —       | Error/success states |
| textarea         | —   | ✅ (legacy) | ❌        | ✅   | —       | Char count nice      |
| select           | —   | ✅ (legacy) | ✅        | ✅   | ❌      | Needs loading        |
| checkbox         | —   | ✅ (legacy) | ❌        | ✅   | —       | Good                 |
| switch           | —   | ✅ (legacy) | ❌        | —    | —       | Basic                |
| tabs             | —   | ✅ (legacy) | ❌        | —    | —       | Clean                |
| toast            | ✅  | ✅ (legacy) | ✅        | —    | —       | Good variants        |
| form             | —   | ✅ (legacy) | ❌        | ✅   | —       | Standard shadcn      |
| data-table       | —   | —           | ✅        | ✅   | ❌      | Good a11y            |
| responsive-table | —   | —           | ❌        | ⚠️   | ✅      | Missing kbd nav      |
| command          | —   | ✅ (legacy) | ❌        | ❌   | —       | **STUB**             |
| pagination       | —   | —           | ✅        | ✅   | —       | Well-built           |
| skeleton         | —   | —           | ✅        | —    | —       | Great compositions   |
| spinner          | —   | —           | ✅        | ✅   | —       | 4 variants           |
| empty-state      | —   | —           | ✅        | ✅   | —       | Motion-aware         |
| feedback         | ✅  | —           | ❌        | ✅   | —       | Needs stories        |
| confirm-dialog   | —   | —           | ❌        | ✅   | ✅      | useConfirm hook nice |
| file-upload      | —   | —           | ❌        | ✅   | ✅      | New, needs stories   |
| tooltip          | —   | ✅ (legacy) | ❌        | —    | —       | Standard             |
| popover          | —   | ✅ (legacy) | ❌        | —    | —       | Standard             |
| dropdown-menu    | —   | ✅ (legacy) | ❌        | ✅   | —       | Standard             |
| progress         | —   | ✅ (legacy) | ❌        | —    | —       | Gradient option      |
| label            | —   | ❌ (new)    | ❌        | —    | —       | Clean                |

---

_End of audit. Total components reviewed: 74 files, 50+ distinct components._
