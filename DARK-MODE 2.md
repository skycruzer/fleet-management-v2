# Dark Mode Implementation Guide

**Fleet Management V2 - Comprehensive Dark Mode Support**

---

## Overview

The application includes a fully functional dark mode system with automatic theme detection and manual theme switching.

**Features:**
- 🌙 Dark mode with optimized color palette
- ☀️ Light mode (default)
- 🖥️ System theme detection (respects OS preference)
- 🎨 Smooth theme transitions
- 📱 Mobile and desktop support

---

## How It Works

### Theme Provider

The app uses `next-themes` for theme management, configured in `/app/layout.tsx`:

```tsx
<ThemeProvider
  attribute="class"           // Uses .dark class on <html> element
  defaultTheme="system"       // Respects OS preference by default
  enableSystem                // Allows system theme detection
  disableTransitionOnChange   // Prevents flash during theme switch
>
```

### Color System

Colors are defined using CSS custom properties in `/app/globals.css`:

**Light Mode (Default)**:
```css
@theme {
  --color-background: #ffffff;
  --color-foreground: #020617;
  --color-card: #ffffff;
  --color-border: #e2e8f0;
  --color-muted: #f1f5f9;
  /* ... etc */
}
```

**Dark Mode**:
```css
.dark {
  --color-background: #020617;
  --color-foreground: #f8fafc;
  --color-card: #0f172a;
  --color-border: #1e293b;
  --color-muted: #1e293b;
  /* ... etc */
}
```

### Theme Toggle Component

Location: `/components/theme-toggle.tsx`

Provides a dropdown menu with three options:
- ☀️ **Light** - Force light theme
- 🌙 **Dark** - Force dark theme
- 🖥️ **System** - Follow OS preference

**Placement**:
- Desktop: Top-right corner of dashboard header
- Mobile: Top-right corner of mobile header (next to menu button)

---

## Color Palette

### Light Mode
| Color | Value | Usage |
|-------|-------|-------|
| Background | `#ffffff` | Page background |
| Foreground | `#020617` | Text color |
| Card | `#ffffff` | Card backgrounds |
| Border | `#e2e8f0` | Borders and dividers |
| Muted | `#f1f5f9` | Muted backgrounds |
| Primary | `#0ea5e9` | Primary actions |

### Dark Mode
| Color | Value | Usage |
|-------|-------|-------|
| Background | `#020617` | Page background |
| Foreground | `#f8fafc` | Text color |
| Card | `#0f172a` | Card backgrounds |
| Border | `#1e293b` | Borders and dividers |
| Muted | `#1e293b` | Muted backgrounds |
| Primary | `#38bdf8` | Primary actions (lighter for contrast) |

### Adjusted Colors for Dark Mode
- Primary: `#0ea5e9` → `#38bdf8` (lighter blue for better contrast)
- Accent: `#8b5cf6` → `#a78bfa` (lighter purple)
- Destructive: `#ef4444` → `#f87171` (lighter red)
- Success: `#22c55e` → `#4ade80` (lighter green)
- Warning: `#f59e0b` → `#fbbf24` (lighter yellow)

---

## Using Dark Mode in Components

### With Tailwind Classes

Most components automatically support dark mode through semantic color classes:

```tsx
// ✅ Automatic dark mode support
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    <p className="text-muted-foreground">Muted text</p>
  </Card>
</div>
```

### Conditional Dark Mode Styles

For custom dark mode styles, use Tailwind's `dark:` prefix:

```tsx
// Custom dark mode styles
<div className="bg-white dark:bg-slate-900">
  <p className="text-gray-900 dark:text-gray-100">
    This text changes color in dark mode
  </p>
</div>
```

### Programmatic Theme Detection

Access the current theme in client components:

```tsx
'use client'

import { useTheme } from 'next-themes'

export function MyComponent() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>System preference: {systemTheme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}
```

---

## Best Practices

### 1. Use Semantic Colors

Always use semantic color classes instead of hardcoded colors:

```tsx
// ✅ Good - Semantic colors adapt to theme
<div className="bg-card text-card-foreground border border-border">

// ❌ Bad - Hardcoded colors don't adapt
<div className="bg-white text-black border border-gray-200">
```

### 2. Test Both Themes

Always test your components in both light and dark modes:

1. Open DevTools
2. Click Theme Toggle in header
3. Switch between Light/Dark/System
4. Verify all colors, contrasts, and readability

### 3. Color Contrast

Ensure sufficient color contrast in both themes for accessibility:

- **WCAG AA**: Minimum contrast ratio of 4.5:1 for normal text
- **WCAG AAA**: Minimum contrast ratio of 7:1 for normal text

Use browser DevTools to check contrast ratios.

### 4. Avoid Theme Flash

The app is configured to prevent theme flash on page load:

- `suppressHydrationWarning` on `<html>` tag
- `disableTransitionOnChange` in ThemeProvider
- CSS variables load before first paint

---

## Troubleshooting

### Theme Not Changing

**Issue**: Theme toggle doesn't change colors

**Solutions**:
1. Verify CSS variables are defined in `globals.css`
2. Check that `.dark` class selector exists
3. Ensure components use semantic color classes (e.g., `bg-background`)
4. Clear browser cache and hard refresh

### Flash of Wrong Theme

**Issue**: Brief flash of light theme before dark theme loads

**Solutions**:
1. Verify `suppressHydrationWarning` on `<html>` tag
2. Ensure ThemeProvider wraps entire app
3. Check that `disableTransitionOnChange` is set
4. Verify theme cookie is being set correctly

### Colors Look Wrong in Dark Mode

**Issue**: Some colors don't look right in dark mode

**Solutions**:
1. Review color contrast ratios
2. Adjust CSS variables in `.dark` selector
3. Use Tailwind's `dark:` prefix for custom overrides
4. Test with actual users for feedback

### Theme Not Persisting

**Issue**: Theme resets on page refresh

**Solutions**:
1. Check browser allows cookies (theme saved in cookies)
2. Verify `next-themes` is properly installed
3. Clear browser cache and try again
4. Check Network tab for theme cookie

---

## Component Support

All components automatically support dark mode:

**UI Components**:
- ✅ Button, Card, Input, Alert, Badge
- ✅ Dialog, Dropdown, Popover, Toast
- ✅ Table, DataTable, Empty States
- ✅ Navigation, Breadcrumbs, Skip Links

**Dashboard Components**:
- ✅ Pilot cards, tables, forms
- ✅ Certification cards, tables, status badges
- ✅ Leave request cards, approval forms
- ✅ Analytics charts (may need custom dark mode support)
- ✅ Admin settings pages

**Portal Components**:
- ✅ Pilot dashboard, flight cards
- ✅ Certification overview, expiry alerts
- ✅ Leave request submission forms

---

## Testing Checklist

- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] System theme detection works
- [ ] Theme persists across page refreshes
- [ ] No flash of wrong theme on load
- [ ] All text is readable in both themes
- [ ] Color contrast meets WCAG AA standards
- [ ] Theme toggle works on desktop
- [ ] Theme toggle works on mobile
- [ ] Charts/graphs support dark mode (if applicable)
- [ ] Form inputs are clearly visible in both themes
- [ ] Error states are visible in both themes
- [ ] Success states are visible in both themes
- [ ] Warning states are visible in both themes

---

## Future Enhancements

Potential improvements for dark mode:

1. **Custom Color Schemes**: Allow users to customize dark mode colors
2. **Auto Dark Mode**: Automatically switch based on time of day
3. **Contrast Mode**: High-contrast mode for accessibility
4. **Dark Mode Analytics**: Track theme preference usage
5. **Per-Page Themes**: Allow different themes for different sections

---

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Maintainer**: Maurice (Skycruzer)
