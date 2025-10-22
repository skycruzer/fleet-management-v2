# Confirmation Dialogs Implementation Guide

**Fleet Management V2 - Destructive Action Confirmations**

---

## Overview

The application includes a comprehensive confirmation dialog system for destructive actions, replacing native browser `confirm()` dialogs with accessible, branded confirmation UI.

**Features:**
- ⚠️ Clear warning for destructive actions
- ✅ Accessible with keyboard support
- 🎨 Consistent design matching app theme
- 🌙 Dark mode support
- 📱 Mobile responsive
- ⌨️ Escape key to cancel, Enter to confirm

---

## Components

### AlertDialog Component

Location: `/components/ui/alert-dialog.tsx`

Low-level primitive built on Radix UI AlertDialog:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
```

**Features**:
- Modal overlay with backdrop
- Focus trap
- Escape key support
- ARIA attributes for accessibility
- Smooth animations

### ConfirmDialog Component

Location: `/components/ui/confirm-dialog.tsx`

High-level wrapper for easy confirmation dialogs:

**Option 1: Component-based** (with trigger button):

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

<ConfirmDialog
  trigger={<Button variant="destructive">Delete</Button>}
  title="Delete Pilot"
  description="Are you sure? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="destructive"
  onConfirm={async () => {
    await deletePilot()
  }}
/>
```

**Option 2: Hook-based** (programmatic):

```tsx
import { useConfirm } from '@/components/ui/confirm-dialog'

function MyComponent() {
  const { confirm, ConfirmDialog } = useConfirm()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Pilot',
      description: 'Are you sure? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    })

    if (confirmed) {
      await deletePilot()
    }
  }

  return (
    <div>
      <Button onClick={handleDelete}>Delete</Button>
      <ConfirmDialog />
    </div>
  )
}
```

---

## When to Use Confirmation Dialogs

Use confirmation dialogs for **destructive actions** that:
- ✅ Delete data permanently
- ✅ Cannot be undone
- ✅ Have significant consequences
- ✅ Affect other related data

**Examples**:
- Deleting a pilot (also deletes certifications and leave requests)
- Denying a leave request
- Canceling a submitted request
- Removing a certification

**Don't use for**:
- ❌ Saving data (use success toast instead)
- ❌ Navigating away from forms (use beforeunload event)
- ❌ Minor actions that can be easily undone

---

## Usage Patterns

### Pattern 1: Delete Operations

```tsx
const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Pilot',
    description:
      'This will permanently delete the pilot record and all associated certifications and leave requests. This action cannot be undone.',
    confirmText: 'Delete Pilot',
    cancelText: 'Cancel',
    variant: 'destructive',
  })

  if (!confirmed) return

  try {
    await fetch(`/api/pilots/${id}`, { method: 'DELETE' })
    router.push('/dashboard/pilots')
  } catch (error) {
    // Handle error
  }
}
```

### Pattern 2: Deny/Reject Actions

```tsx
const handleDeny = async (requestId: string) => {
  const confirmed = await confirm({
    title: 'Deny Leave Request',
    description: 'Are you sure you want to deny this leave request? The pilot will be notified.',
    confirmText: 'Deny Request',
    cancelText: 'Cancel',
    variant: 'destructive',
  })

  if (!confirmed) return

  try {
    await fetch(`/api/leave-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'DENIED' }),
    })
  } catch (error) {
    // Handle error
  }
}
```

### Pattern 3: Cancel/Withdraw Actions

```tsx
const handleCancel = async () => {
  const confirmed = await confirm({
    title: 'Cancel Request',
    description: 'Are you sure you want to cancel this request?',
    confirmText: 'Yes, Cancel',
    cancelText: 'Keep Request',
    variant: 'default', // Less alarming for user-initiated cancellations
  })

  if (!confirmed) return

  // Proceed with cancellation
}
```

---

## Component vs Hook: When to Use Which?

### Use Component-Based (`<ConfirmDialog>`)

When you have a **trigger button** and want inline declaration:

```tsx
<ConfirmDialog
  trigger={<Button>Delete</Button>}
  title="Delete Item"
  description="Are you sure?"
  onConfirm={handleDelete}
/>
```

**Pros**:
- Declarative
- Clear trigger-action relationship
- Less state management

**Cons**:
- Less flexible for complex flows
- Requires trigger element

### Use Hook-Based (`useConfirm()`)

When you need **programmatic control** or complex logic:

```tsx
const { confirm, ConfirmDialog } = useConfirm()

const handleAction = async () => {
  // Complex logic before confirmation
  if (someCondition) {
    const confirmed = await confirm({...})
    if (confirmed) {
      // More logic
    }
  }
}
```

**Pros**:
- Flexible placement in logic
- Can be called from anywhere
- Promise-based API
- Works with existing onClick handlers

**Cons**:
- Must remember to render `<ConfirmDialog />`
- More boilerplate

---

## Accessibility

All confirmation dialogs are fully accessible:

**Keyboard Navigation**:
- `Tab` / `Shift+Tab` - Navigate between buttons
- `Enter` - Confirm action
- `Escape` - Cancel and close
- `Space` - Activate focused button

**Screen Readers**:
- AlertDialog role announces modal
- Title and description are properly labeled
- Focus automatically moves to dialog on open
- Focus returns to trigger on close

**ARIA Attributes**:
```tsx
<AlertDialogContent role="alertdialog" aria-labelledby="title" aria-describedby="description">
  <AlertDialogTitle id="title">...</AlertDialogTitle>
  <AlertDialogDescription id="description">...</AlertDialogDescription>
</AlertDialogContent>
```

---

## Styling

### Variant Types

**Destructive** (default for dangerous actions):
- Red warning icon
- Red confirm button
- Used for delete, deny, cancel operations

```tsx
variant="destructive"
```

**Default** (for non-destructive confirmations):
- No warning icon
- Primary blue button
- Used for less critical confirmations

```tsx
variant="default"
```

### Dark Mode

All dialogs automatically support dark mode through CSS variables:

```css
.dark .AlertDialogContent {
  background: var(--color-card);
  color: var(--color-card-foreground);
  border: var(--color-border);
}
```

---

## Current Implementations

### Pilot Delete

**File**: `/app/dashboard/pilots/[id]/page.tsx`

```tsx
const { confirm, ConfirmDialog } = useConfirm()

async function handleDelete() {
  const confirmed = await confirm({
    title: 'Delete Pilot',
    description: 'This will permanently delete the pilot record and all associated certifications and leave requests.',
    confirmText: 'Delete Pilot',
    variant: 'destructive',
  })

  if (!confirmed) return

  // Perform deletion
}

return (
  <div>
    <Button onClick={handleDelete}>Delete</Button>
    <ConfirmDialog />
  </div>
)
```

---

## Migration from `confirm()`

**Before** (native browser confirm):
```tsx
async function handleDelete() {
  if (!confirm('Are you sure you want to delete this pilot?')) {
    return
  }
  // Proceed with deletion
}
```

**After** (ConfirmDialog):
```tsx
const { confirm, ConfirmDialog } = useConfirm()

async function handleDelete() {
  const confirmed = await confirm({
    title: 'Delete Pilot',
    description: 'Are you sure you want to delete this pilot?',
    confirmText: 'Delete',
    variant: 'destructive',
  })

  if (!confirmed) return
  // Proceed with deletion
}

// In JSX:
<ConfirmDialog />
```

**Benefits of Migration**:
- ✅ Consistent UI across browsers
- ✅ Accessible and keyboard-friendly
- ✅ Dark mode support
- ✅ Branded with app styling
- ✅ More descriptive with title + description
- ✅ Loading states supported

---

## Best Practices

### 1. Be Specific in Descriptions

**Bad**:
```tsx
description: "Are you sure?"
```

**Good**:
```tsx
description: "This will permanently delete the pilot record and all associated certifications and leave requests. This action cannot be undone."
```

### 2. Use Action-Oriented Confirm Text

**Bad**:
```tsx
confirmText: "Yes" // Generic
```

**Good**:
```tsx
confirmText: "Delete Pilot" // Action-specific
```

### 3. Highlight Consequences

Always mention:
- What will be deleted
- What related data will be affected
- Whether the action can be undone

```tsx
description: "This will delete the pilot and 15 associated certifications. This action cannot be undone."
```

### 4. Loading States

Show loading state during async operations:

```tsx
<AlertDialogAction disabled={isLoading}>
  {isLoading ? 'Deleting...' : 'Delete Pilot'}
</AlertDialogAction>
```

The `useConfirm` hook handles this automatically.

### 5. Error Handling

Always handle errors after confirmation:

```tsx
if (!confirmed) return

try {
  await performAction()
  toast({ title: 'Success' })
} catch (error) {
  toast({ title: 'Error', variant: 'destructive' })
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Dialog opens when action triggered
- [ ] Title and description display correctly
- [ ] Warning icon shows for destructive variant
- [ ] Cancel button closes dialog without action
- [ ] Confirm button performs action
- [ ] Escape key closes dialog
- [ ] Enter key confirms (when confirm button focused)
- [ ] Tab cycles through buttons
- [ ] Focus returns to trigger after closing
- [ ] Works in dark mode
- [ ] Responsive on mobile
- [ ] Loading state shows during async actions

### Accessibility Testing

Use screen reader (VoiceOver/NVDA) to verify:
- [ ] Dialog role is announced
- [ ] Title is read first
- [ ] Description is read
- [ ] Button labels are clear
- [ ] Focus is trapped in dialog
- [ ] Focus returns correctly after close

---

## Future Enhancements

Potential improvements:

1. **Confirmation with Input**: Require typing "DELETE" to confirm critical actions
2. **Multi-Step Confirmations**: For extremely destructive actions
3. **Undo Feature**: Allow undoing recent destructive actions
4. **Confirmation History**: Track what confirmations users saw
5. **Custom Icons**: Allow custom warning icons beyond alert triangle

---

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Maintainer**: Maurice (Skycruzer)
