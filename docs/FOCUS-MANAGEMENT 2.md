# Focus Management Implementation Guide

This document describes the comprehensive focus management system implemented for accessibility compliance.

## Overview

The focus management system ensures keyboard users and screen reader users can navigate the application effectively. All implementations comply with **WCAG 2.4.3 Focus Order (Level A)**.

## Components & Utilities

### 1. Core Hooks

#### `useFocusManagement`
Location: `lib/hooks/use-focus-management.ts`

Provides comprehensive focus management utilities:

```typescript
const { focusFirst, focusElement, returnFocus, getFocusableElements } = useFocusManagement({
  focusOnMount: true,           // Auto-focus on component mount
  initialFocusRef: ref,         // Specific element to focus
  returnFocusRef: buttonRef,    // Element to return focus to
  trapFocus: true,              // Trap focus within container
  containerRef: modalRef,       // Container for focus trap
})
```

**Use cases:**
- Forms that should focus the first field automatically
- Modals/dialogs that need focus trapping
- Components that need to return focus after closing

#### `useFormFocusManagement`
Location: `lib/hooks/use-focus-management.ts`

Specialized hook for form focus management:

```typescript
const { successMessageRef, firstFieldRef, focusSuccessMessage, focusFirstField } = useFormFocusManagement()

// Auto-focuses first field on mount
// Use refs for success messages and first input
```

**Features:**
- Automatically focuses the first form field on mount
- Provides refs for success/error messages
- Announces messages to screen readers

#### `useRouteChangeFocus`
Location: `lib/hooks/use-focus-management.ts`

Manages focus on route changes:

```typescript
useRouteChangeFocus({
  focusTarget: 'main',      // CSS selector for focus target
  announceChange: true,     // Announce route change to screen readers
})
```

### 2. Focus Trap Utilities

#### `createFocusTrap`
Location: `lib/utils/focus-trap.ts`

Low-level utility for creating focus traps:

```typescript
const cleanup = createFocusTrap(containerElement)
// ... modal is open ...
cleanup() // Returns focus to previous element
```

#### `FocusTrapManager`
Location: `lib/utils/focus-trap.ts`

Class-based API for managing focus traps:

```typescript
const manager = new FocusTrapManager(containerElement)
manager.activate()   // Start trapping focus
manager.deactivate() // Stop trapping and return focus
manager.focusFirst() // Focus first element
manager.focusLast()  // Focus last element
```

### 3. UI Components

#### `SkipLink` Components
Location: `components/ui/skip-link.tsx`

Provides keyboard shortcuts for navigation:

```tsx
import { SkipLinks, SkipToMainContent, SkipToNavigation } from '@/components/ui/skip-link'

// In layout
<SkipLinks>
  <SkipToMainContent />
  <SkipToNavigation />
</SkipLinks>
```

**Features:**
- Hidden by default, visible on keyboard focus
- Allows users to bypass navigation
- Smooth scrolling to target elements
- WCAG 2.4.1 Bypass Blocks compliance

#### `Modal` Component
Location: `components/ui/modal.tsx`

Accessible modal with built-in focus management:

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  closeOnEscape={true}
  closeOnBackdropClick={true}
>
  <p>Modal content here</p>
  <ModalFooter>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

**Features:**
- Automatic focus trap when open
- Returns focus to trigger element on close
- Escape key to close
- Backdrop click to close (configurable)
- Prevents body scroll when open
- Proper ARIA attributes

#### `AccessibleForm` Component
Location: `components/ui/accessible-form.tsx`

Form wrapper with automatic focus management:

```tsx
<AccessibleForm
  title="Leave Request Form"
  description="Submit a leave request for approval"
  onSubmit={handleSubmit}
>
  <FormField isFirst>
    <label>First Name</label>
    <Input name="firstName" />
  </FormField>

  {/* Other fields */}
</AccessibleForm>
```

**Features:**
- Auto-focuses first field on mount
- Screen reader announcements
- Success/error message handling

#### `SuccessMessage` & `ErrorMessage`
Location: `components/ui/accessible-form.tsx`

Message components with automatic focus:

```tsx
{success && (
  <SuccessMessage autoFocus>
    Your request was submitted successfully!
  </SuccessMessage>
)}

{error && (
  <ErrorMessage autoFocus>
    There was an error submitting your request.
  </ErrorMessage>
)}
```

**Features:**
- Automatically focuses on mount
- Proper ARIA live regions
- Screen reader announcements

#### `RouteChangeFocusManager`
Location: `components/ui/route-change-focus.tsx`

Global component for route change handling:

```tsx
// In root layout
<RouteChangeFocusManager />
```

**Features:**
- Focuses main content on route change
- Announces page changes to screen readers
- Smooth scroll to top

### 4. Enhanced Input Component

Location: `components/ui/input.tsx`

The Input component now supports auto-focus:

```tsx
<Input
  id="email"
  type="email"
  autoFocusFirst={true}  // Auto-focus this input
  error={!!errors.email}
  aria-required="true"
/>
```

## Implementation Checklist

### For Forms

- [ ] Wrap form in `AccessibleForm` component
- [ ] Add `isFirst` prop to first form field
- [ ] Use `SuccessMessage` for success feedback
- [ ] Use `ErrorMessage` for error feedback
- [ ] Ensure all inputs have proper labels
- [ ] Add `aria-required` to required fields
- [ ] Add `aria-invalid` to fields with errors
- [ ] Add `aria-describedby` for error messages

### For Modals/Dialogs

- [ ] Use `Modal` component with proper title
- [ ] Ensure modal has descriptive title
- [ ] Add description if needed
- [ ] Include close button or close mechanism
- [ ] Test Escape key functionality
- [ ] Test focus trap (Tab and Shift+Tab)
- [ ] Verify focus returns to trigger element

### For Page Layouts

- [ ] Add `id="main-content"` to main content area
- [ ] Add `id="navigation"` to navigation area
- [ ] Include `SkipLinks` in root layout
- [ ] Include `RouteChangeFocusManager` in root layout
- [ ] Ensure headings follow proper hierarchy (h1, h2, h3)

### For Route Changes

- [ ] Verify focus moves to main content
- [ ] Verify page title updates
- [ ] Verify screen reader announcement
- [ ] Test keyboard navigation after route change

## Testing Focus Management

### Keyboard Testing

1. **Tab Navigation:**
   - Press Tab to move forward through focusable elements
   - Press Shift+Tab to move backward
   - Verify focus order is logical
   - Verify focus indicators are visible

2. **Skip Links:**
   - Press Tab from top of page
   - Verify skip link appears
   - Press Enter on skip link
   - Verify focus moves to main content

3. **Modal Focus Trap:**
   - Open modal
   - Tab through all elements
   - Verify focus stays within modal
   - Press Escape to close
   - Verify focus returns to trigger element

4. **Form Focus:**
   - Navigate to form
   - Verify first field receives focus
   - Submit form successfully
   - Verify focus moves to success message

### Screen Reader Testing

1. **VoiceOver (macOS):**
   ```
   Cmd + F5    - Enable VoiceOver
   VO + Right  - Navigate forward
   VO + Left   - Navigate backward
   ```

2. **NVDA (Windows):**
   ```
   Ctrl + Alt + N  - Start NVDA
   Down Arrow      - Navigate forward
   Up Arrow        - Navigate backward
   ```

3. **Verify Announcements:**
   - Page title on route change
   - Form errors when they occur
   - Success messages after submission
   - Modal title when opened

## Browser Support

All focus management features are supported in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

## WCAG Compliance

This implementation satisfies the following WCAG 2.1 Level A criteria:

- **2.1.1 Keyboard** - All functionality available via keyboard
- **2.1.2 No Keyboard Trap** - Focus can always move away from components
- **2.4.1 Bypass Blocks** - Skip links allow bypassing navigation
- **2.4.3 Focus Order** - Focus order is logical and preserves meaning
- **2.4.7 Focus Visible** - Focus indicators are visible

## Common Patterns

### Pattern 1: Simple Form

```tsx
'use client'
import { AccessibleForm, FormField } from '@/components/ui/accessible-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ContactForm() {
  return (
    <AccessibleForm title="Contact Form" onSubmit={handleSubmit}>
      <FormField isFirst>
        <label htmlFor="name">Name</label>
        <Input id="name" name="name" required />
      </FormField>

      <FormField>
        <label htmlFor="email">Email</label>
        <Input id="email" name="email" type="email" required />
      </FormField>

      <Button type="submit">Submit</Button>
    </AccessibleForm>
  )
}
```

### Pattern 2: Confirmation Modal

```tsx
'use client'
import { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export function DeleteButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete</Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        description="This action cannot be undone."
      >
        <p>Are you sure you want to delete this item?</p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
```

### Pattern 3: Custom Focus Trap

```tsx
'use client'
import { useRef, useEffect } from 'react'
import { useFocusManagement } from '@/lib/hooks/use-focus-management'

export function CustomDialog({ isOpen, onClose, children }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusManagement({
    trapFocus: isOpen,
    containerRef: dialogRef,
    focusOnMount: true,
  })

  if (!isOpen) return null

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true">
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

## Troubleshooting

### Focus not returning after modal closes

**Problem:** Focus doesn't return to the button that opened the modal.

**Solution:** Ensure you're using the `Modal` component or `useFocusManagement` with `returnFocusRef`.

### First field not focusing on form load

**Problem:** Form loads but first field doesn't receive focus.

**Solution:** Add `autoFocusFirst` prop to the first `Input` or use `AccessibleForm` with `FormField isFirst`.

### Skip links not working

**Problem:** Skip link doesn't move focus to main content.

**Solution:** Ensure your main content has `id="main-content"`.

### Focus trap not working in modal

**Problem:** Tab key moves focus outside the modal.

**Solution:** Use the `Modal` component which has built-in focus trap, or ensure `useFocusManagement` has correct `containerRef`.

## Further Reading

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM: Keyboard Accessibility](https://webaim.org/articles/keyboard/)
- [WebAIM: Skip Navigation Links](https://webaim.org/techniques/skipnav/)
