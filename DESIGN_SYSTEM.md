# Fleet Management V2 - Design System

**Author**: Maurice Rondeau
**Version**: 1.0.0
**Last Updated**: January 2026

A comprehensive design system built on 2025/2026 research-backed best practices from Vercel, Linear, and Google Material 3.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Design Tokens](#design-tokens)
3. [Components](#components)
4. [Patterns](#patterns)
5. [Accessibility](#accessibility)

---

## Design Principles

### Linear Design Philosophy

Modern Linear design = "bolder with more individuality":

- Near-monochrome black/white base with soft grays (#121212 not pure black)
- Fewer but bolder accent colors (single primary accent)
- Frosted glass/glassmorphism for depth and visual hierarchy
- Keyboard-first interactions with comprehensive shortcuts

### Vercel Web Interface Guidelines

Mandatory principles:

- **Keyboard works everywhere** - All flows are keyboard-operable (WAI-ARIA patterns)
- **Clear focus states** - Visible focus rings with `:focus-visible`
- **Match visual and hit targets** - Minimum 24px, 44px on mobile
- **Design for all states** - Empty, sparse, dense, and error
- **Tabular numbers** - `font-variant-numeric: tabular-nums` for data
- **Redundant status cues** - Never rely on color alone

---

## Design Tokens

### Color Palette

Located in `app/globals.css` under the `@theme` block.

| Token           | Value     | Usage              |
| --------------- | --------- | ------------------ |
| `--primary`     | `#6366f1` | Main actions, CTAs |
| `--success`     | `#10b981` | Positive states    |
| `--warning`     | `#f59e0b` | Attention needed   |
| `--destructive` | `#ef4444` | Errors, danger     |
| `--accent`      | `#6366f1` | Highlights         |

### Typography Scale

8px base with 1.25 ratio:

```css
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem; /* 36px */
```

### Line Heights

```css
--line-height-none: 1;
--line-height-tight: 1.25;
--line-height-snug: 1.375;
--line-height-normal: 1.5; /* Default for body */
--line-height-relaxed: 1.625;
--line-height-loose: 2;
```

### Letter Spacing

```css
--letter-spacing-tighter: -0.05em; /* Display headings */
--letter-spacing-tight: -0.025em; /* Headings */
--letter-spacing-normal: 0em; /* Body text */
--letter-spacing-wide: 0.025em; /* Subtitles */
--letter-spacing-wider: 0.05em; /* Labels */
--letter-spacing-widest: 0.1em; /* ALL CAPS */
```

### Spacing Scale

Based on 4px grid:

```css
--spacing-px: 1px;
--spacing-0-5: 0.125rem; /* 2px */
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
```

### Shadow System

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-elevated: 0 12px 28px rgba(0, 0, 0, 0.12), 0 8px 10px rgba(0, 0, 0, 0.08);
--shadow-interactive-hover: 0 16px 32px rgba(0, 0, 0, 0.14);
```

### Glassmorphism (2026 Trend)

```css
--glass-bg: rgba(255, 255, 255, 0.8);
--glass-bg-dark: rgba(18, 18, 18, 0.85);
--glass-border: rgba(255, 255, 255, 0.2);
--glass-border-dark: rgba(255, 255, 255, 0.1);
--glass-blur: 12px;
```

### Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-header: 30;
--z-sidebar: 40;
--z-overlay: 50;
--z-modal: 60;
--z-popover: 70;
--z-tooltip: 80;
--z-toast: 90;
```

---

## Components

### Button (`components/ui/button.tsx`)

Enhanced button with multiple variants and states.

**Variants:**

| Variant       | Usage                           |
| ------------- | ------------------------------- |
| `default`     | Primary actions                 |
| `destructive` | Delete, danger actions          |
| `success`     | Confirmations, positive actions |
| `warning`     | Caution actions                 |
| `outline`     | Secondary actions               |
| `secondary`   | Less prominent actions          |
| `ghost`       | Tertiary actions                |
| `link`        | Inline text actions             |
| `soft`        | Subtle accent actions           |

**Sizes:**

| Size      | Height  | Usage                |
| --------- | ------- | -------------------- |
| `sm`      | 32px    | Compact UI           |
| `default` | 36px    | Standard             |
| `lg`      | 44px    | Touch targets, CTAs  |
| `icon`    | 36x36px | Icon-only buttons    |
| `icon-sm` | 32x32px | Compact icons        |
| `icon-lg` | 44x44px | Touch-friendly icons |

**Props:**

```tsx
interface ButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'soft'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  loading?: boolean
  loadingText?: string
  asChild?: boolean
}
```

**Usage:**

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Save Changes</Button>
<Button variant="destructive">Delete</Button>
<Button variant="success">Approve</Button>
<Button variant="warning">Caution</Button>
<Button loading loadingText="Saving...">Submit</Button>
```

### Card (`components/ui/card.tsx`)

Modern card with glass and elevated variants.

**Variants:**

| Variant    | Description                      |
| ---------- | -------------------------------- |
| `default`  | Clean border with subtle shadow  |
| `glass`    | Glassmorphism with backdrop-blur |
| `elevated` | Stronger shadow for hierarchy    |

**Props:**

```tsx
interface CardProps {
  variant?: 'default' | 'glass' | 'elevated'
  interactive?: boolean // Adds hover lift effect
}
```

**Usage:**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card variant="default">
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

<Card variant="glass" interactive>
  <CardContent>Clickable glass card</CardContent>
</Card>
```

### Command Palette (`components/command-palette.tsx`)

Global navigation with Cmd+K keyboard shortcut.

**Features:**

- `Cmd+K` / `Ctrl+K` global trigger
- Fuzzy search across navigation
- Recent items history (localStorage)
- Keyboard navigation (↑↓, Enter, Escape)
- WCAG 2.2 accessible

**Usage:**

```tsx
import { CommandPalette } from '@/components/command-palette'

// In layout or app shell
;<CommandPalette />

// Programmatic control
import { useCommandPalette } from '@/components/command-palette'

const { open, setOpen, toggle } = useCommandPalette()
```

**Keyboard Shortcuts:**

| Key                | Action         |
| ------------------ | -------------- |
| `Cmd+K` / `Ctrl+K` | Open palette   |
| `↑` `↓`            | Navigate items |
| `Enter`            | Select item    |
| `Escape`           | Close palette  |

---

## Patterns

### Inline Form Validation

Research: **22% increase** in form completion rates (Baymard Institute).

**Hook:** `lib/hooks/use-inline-validation.tsx`

**Best Practices:**

1. Validate on **blur** (not on change) to avoid premature errors
2. Remove error immediately when user corrects input
3. Show success checkmark when field validates
4. Debounce validation 500ms after user stops typing

**Usage:**

```tsx
import { useInlineValidation, FieldError } from '@/lib/hooks/use-inline-validation'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Must be at least 8 characters'),
})

function LoginForm() {
  const { values, errors, fields, getFieldProps, validateForm } = useInlineValidation({
    schema,
    initialValues: { email: '', password: '' },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await validateForm()) {
      // Submit form
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input {...getFieldProps('email')} placeholder="Email" />
      <FieldError fieldName="email" error={errors.email} />

      <input {...getFieldProps('password')} type="password" placeholder="Password" />
      <FieldError fieldName="password" error={errors.password} />

      <Button type="submit">Login</Button>
    </form>
  )
}
```

### Bento Grid Layout

Modern dashboards use asymmetric "bento box" layouts:

```
┌─────────────────────┬────────┬────────┐
│   Hero Metric       │ Metric │ Metric │
│   (col-span-2)      │  (1)   │  (1)   │
├────────┬────────────┴────────┴────────┤
│ Quick  │     Timeline/Calendar View   │
│Actions │        (col-span-3)          │
├────────┴──────────────────────────────┤
│        Data Table (full-width)        │
└───────────────────────────────────────┘
```

**Implementation:**

```tsx
<div className="grid grid-cols-4 gap-4">
  <Card className="col-span-2">Hero Metric</Card>
  <Card>Small Metric 1</Card>
  <Card>Small Metric 2</Card>
  <Card className="row-span-2">Quick Actions</Card>
  <Card className="col-span-3">Timeline View</Card>
  <Card className="col-span-4">Data Table</Card>
</div>
```

### Loading States

**When to use:**

| Wait Time   | Pattern            |
| ----------- | ------------------ |
| < 300ms     | No indicator       |
| 300ms - 10s | Skeleton screen    |
| > 10s       | Progress indicator |

**Skeleton Animation:**

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-raised) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## Accessibility

### WCAG 2.2 AA Compliance

**Contrast Requirements:**

| Element            | Minimum Ratio |
| ------------------ | ------------- |
| Normal text        | 4.5:1         |
| Large text (18px+) | 3:1           |
| UI components      | 3:1           |

**Target Sizes:**

| Device  | Minimum | Recommended |
| ------- | ------- | ----------- |
| Desktop | 24×24px | 32×32px     |
| Mobile  | 44×44px | 48×48px     |

### Focus Management

All interactive elements have visible focus states using `:focus-visible`:

```css
.button {
  outline: none;
  focus-visible: ring-[3px];
  focus-visible: ring-accent/20;
}
```

### Screen Reader Support

- All images have `alt` text
- Form inputs have associated `<label>`
- Use `aria-describedby` for error messages
- Decorative images use `alt=""`

### Motion Preferences

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Animation Timing

| Animation Type   | Duration  | Easing        |
| ---------------- | --------- | ------------- |
| Button states    | 150ms     | ease-out      |
| Form feedback    | 200-300ms | ease-in-out   |
| Page transitions | 300-400ms | ease-out      |
| Modal open/close | 200ms     | ease-out      |
| Skeleton shimmer | 1500ms    | linear (loop) |

---

## File Structure

```
components/
├── ui/
│   ├── button.tsx         # Button component with variants
│   ├── card.tsx           # Card with glass/elevated variants
│   ├── command.tsx        # Command primitives
│   └── dialog.tsx         # Dialog/modal component
├── command-palette.tsx    # Global Cmd+K navigation
└── ...

lib/
├── hooks/
│   └── use-inline-validation.tsx  # Form validation hook
└── utils.ts               # cn() and utility functions

app/
└── globals.css            # Design tokens and base styles
```

---

## Contributing

When adding new components:

1. Follow the token-based approach for colors, spacing, and typography
2. Ensure WCAG 2.2 AA compliance
3. Add keyboard support for all interactive elements
4. Test in both light and dark modes
5. Document props and usage examples

---

**References:**

- [Vercel Design Guidelines](https://vercel.com/design/guidelines)
- [Linear Design - LogRocket](https://blog.logrocket.com/ux-design/linear-design/)
- [Baymard Institute - Form Validation](https://baymard.com/blog/inline-form-validation)
- [W3C WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/)
