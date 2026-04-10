# Toast Notifications Guide

**Fleet Management V2 - Toast Notification Usage**

## Overview

Toast notifications are already integrated into the application using **@radix-ui/react-toast**. The Toaster component is included in the root layout, making toasts available throughout the entire application.

## Quick Start

### Import the Hook

```tsx
import { useToast } from '@/hooks/use-toast'
```

### Basic Usage

```tsx
function MyComponent() {
  const { toast } = useToast()

  return <button onClick={() => toast({ title: 'Success!' })}>Show Toast</button>
}
```

## Toast Variants

### Success Toast

```tsx
toast({
  variant: 'success',
  title: 'Pilot Created',
  description: 'John Doe has been added successfully',
})
```

### Error Toast (Destructive)

```tsx
toast({
  variant: 'destructive',
  title: 'Error',
  description: 'Failed to save changes. Please try again.',
})
```

### Warning Toast

```tsx
toast({
  variant: 'warning',
  title: 'Warning',
  description: 'Certification expires in 30 days',
})
```

### Info Toast (Default)

```tsx
toast({
  title: 'Information',
  description: 'Your changes have been saved',
})
```

## Common Use Cases

### Form Submission Success

```tsx
async function handleSubmit(data) {
  try {
    await createPilot(data)
    toast({
      variant: 'success',
      title: 'Pilot Created',
      description: `${data.first_name} ${data.last_name} has been added to the system.`,
    })
    router.push('/dashboard/pilots')
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message || 'Failed to create pilot',
    })
  }
}
```

### Delete Confirmation

```tsx
async function handleDelete(pilotId: string) {
  try {
    await deletePilot(pilotId)
    toast({
      variant: 'success',
      title: 'Pilot Deleted',
      description: 'The pilot has been removed from the system.',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Delete Failed',
      description: 'Could not delete pilot. Please try again.',
    })
  }
}
```

### Update Success

```tsx
async function handleUpdate(data) {
  try {
    await updatePilot(data)
    toast({
      variant: 'success',
      title: 'Changes Saved',
      description: 'Pilot information has been updated successfully.',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Update Failed',
      description: error.message,
    })
  }
}
```

### Leave Request Submission

```tsx
async function submitLeaveRequest(request) {
  try {
    const result = await createLeaveRequest(request)
    toast({
      variant: 'success',
      title: 'Leave Request Submitted',
      description: `Your request for ${request.days_count} days has been submitted for approval.`,
    })
    router.push('/portal/leave')
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Submission Failed',
      description: 'Could not submit leave request. Please check your dates and try again.',
    })
  }
}
```

### Certification Expiry Warning

```tsx
function checkExpiringCertifications(certifications) {
  const expiringSoon = certifications.filter(
    (c) => c.status.color === 'yellow' && c.status.daysUntilExpiry <= 30
  )

  if (expiringSoon.length > 0) {
    toast({
      variant: 'warning',
      title: 'Certifications Expiring Soon',
      description: `You have ${expiringSoon.length} certification(s) expiring in the next 30 days.`,
    })
  }
}
```

## Advanced Features

### Toast with Action Button

```tsx
import { ToastAction } from '@/components/ui/toast'

toast({
  title: 'Pilot Deleted',
  description: 'John Doe has been removed',
  action: (
    <ToastAction altText="Undo" onClick={() => undoDelete()}>
      Undo
    </ToastAction>
  ),
})
```

### Standalone Toast (Outside Components)

```tsx
// In a service file or utility function
import { toast } from '@/hooks/use-toast'

export async function createPilot(data) {
  try {
    const result = await api.post('/pilots', data)
    toast({
      variant: 'success',
      title: 'Success',
      description: 'Pilot created successfully',
    })
    return result
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message,
    })
    throw error
  }
}
```

### Dismiss Toast Programmatically

```tsx
const { toast, dismiss } = useToast()

// Show a toast
const { id } = toast({ title: 'Loading...' })

// Later, dismiss it
dismiss(id)

// Or dismiss all toasts
dismiss()
```

## Best Practices

1. **Keep titles short** - One line, under 50 characters
2. **Descriptions are optional** - Use for additional context only
3. **Use appropriate variants**:
   - `success` - Completed actions
   - `destructive` - Errors and failures
   - `warning` - Important notices, expiring items
   - Default - General information
4. **Auto-dismiss** - Toasts auto-dismiss after 5 seconds (configurable)
5. **Limit toast count** - Maximum of 5 toasts shown at once
6. **Be specific** - "Pilot John Doe created" is better than "Success"
7. **Action buttons** - Use sparingly, only for critical undo actions

## Accessibility

The toast system includes:

- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Swipe-to-dismiss on mobile
- ✅ Auto-focus management
- ✅ Screen reader announcements

## Configuration

Toast location: **Bottom-right on desktop, top on mobile**
Default duration: **5 seconds**
Maximum toasts: **5 simultaneous**
Animation: **Slide-in with fade**

## Examples in the Codebase

Look for these files for real-world examples:

- `/app/dashboard/pilots/new/page.tsx` - Pilot creation
- `/app/dashboard/leave/new/page.tsx` - Leave request submission
- `/app/portal/flights/new/page.tsx` - Flight request submission

---

**Last Updated**: October 21, 2025
**Toast Library**: @radix-ui/react-toast
**Version**: 2.0.0
