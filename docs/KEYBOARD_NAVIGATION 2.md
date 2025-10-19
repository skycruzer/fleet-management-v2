# Keyboard Navigation Guide

**Fleet Management V2 - Accessibility Documentation**

This document describes the comprehensive keyboard navigation system implemented across the Fleet Management application to ensure WCAG 2.1 Level A compliance.

## Overview

All interactive elements in the application are fully keyboard accessible. Users can navigate the entire interface using only a keyboard, without requiring a mouse.

---

## Global Keyboard Standards

### Focus Indicators

All interactive elements have visible focus indicators:
- **Buttons**: Blue ring with 2px width and 2px offset
- **Links**: Similar blue ring on focus
- **Form inputs**: Blue ring with validation state colors (red for errors, green for success)
- **Interactive cards**: Gray ring on focus

Focus indicators use the following CSS pattern:
```css
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### Tab Navigation

- **Tab**: Move forward through interactive elements
- **Shift + Tab**: Move backward through interactive elements
- All elements maintain proper tab order following visual flow

---

## Component-Specific Keyboard Support

### 1. Buttons

**All buttons support:**
- `Enter` - Activate button
- `Space` - Activate button
- `Tab` / `Shift+Tab` - Navigate between buttons

**ARIA Attributes:**
- `aria-label`: Descriptive label for screen readers
- `aria-disabled`: Indicates disabled state
- `role="button"`: Explicit button role where needed

**Example:**
```tsx
<button
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
  aria-label="Submit form"
>
  Submit
</button>
```

---

### 2. Forms

**Keyboard Support:**
- `Tab` - Move to next field
- `Shift + Tab` - Move to previous field
- `Enter` - Submit form (when focused on submit button)
- `Escape` - Clear current field (custom implementation)

**Form Fields Include:**
- Text inputs with validation
- Textareas with character counters
- Select dropdowns with arrow key navigation
- Checkboxes with Space to toggle
- Date pickers with arrow keys

**ARIA Attributes:**
- `aria-required`: Marks required fields
- `aria-invalid`: Indicates validation errors
- `aria-describedby`: Links to error/help text
- `aria-label`: Provides accessible labels

**Example:**
```tsx
<Input
  id="title"
  aria-required="true"
  aria-describedby="title_error"
  aria-invalid={!!errors.title}
/>
```

---

### 3. Dialog/Modal Components

**Keyboard Support:**
- `Escape` - Close dialog
- `Tab` - Navigate within dialog (focus trapped)
- `Shift + Tab` - Navigate backward within dialog
- Auto-focus on first interactive element when opened
- Focus returns to trigger element when closed

**Implementation:**
- Uses `useFocusTrap` hook to prevent focus from leaving dialog
- Uses `useEscapeKey` hook for Escape key handling
- Implements proper ARIA dialog pattern

**Example Usage:**
```tsx
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogTitle>Dialog Title</DialogTitle>
    {/* Content here - focus is trapped */}
  </DialogContent>
</Dialog>
```

---

### 4. Dropdown Menus

**Keyboard Support:**
- `Enter` / `Space` - Open dropdown
- `Arrow Down` - Move to next item
- `Arrow Up` - Move to previous item
- `Enter` - Select current item
- `Escape` - Close dropdown
- `Home` - Jump to first item
- `End` - Jump to last item
- Type-ahead search (type to find items)

**Implementation:**
- Uses Radix UI dropdown primitive with built-in keyboard support
- Custom arrow key navigation via `useArrowKeyNavigation` hook

**Example Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger>Options</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 5. Pagination

**Keyboard Shortcuts:**
- `Arrow Left` or `H` - Previous page
- `Arrow Right` or `L` - Next page
- `Home` - First page
- `End` - Last page
- `1-9` - Jump to page 1-9 (if exists)

**Visual Indicator:**
A keyboard shortcut hint is displayed above pagination controls showing available shortcuts.

**ARIA Attributes:**
- `aria-label`: Descriptive labels for each button
- `aria-current="page"`: Indicates current page
- `aria-disabled`: Indicates disabled prev/next buttons

**Example:**
```tsx
<FeedbackPagination pagination={paginationData} />
// Automatically includes keyboard shortcuts
```

---

### 6. Popovers

**Keyboard Support:**
- `Enter` / `Space` - Open popover
- `Escape` - Close popover
- `Tab` - Navigate within popover
- Auto-focus on first interactive element

**Implementation:**
- Uses Radix UI Popover primitive
- Implements proper ARIA popover pattern

---

## Utility Hooks

### 1. `useKeyboardShortcuts`

Register global keyboard shortcuts for your component.

**Usage:**
```tsx
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-nav'

useKeyboardShortcuts([
  {
    key: 'k',
    ctrlKey: true,
    handler: () => openSearch(),
    description: 'Open search',
  },
  {
    key: 'Escape',
    handler: () => closeModal(),
    description: 'Close modal',
  },
])
```

**Parameters:**
- `key`: The key to listen for (case-insensitive)
- `ctrlKey`: (optional) Require Ctrl key
- `shiftKey`: (optional) Require Shift key
- `altKey`: (optional) Require Alt key
- `metaKey`: (optional) Require Meta (Cmd) key
- `handler`: Function to call when shortcut is triggered
- `description`: Human-readable description for documentation

---

### 2. `useEscapeKey`

Simple hook to handle Escape key presses.

**Usage:**
```tsx
import { useEscapeKey } from '@/lib/hooks/use-keyboard-nav'

useEscapeKey(() => {
  setIsOpen(false)
}, isOpen)
```

**Parameters:**
- `callback`: Function to call when Escape is pressed
- `enabled`: (optional) Whether the listener is active (default: true)

---

### 3. `useFocusTrap`

Trap focus within a container (essential for modals/dialogs).

**Usage:**
```tsx
import { useFocusTrap } from '@/lib/hooks/use-keyboard-nav'

const containerRef = useRef<HTMLDivElement>(null)
useFocusTrap(containerRef, isModalOpen)
```

**Parameters:**
- `containerRef`: Ref to the container element
- `isActive`: Whether focus trap is active

**Behavior:**
- Auto-focuses first interactive element when activated
- Tab cycles through focusable elements
- Shift+Tab cycles backward
- Focus cannot leave the container while active

---

### 4. `useArrowKeyNavigation`

Enable arrow key navigation for lists/menus.

**Usage:**
```tsx
import { useArrowKeyNavigation } from '@/lib/hooks/use-keyboard-nav'

const itemsRef = useRef<HTMLElement[]>([])

useArrowKeyNavigation(itemsRef, {
  orientation: 'vertical',
  loop: true,
  onSelect: (index) => handleSelect(index),
})
```

**Parameters:**
- `itemsRef`: Ref to array of focusable elements
- `options.orientation`: 'vertical' or 'horizontal' (default: 'vertical')
- `options.loop`: Whether to loop at start/end (default: true)
- `options.onSelect`: Callback when Enter/Space is pressed

---

## WCAG 2.1 Compliance

### Level A Requirements Met

✅ **2.1.1 Keyboard (Level A)**
- All functionality available via keyboard
- No keyboard traps (except in modals with Escape)

✅ **2.1.2 No Keyboard Trap (Level A)**
- Users can navigate away from all components using keyboard
- Modals can be closed with Escape key

✅ **2.4.3 Focus Order (Level A)**
- Focus order follows logical reading order
- Tab order matches visual layout

✅ **2.4.7 Focus Visible (Level AA)**
- All interactive elements have visible focus indicators
- Focus indicators are high contrast and clearly visible

✅ **3.2.1 On Focus (Level A)**
- Focus does not trigger unexpected changes
- No automatic form submissions on focus

✅ **4.1.2 Name, Role, Value (Level A)**
- All interactive elements have proper ARIA labels
- Roles, states, and properties are properly set

---

## Testing Keyboard Navigation

### Manual Testing Checklist

1. **Tab Navigation**
   - [ ] Can navigate to all interactive elements using Tab
   - [ ] Tab order follows logical visual flow
   - [ ] Focus indicators are visible on all elements

2. **Buttons**
   - [ ] All buttons activate with Enter and Space
   - [ ] Disabled buttons cannot be activated
   - [ ] Loading states prevent activation

3. **Forms**
   - [ ] Can navigate between fields with Tab
   - [ ] Can submit forms with Enter (from submit button)
   - [ ] Error messages are announced by screen readers

4. **Dialogs/Modals**
   - [ ] Escape key closes dialog
   - [ ] Focus is trapped within dialog
   - [ ] First element is auto-focused on open
   - [ ] Focus returns to trigger on close

5. **Dropdown Menus**
   - [ ] Arrow keys navigate through items
   - [ ] Enter/Space select items
   - [ ] Escape closes menu
   - [ ] Type-ahead search works

6. **Pagination**
   - [ ] Arrow keys navigate prev/next
   - [ ] Number keys jump to pages
   - [ ] Home/End keys work correctly

### Automated Testing

Use Playwright tests to verify keyboard navigation:

```typescript
// Example keyboard navigation test
test('should navigate pagination with keyboard', async ({ page }) => {
  await page.goto('/portal/feedback')

  // Test arrow key navigation
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/page=2/)

  // Test number key jump
  await page.keyboard.press('1')
  await expect(page).toHaveURL(/page=1/)

  // Test Home/End keys
  await page.keyboard.press('End')
  await expect(page.locator('[aria-current="page"]')).toContainText('13')
})
```

---

## Browser Support

Keyboard navigation is tested and supported in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

---

## Future Enhancements

### Planned Improvements

1. **Keyboard Shortcut Help Modal**
   - Press `?` to show all available shortcuts
   - Context-aware shortcuts based on current page

2. **Custom Keyboard Shortcuts**
   - Allow users to customize shortcuts
   - Vim-style navigation mode (j/k for up/down)

3. **Voice Control Integration**
   - Voice commands for common actions
   - Screen reader optimization

4. **Enhanced Focus Management**
   - Skip navigation links
   - Focus history for complex interactions

---

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN: Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

---

## Support

For keyboard navigation issues or accessibility concerns:
1. File an issue in the project repository
2. Tag with `accessibility` label
3. Include browser and assistive technology details

---

**Last Updated:** October 19, 2025
**Maintained By:** Fleet Management Development Team
**WCAG Compliance:** Level A (fully compliant)
