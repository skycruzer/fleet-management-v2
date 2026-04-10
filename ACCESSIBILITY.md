# Accessibility Guide

**Fleet Management V2 - Accessibility Standards & Best Practices**

## Overview

This application follows WCAG 2.1 Level AA accessibility standards to ensure all users, including those with disabilities, can effectively use the system.

## Core Accessibility Features

### 1. Skip Navigation

**What**: Allows keyboard users to skip repetitive navigation
**Where**: Dashboard and Portal layouts
**Usage**: Press Tab on page load to reveal "Skip to main content" link

```tsx
import { SkipNav } from '@/components/accessibility/skip-nav'

// In layout
<SkipNav />
<main id="main-content">...</main>
```

### 2. Screen Reader Announcements

**What**: Announces dynamic content changes to assistive technology
**Where**: Form submissions, data updates, error messages
**Usage**: Import and use the announce function

```tsx
import { announce } from '@/components/accessibility/announcer'

// After successful action
announce('Pilot created successfully', 'polite')

// For urgent messages
announce('Error: Failed to save', 'assertive')
```

### 3. Focus Management

**What**: Traps and manages keyboard focus in modals/dialogs
**Where**: Modal dialogs, dropdown menus, complex components
**Usage**: Wrap modal content with FocusTrap

```tsx
import { FocusTrap } from '@/components/accessibility/focus-trap'
;<FocusTrap enabled={isOpen}>
  <Dialog>...</Dialog>
</FocusTrap>
```

### 4. Keyboard Navigation

**All interactive elements must be keyboard accessible:**

- Tab: Navigate forward
- Shift + Tab: Navigate backward
- Enter/Space: Activate buttons/links
- Escape: Close modals/dropdowns
- Arrow keys: Navigate within menus/lists

### 5. ARIA Labels

**Required for all icons and icon-only buttons:**

```tsx
// ✅ Good
<button aria-label="Delete pilot">
  <Trash className="h-4 w-4" aria-hidden="true" />
</button>

// ❌ Bad
<button>
  <Trash className="h-4 w-4" />
</button>
```

### 6. Semantic HTML

**Use proper HTML elements:**

- `<button>` for actions
- `<a>` for navigation
- `<nav>` for navigation sections
- `<main>` for main content
- `<article>` for independent content
- `<section>` for grouped content
- Proper heading hierarchy (h1 → h2 → h3)

## Component Accessibility Standards

### Buttons

```tsx
// Primary actions
<Button>Save Changes</Button>

// Icon buttons (must have aria-label)
<Button aria-label="Close dialog">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>

// Loading state
<Button disabled aria-busy="true">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
  Saving...
</Button>
```

### Forms

```tsx
// Always associate labels with inputs
<Label htmlFor="firstName">First Name</Label>
<Input id="firstName" required aria-required="true" />

// Error messages with aria-describedby
<Input
  id="email"
  aria-invalid={errors.email ? 'true' : 'false'}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" className="text-destructive text-sm">
    {errors.email.message}
  </p>
)}
```

### Navigation

```tsx
// Sidebar navigation
<nav id="main-navigation" aria-label="Main navigation">
  <NavLink href="/dashboard" aria-current={isActive ? 'page' : undefined}>
    Dashboard
  </NavLink>
</nav>

// Breadcrumbs
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-current="page">Current Page</li>
  </ol>
</nav>
```

### Tables

```tsx
// Add captions and scope attributes
<table>
  <caption className="sr-only">List of pilots</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Role</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">John Doe</th>
      <td>Captain</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>
```

### Modals/Dialogs

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
    <DialogTitle id="dialog-title">Confirm Delete</DialogTitle>
    <DialogDescription id="dialog-description">This action cannot be undone.</DialogDescription>
  </DialogContent>
</Dialog>
```

### Loading States

```tsx
// Loading indicator
<div role="status" aria-live="polite">
  <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
  <span className="sr-only">Loading pilots...</span>
</div>

// Empty state
<div role="status">
  <p>No pilots found</p>
</div>
```

## Color and Contrast

### Requirements

- Normal text: 4.5:1 contrast ratio minimum
- Large text (18pt+): 3:1 contrast ratio minimum
- UI components: 3:1 contrast ratio minimum

### Color Usage

- Never rely on color alone to convey information
- Always provide text labels or patterns
- Use icons alongside color-coded status

```tsx
// ✅ Good - Icon + Color + Text
<Badge className="bg-red-100 text-red-800">
  <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
  Expired
</Badge>

// ❌ Bad - Color only
<div className="bg-red-500" />
```

## Focus Indicators

All interactive elements must have visible focus indicators:

```css
/* Custom focus styles in globals.css */
button:focus-visible,
a:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

## Testing Checklist

### Keyboard Navigation

- [ ] All interactive elements reachable via Tab
- [ ] Tab order is logical
- [ ] Focus visible on all elements
- [ ] Escape closes modals/dropdowns
- [ ] Enter/Space activates buttons

### Screen Reader

- [ ] Page title announced on navigation
- [ ] Headings properly structured (h1 → h2 → h3)
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Dynamic content changes announced
- [ ] Images have alt text

### Visual

- [ ] Text readable at 200% zoom
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] No information conveyed by color alone

### Tools

- **Chrome DevTools**: Lighthouse accessibility audit
- **axe DevTools**: Browser extension for automated testing
- **NVDA/JAWS**: Screen reader testing (Windows)
- **VoiceOver**: Screen reader testing (macOS/iOS)
- **WAVE**: Web accessibility evaluation tool

## Common Patterns

### Loading Button

```tsx
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Icon-only Button

```tsx
<Button variant="ghost" size="icon" aria-label="Edit pilot">
  <Pencil className="h-4 w-4" aria-hidden="true" />
</Button>
```

### Status Indicator

```tsx
<div className="flex items-center gap-2">
  <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
  <span>Expired</span>
  <span className="sr-only">Certification status:</span>
</div>
```

### Search Input

```tsx
<div role="search">
  <Label htmlFor="search" className="sr-only">
    Search pilots
  </Label>
  <Input id="search" type="search" placeholder="Search..." aria-label="Search pilots" />
</div>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Reporting Issues

Found an accessibility issue? Create a GitHub issue with:

- Description of the issue
- Affected component/page
- Expected behavior
- WCAG success criterion violated (if known)

---

**Last Updated**: October 21, 2025
**Maintainer**: Fleet Management Team
**Version**: 2.0.0
