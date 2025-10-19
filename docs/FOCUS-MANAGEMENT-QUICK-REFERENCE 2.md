# Focus Management - Quick Reference

Quick reference for implementing accessible focus management in the application.

## When to Use What

| Scenario | Component/Hook | Import |
|----------|---------------|---------|
| Modal/Dialog | `<Modal>` | `@/components/ui/modal` |
| Form auto-focus | `autoFocusFirst` prop on `<Input>` | `@/components/ui/input` |
| Success message | `<SuccessMessage>` | `@/components/ui/accessible-form` |
| Error message | `<ErrorMessage>` | `@/components/ui/accessible-form` |
| Custom focus trap | `useFocusManagement` | `@/lib/hooks/use-focus-management` |
| Skip navigation | `<SkipToMainContent>` | `@/components/ui/skip-link` |

## Common Patterns

### Pattern 1: Modal with Focus Management

```tsx
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Confirm Deletion"
      description="This action cannot be undone."
    >
      <p>Are you sure you want to delete this item?</p>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Delete</Button>
      </ModalFooter>
    </Modal>
  )
}
```

### Pattern 2: Form with Auto-Focus

```tsx
import { Input } from '@/components/ui/input'
import { SuccessMessage, ErrorMessage } from '@/components/ui/accessible-form'

export function ContactForm() {
  return (
    <form onSubmit={handleSubmit}>
      {/* Error message */}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Success message */}
      {success && <SuccessMessage>Form submitted!</SuccessMessage>}

      {/* First field auto-focuses */}
      <Input
        autoFocusFirst={true}
        name="name"
        placeholder="Your name"
      />

      <Input
        name="email"
        type="email"
        placeholder="Your email"
      />

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Pattern 3: Custom Focus Trap

```tsx
import { useRef } from 'react'
import { useFocusManagement } from '@/lib/hooks/use-focus-management'

export function CustomDialog({ isOpen, children }) {
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
    </div>
  )
}
```

### Pattern 4: Layout with Skip Links

```tsx
import { SkipToMainContent } from '@/components/ui/skip-link'

export default function Layout({ children }) {
  return (
    <>
      <SkipToMainContent />
      <nav id="navigation">{/* Navigation */}</nav>
      <main id="main-content">{children}</main>
    </>
  )
}
```

## Component Props Quick Reference

### Modal

```tsx
<Modal
  open={boolean}                    // Required: Is modal open?
  onClose={() => void}              // Required: Close handler
  title={string}                    // Required: Modal title
  description={string}              // Optional: Description
  size={'sm'|'md'|'lg'|'xl'|'full'} // Optional: Size
  showCloseButton={boolean}         // Optional: Show X button
  closeOnBackdropClick={boolean}    // Optional: Close on backdrop
  closeOnEscape={boolean}           // Optional: Close on Escape
/>
```

### Input (Auto-Focus)

```tsx
<Input
  autoFocusFirst={boolean}  // Auto-focus this input
  error={boolean}           // Show error state
  success={boolean}         // Show success state
  // ...other props
/>
```

### SuccessMessage / ErrorMessage

```tsx
<SuccessMessage autoFocus={boolean}>
  {children}
</SuccessMessage>

<ErrorMessage autoFocus={boolean}>
  {children}
</ErrorMessage>
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move focus forward |
| Shift + Tab | Move focus backward |
| Escape | Close modal/dialog |
| Enter | Activate skip link |

## Checklist for New Features

### Adding a Modal
- [ ] Use `<Modal>` component
- [ ] Provide descriptive `title`
- [ ] Add `description` if needed
- [ ] Include close mechanism (button or backdrop)
- [ ] Test Escape key
- [ ] Test focus return to trigger element

### Adding a Form
- [ ] Add `autoFocusFirst` to first input
- [ ] Use `<SuccessMessage>` for success feedback
- [ ] Use `<ErrorMessage>` for errors
- [ ] Ensure all inputs have labels
- [ ] Add `aria-required` to required fields
- [ ] Add `aria-invalid` to error fields

### Adding a Page
- [ ] Wrap main content in `<main id="main-content">`
- [ ] Add navigation with `id="navigation"`
- [ ] Test skip links work
- [ ] Test route change focus
- [ ] Verify page title updates

## Testing Commands

### Keyboard Testing
1. Tab from top of page
2. Verify skip link appears
3. Press Enter on skip link
4. Verify focus moves to main content

### Screen Reader Testing (macOS)
```bash
# Enable VoiceOver
Cmd + F5

# Navigate
VO + Right Arrow  # Forward
VO + Left Arrow   # Backward
```

### Screen Reader Testing (Windows)
```bash
# Start NVDA
Ctrl + Alt + N

# Navigate
Down Arrow  # Forward
Up Arrow    # Backward
```

## Common Issues & Solutions

### Issue: Focus not returning after modal closes
**Solution**: Use the `<Modal>` component (has built-in return focus)

### Issue: First field not auto-focusing
**Solution**: Add `autoFocusFirst={true}` to the first `<Input>`

### Issue: Skip links not working
**Solution**: Ensure target has correct `id` (e.g., `id="main-content"`)

### Issue: Focus trapped in wrong container
**Solution**: Check `containerRef` in `useFocusManagement`

## Browser DevTools

### Check Focus in DevTools
1. Open DevTools (F12)
2. Console: `document.activeElement`
3. View currently focused element

### Check ARIA Attributes
1. Open DevTools
2. Elements tab
3. Select element
4. View Accessibility panel

## Resources

- Full Documentation: `/docs/FOCUS-MANAGEMENT.md`
- Hooks README: `/lib/hooks/README.md`
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Practices: https://www.w3.org/WAI/ARIA/apg/

---

**Need Help?** Check `/docs/FOCUS-MANAGEMENT.md` for detailed examples and troubleshooting.
