# Design System Consistency Analysis

**Analyst**: Design System Analyst (Agent)
**Date**: February 2026
**Scope**: Full design system audit across admin dashboard and pilot portal

---

## 1. Current Design System State Assessment

### Overall Rating: 7/10 — Strong Foundation, Inconsistent Application

The fleet management app has an **impressively well-defined design token system** in `globals.css` using Tailwind CSS v4's `@theme` directive. The foundation is genuinely premium — a "Dark Navy" Linear-inspired theme with semantic color tokens, layout variables, z-index scales, fluid typography, aviation-specific gradients, and glassmorphism utilities. However, the gap between the **defined tokens** and their **actual usage in components** is the primary issue.

### Strengths

1. **Comprehensive token architecture** — The `@theme` block (`app/globals.css:3-209`) defines 100+ design tokens covering colors, spacing, shadows, transitions, typography, z-index, and aviation-specific decorative tokens. This is significantly more complete than most production apps.

2. **Semantic color system** — Primary (blue-500), accent (cyan-500), success (emerald), warning (amber), destructive (red) are all well-defined with full scales, foreground pairs, and muted variants.

3. **UI component library quality** — Core components (`button.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `table.tsx`, `input.tsx`, `alert.tsx`, `toast.tsx`) all use `class-variance-authority` for variant management and `cn()` for composition. This is a strong, maintainable pattern.

4. **Animation infrastructure** — Both CSS keyframe animations (in `globals.css:329-975`) and Framer Motion presets (`lib/animations/motion-variants.ts`) exist with reduced motion support (`prefers-reduced-motion`). The centralized `EASING` and `DURATION` constants are well-considered.

5. **Typography system** — Three-font strategy: Geist Sans (body), Geist Mono (code), Space Grotesk (display/headings) with fluid clamp-based sizing (`--text-xs` through `--text-6xl`).

6. **Accessibility foundations** — Skip links, focus indicators (WCAG 2.2 AA), `prefers-reduced-motion` support, `prefers-contrast: high` support, `sr-only` utilities, `touch-target` 44px minimum.

### Weaknesses (Detailed Below)

- Hard-coded hex colors bypassing tokens
- Inconsistent spacing across pages
- Sidebar design divergence between portals
- Under-utilized centralized animation presets
- Duplicated button/card CSS patterns in globals.css vs component files
- Raw Tailwind colors used instead of semantic tokens

---

## 2. Inconsistencies Found

### 2.1 Hard-Coded Background Colors (Bypassing Design Tokens)

**Severity: Medium** — These colors should use CSS variables but use raw hex values instead, making theme changes impossible.

| File                                                | Line | Hard-coded Value  | Should Use                                     |
| --------------------------------------------------- | ---- | ----------------- | ---------------------------------------------- |
| `components/layout/professional-sidebar-client.tsx` | 204  | `bg-[#0d1117]`    | `bg-background` or new `--color-sidebar` token |
| `components/layout/professional-header.tsx`         | 162  | `bg-[#0d1117]/80` | New `--glass-sidebar-bg` token                 |
| `components/ui/dialog.tsx`                          | 70   | `bg-[#111827]`    | `bg-card` (already `#111827`)                  |
| `components/ui/sheet.tsx`                           | 41   | `bg-[#0d1117]`    | `bg-background` or sidebar token               |
| `app/portal/(public)/layout.tsx`                    | 17   | `bg-[#0a0e1a]`    | `bg-background` (already `#0a0e1a`)            |

**Impact**: If the background color ever changes, these components won't update. The sidebar uses `#0d1117` (slightly lighter than `--color-background` at `#0a0e1a`) but this distinction isn't captured in the token system.

**Recommendation**: Add explicit sidebar/surface-level tokens:

```css
--color-surface-0: #0a0e1a; /* Page background (existing --color-background) */
--color-surface-1: #0d1117; /* Sidebar, header, sheet */
--color-surface-2: #111827; /* Cards, dialogs (existing --color-card) */
--color-surface-3: #1e293b; /* Elevated panels, popovers (existing --color-popover) */
```

### 2.2 Raw Tailwind Color Usage (Bypassing Semantic System)

**Severity: High** — Many feature components use raw Tailwind color classes instead of the semantic tokens defined in `globals.css`.

**Examples of inconsistent status color usage:**

| Context        | File:Line                                                       | Uses              | Should Use                                              |
| -------------- | --------------------------------------------------------------- | ----------------- | ------------------------------------------------------- |
| Success status | `components/reports/paginated-report-table.tsx:461`             | `text-green-600`  | `text-success` or `text-[var(--color-status-low)]`      |
| Warning status | `components/reports/paginated-report-table.tsx:463`             | `text-yellow-600` | `text-warning` or `text-[var(--color-status-medium)]`   |
| Error status   | `components/reports/paginated-report-table.tsx:465`             | `text-red-600`    | `text-destructive` or `text-[var(--color-status-high)]` |
| Error form     | `components/reports/roster-email-report-dialog.tsx:368`         | `text-red-600`    | `text-destructive`                                      |
| Success text   | `components/examples/connection-error-handling-example.tsx:143` | `text-green-600`  | `text-success`                                          |
| Star icon      | `components/pilots/pilots-page-content.tsx:32`                  | `text-yellow-500` | `text-warning`                                          |
| Forecast icon  | `components/reports/forecast-report-form.tsx:286`               | `text-red-500`    | `text-destructive`                                      |
| Forecast icon  | `components/reports/forecast-report-form.tsx:312`               | `text-green-500`  | `text-success`                                          |

**The badge component itself shows the pattern inconsistency:**

- `badge.tsx` uses `bg-red-500/15 text-red-400` for destructive (raw colors)
- `toast.tsx` uses `var(--color-status-high)` for destructive (semantic tokens)
- `alert.tsx` uses `bg-red-500/10 text-red-400` (raw colors)

**Recommendation**: All semantic status indicators should use the design tokens. The badge and alert components should be migrated to use `--color-status-*` or `--color-success/warning/destructive` tokens.

### 2.3 Admin Sidebar vs Pilot Portal Sidebar — Design Divergence

**Severity: Medium** — The two sidebars have different visual design languages despite serving the same UX purpose.

| Property            | Admin Sidebar (`professional-sidebar-client.tsx`)     | Pilot Portal Sidebar (`pilot-portal-sidebar.tsx`) |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| Logo header height  | `h-12` (48px)                                         | `h-16` (64px)                                     |
| Logo icon size      | `h-7 w-7` container, `h-3.5 w-3.5` icon               | `h-10 w-10` container, `h-5 w-5` icon             |
| Logo icon bg        | `bg-accent` (cyan)                                    | `bg-primary` (blue)                               |
| Section label style | `text-[10px] tracking-widest uppercase text-white/30` | None — flat nav list                              |
| Nav item height     | `min-h-[32px]` compact                                | `py-3` (taller, ~48px)                            |
| Active state        | `bg-primary/15 text-primary border-l-2`               | `bg-primary text-primary-foreground` (solid fill) |
| Hover state         | `hover:bg-white/[0.04]`                               | `hover:bg-muted`                                  |
| Item description    | None                                                  | Shows description subtitle                        |
| Logout button       | Ghost: `hover:bg-red-500/10 hover:text-red-400`       | Solid: `bg-destructive text-white`                |
| Sections            | Collapsible with chevron animation                    | Flat list with divider                            |
| Background          | `bg-[#0d1117]` (hardcoded)                            | `bg-background` (token)                           |

**Impact**: Users switching between admin and pilot portal experience a jarring visual shift. The pilot portal sidebar is more spacious and touch-friendly, while the admin sidebar is more information-dense — which is reasonable, but the active states and logout buttons are strikingly different.

**Recommendation**: Standardize shared properties while allowing intentional differences:

- Same logo header height
- Same active state pattern (prefer the admin's subtle `bg-primary/15` over solid fill)
- Same logout button style
- Both should use design tokens for backgrounds

### 2.4 Page-Level Spacing Inconsistency

**Severity: Medium** — Different dashboard pages use different grid gaps, section spacing, and content padding.

| Page                                  | Grid Gap                                    | Section Spacing          |
| ------------------------------------- | ------------------------------------------- | ------------------------ |
| `app/dashboard/page.tsx`              | `space-y-8`                                 | —                        |
| `app/dashboard/analytics/page.tsx`    | Mixed: `gap-2.5`, `gap-3`, `gap-4`, `gap-6` | `space-y-4`, `space-y-6` |
| `app/dashboard/audit/page.tsx`        | `gap-6`                                     | `mb-8`                   |
| `app/dashboard/disciplinary/page.tsx` | `gap-6`                                     | `mb-8`                   |
| `app/dashboard/leave/page.tsx`        | —                                           | `space-y-4`, `space-y-6` |
| Dashboard layout main content         | `p-4 lg:p-5`                                | —                        |

**Observation**: The design system defines `--spacing-page` (1rem), `--spacing-section` (2rem), and `--spacing-card` (1.25rem) but these tokens are **never referenced** in actual page components. Every page makes ad-hoc spacing decisions.

**Recommendation**: Create standardized page layout utility classes:

```css
.page-container {
  gap: var(--spacing-section);
}
.section-grid {
  gap: var(--spacing-card);
}
```

### 2.5 Duplicated Button Patterns

**Severity: Low** — The `globals.css` file defines `.btn`, `.btn-primary`, `.btn-secondary` etc. at line 267-298 as component layer classes, but these are **never used** anywhere in the codebase. All components use the CVA-based `<Button>` component from `components/ui/button.tsx`.

Similarly, `.card` and `.input` are defined in globals.css (lines 299-314) but the actual `<Card>` and `<Input>` components have their own self-contained styling.

**Recommendation**: Remove the unused `.btn-*`, `.card`, and `.input` classes from `globals.css` to reduce confusion and dead code.

### 2.6 Animation System Fragmentation

**Severity: Low-Medium** — Three separate animation systems exist:

1. **CSS Keyframes** (`globals.css:329-975`) — 15+ keyframe animations with utility classes
2. **Framer Motion presets** (`lib/animations/motion-variants.ts`) — Full variant library
3. **Inline Framer Motion** — Many components define their own inline motion values

**Usage breakdown:**

- `lib/animations` is only imported by 4 components (`empty-state.tsx`, `empty-state-illustrated.tsx`, `page-transition.tsx`, `animated-section.tsx`)
- Framer Motion is imported by 17 components total, most using inline definitions
- Most components that use sidebar/dropdown animations define their own `initial/animate/exit` values inline

**Example: The professional header dropdown** (`professional-header.tsx:200-204`) uses:

```tsx
initial={{ opacity: 0, y: 4 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 4 }}
transition={{ duration: 0.1 }}
```

This matches the centralized `slideInDown` variant in `motion-variants.ts` but doesn't reference it.

**Recommendation**: Gradually migrate inline Framer Motion animations to use centralized presets, and document which CSS animations vs Framer Motion variants should be used for each context.

### 2.7 z-index Inconsistencies

**Severity: Low** — The design system defines a z-index scale (`globals.css:118-128`), and most components use it via `z-[var(--z-*)]`. However:

- `SheetOverlay` uses `z-50` (raw) instead of `z-[var(--z-overlay)]` (50)
- `SheetContent` uses `z-50` (raw) instead of `z-[var(--z-modal)]` (60)
- `ToastViewport` uses `z-[100]` (raw, outside the defined scale)
- `SelectContent` uses `z-[100]` (raw, outside the defined scale)

**Recommendation**: Add `--z-select: 100` and `--z-toast-viewport: 100` to the z-index scale, and migrate raw z-index values to use CSS variables.

---

## 3. Unified Design Token Recommendations

### 3.1 Surface Elevation Tokens (New)

Currently `--color-background`, `--color-card`, and `--color-popover` are the only surface tokens. A proper elevation system would be:

```css
/* Surface elevation system */
--color-surface-0: #0a0e1a; /* Page background */
--color-surface-1: #0d1117; /* Sidebar, header, sheet */
--color-surface-2: #111827; /* Cards, dialog */
--color-surface-3: #1e293b; /* Popovers, elevated panels */
--color-surface-4: #334155; /* Tooltips, dropdown menus */
```

### 3.2 Interactive State Tokens (New)

Currently interactive states use `white/[0.04]`, `white/[0.06]`, `white/[0.08]` etc. inconsistently. Standardize:

```css
--color-interactive-hover: rgba(255, 255, 255, 0.04);
--color-interactive-active: rgba(255, 255, 255, 0.06);
--color-interactive-selected: rgba(255, 255, 255, 0.08);
--color-interactive-focus: rgba(59, 130, 246, 0.2);
```

### 3.3 Border Opacity Tokens (New)

Multiple border opacity values are used (`white/[0.04]`, `white/[0.06]`, `white/[0.08]`, `white/[0.1]`, `white/[0.2]`). Standardize to three levels:

```css
--color-border-subtle: rgba(255, 255, 255, 0.04);
--color-border-default: rgba(255, 255, 255, 0.08); /* existing --color-border */
--color-border-emphasis: rgba(255, 255, 255, 0.15);
```

### 3.4 Navigation Tokens (New)

Sidebar-specific tokens to unify admin and pilot portal:

```css
--nav-item-height: 32px;
--nav-item-padding: 0.5rem 0.75rem;
--nav-active-bg: rgba(59, 130, 246, 0.15);
--nav-active-text: var(--color-primary);
--nav-hover-bg: var(--color-interactive-hover);
--nav-section-label-size: 10px;
```

---

## 4. Component Pattern Standardization Proposals

### 4.1 Status Color Mapping — Single Source of Truth

Create a shared mapping that all components reference:

```typescript
// lib/constants/status-colors.ts
export const STATUS_COLORS = {
  success: { text: 'text-success', bg: 'bg-success-muted', border: 'border-success/30' },
  warning: { text: 'text-warning', bg: 'bg-warning-muted', border: 'border-warning/30' },
  danger: { text: 'text-destructive', bg: 'bg-destructive-muted', border: 'border-destructive/30' },
  info: { text: 'text-info', bg: 'bg-info-bg', border: 'border-info-border' },
  neutral: { text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
} as const
```

Then refactor `badge.tsx`, `alert.tsx`, and `toast.tsx` to reference this mapping. Feature components should import `STATUS_COLORS` instead of ad-hoc raw color classes.

### 4.2 Page Layout Component

Create a standardized page wrapper:

```tsx
// components/layout/page-container.tsx
export function PageContainer({ title, description, actions, children }) {
  return (
    <div className="space-y-[var(--spacing-section)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
```

### 4.3 Sidebar Component Abstraction

Create a shared `SidebarShell` component that both admin and pilot portal sidebars use:

```tsx
// components/layout/sidebar-shell.tsx
export function SidebarShell({ logo, navigation, footer, variant = 'admin' }) {
  // Shared: z-index, width, border, background (from token)
  // Variant: header height, nav item density, active state style
}
```

### 4.4 Badge Semantic Variants Alignment

The badge's `default` variant uses `bg-primary/15 text-primary` which is correct. But `destructive` uses raw `bg-red-500/15 text-red-400` — it should use `bg-destructive-muted text-destructive-muted-foreground` (or similar tokens already defined in the theme).

---

## 5. Visual Hierarchy Improvement Suggestions

### 5.1 Heading Consistency

The `globals.css` base layer defines heading styles (`h1` through `h4` with font sizes), but in practice:

- Dashboard content uses `<h3>` with `text-xs font-medium tracking-wider uppercase` for section headers (Linear-style)
- Some pages use `<h2>` with `text-2xl font-semibold`
- Others use `<h3>` with `text-lg font-semibold`

**Recommendation**: Define three heading patterns and document when to use each:

1. **Page title**: `text-2xl font-semibold tracking-tight font-display` (h1)
2. **Section title**: `text-lg font-semibold` (h2)
3. **Subsection label**: `text-xs font-medium tracking-wider uppercase text-muted-foreground` (h3, Linear-style)

### 5.2 Card Content Density

The `CardHeader` uses `p-5` and `CardContent` uses `p-5 pt-0`, which gives consistent 20px padding. However, many components override this:

- `dashboard-content.tsx:67` uses `p-4` directly on Card
- Analytics page uses various `p-4 sm:p-5 lg:p-6` responsive padding

**Recommendation**: The Card component's built-in `p-5` is a good default. Create a `compact` variant for dashboard widgets that need tighter padding:

```tsx
const cardVariants = cva('...', {
  variants: {
    variant: { default: '...', glass: '...', elevated: '...' },
    density: { default: '', compact: '[&_.card-header]:p-4 [&_.card-content]:p-4' },
  },
})
```

### 5.3 Icon Sizing Standards

Lucide React icons are used universally (180 component files import from `lucide-react`) which is great for consistency. Icon sizes vary:

- Sidebar nav: `h-4 w-4`
- Pilot portal nav: `h-5 w-5`
- Action cards: `h-6 w-6`
- Empty states: `h-8 w-8` to `h-12 w-12`

**Recommendation**: Document standard icon sizes:

- **Inline/nav**: `h-4 w-4` (16px)
- **Feature icon/touch target**: `h-5 w-5` (20px)
- **Card/action icon**: `h-6 w-6` (24px)
- **Empty state/hero**: `h-10 w-10` to `h-12 w-12` (40-48px)

---

## 6. Prioritized Action Plan

### P0 — Quick Wins (1-2 hours each, high visual impact)

1. **Replace hard-coded hex colors** with CSS variable references in sidebar, header, dialog, and sheet components (5 files, ~10 line changes)
2. **Remove dead CSS** — Delete unused `.btn-*`, `.card`, `.input` from `globals.css` component layer (lines 266-315)
3. **Add surface-level tokens** (`--color-surface-0` through `--color-surface-3`) to `@theme` block

### P1 — Component Token Migration (1 day)

4. **Migrate badge.tsx** to use semantic color tokens instead of raw `red-500`, `amber-500`, `emerald-500`
5. **Migrate alert.tsx** to use semantic color tokens
6. **Fix z-index raw values** in Sheet, Toast, Select to use CSS variables
7. **Add missing z-index tokens** for select dropdown and toast viewport

### P2 — Standardization (2-3 days)

8. **Create `STATUS_COLORS` constant** and refactor all feature components to use it instead of ad-hoc color classes
9. **Create `PageContainer` component** and migrate dashboard pages to use it for consistent heading/spacing
10. **Standardize sidebar active states** — unify admin and pilot portal active/hover patterns
11. **Add `--color-interactive-*` and `--color-border-*` level tokens** to theme

### P3 — Architecture Improvements (1 week)

12. **Create `SidebarShell` abstraction** shared between admin and pilot portal sidebars
13. **Migrate inline Framer Motion** animations to centralized presets in `lib/animations/`
14. **Document the design system** — create a `DESIGN_TOKENS.md` reference for developers
15. **Add page-level spacing tokens** and responsive layout utilities

### P4 — Polish (Ongoing)

16. **Audit all 30+ feature components** for raw color usage and migrate to semantic tokens
17. **Add Storybook stories** for any missing component variants
18. **Create visual regression tests** for design token changes

---

## Summary

The design system is **architecturally sound** — the token definitions, component library, and animation infrastructure are all professional-grade. The main gap is **consistency of application**: many feature components bypass the semantic token system in favor of ad-hoc Tailwind colors, and the two portal sidebars evolved independently. The P0 and P1 items are low-risk, high-impact improvements that can be done in a single sprint. The P2/P3 items are structural improvements that will pay dividends as the app scales.
