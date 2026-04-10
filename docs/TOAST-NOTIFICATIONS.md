# Toast Notifications Guide

Complete guide for implementing toast notifications in the Fleet Management V2 application.

## Overview

Toast notifications provide non-intrusive feedback to users about operations. They automatically appear and dismiss, keeping users informed without blocking their workflow.

## Features

- **4 Variants**: Default, Success, Warning, Destructive
- **Auto-dismiss**: Automatically dismisses after 5 seconds
- **Swipe Gesture**: Swipe right to dismiss on mobile
- **Stack Support**: Shows up to 5 toasts at once
- **Accessible**: Full ARIA label support
- **Action Buttons**: Optional action buttons for undo/follow-up
- **Responsive**: Adapts positioning for mobile and desktop

## Quick Start

### 1. Basic Usage

```tsx
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const handleSave = async () => {
    try {
      await savePilot()
      toast({
        title: 'Success',
        description: 'Pilot saved successfully',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save pilot',
      })
    }
  }

  return <button onClick={handleSave}>Save</button>
}
```

### 2. Using Outside Components

The toast function can be called directly without hooks:

```tsx
import { toast } from '@/hooks/use-toast'

// In a service file
export async function createPilot(data) {
  try {
    const result = await api.post('/pilots', data)
    toast({
      variant: 'success',
      title: 'Pilot Created',
      description: `${data.name} added successfully`,
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

## Variants

### Default

Use for neutral, informational messages:

```tsx
toast({
  title: 'Notification',
  description: 'Review pending leave requests',
})
```

### Success (Green)

Use for successful operations:

```tsx
toast({
  variant: 'success',
  title: 'Pilot Created',
  description: 'Captain John Doe has been added successfully',
})
```

**When to use:**

- Pilot created/updated/deleted
- Certification added/renewed
- Leave request approved
- Data saved successfully
- Export completed

### Warning (Yellow)

Use for caution messages that need attention:

```tsx
toast({
  variant: 'warning',
  title: 'Certification Expiring',
  description: 'Line Check expires in 15 days',
})
```

**When to use:**

- Certification expiring soon (30 days)
- Approaching leave quota limit
- Non-critical validation warnings
- Incomplete data warnings

### Destructive (Red)

Use for errors and failures:

```tsx
toast({
  variant: 'destructive',
  title: 'Error',
  description: 'Failed to save changes. Please try again.',
})
```

**When to use:**

- API request failed
- Validation errors
- Database errors
- Authentication failures
- Permission denied errors

## Advanced Usage

### Toast with Action Button

Allow users to undo actions or take follow-up steps:

```tsx
import { ToastAction } from '@/components/ui/toast'

toast({
  title: 'Pilot Deleted',
  description: 'Captain John Doe has been removed',
  action: (
    <ToastAction altText="Undo deletion" onClick={() => undoDelete()}>
      Undo
    </ToastAction>
  ),
})
```

### Programmatic Dismiss

Dismiss a specific toast or all toasts:

```tsx
const { toast, dismiss } = useToast()

// Show a toast and get its ID
const { id } = toast({
  title: 'Processing...',
  description: 'Please wait',
})

// Later, dismiss that specific toast
dismiss(id)

// Or dismiss all toasts
dismiss()
```

### Update Existing Toast

Update a toast's content dynamically:

```tsx
const { toast } = useToast()

const { id, update } = toast({
  title: 'Uploading...',
  description: '0% complete',
})

// Later, update the toast
update({
  title: 'Upload Complete',
  description: '100% complete',
  variant: 'success',
})
```

## Real-World Examples

### Pilot Management

```tsx
// Create Pilot
const handleCreatePilot = async (data) => {
  try {
    const result = await createPilot(data)
    toast({
      variant: 'success',
      title: 'Pilot Created',
      description: `${result.full_name} (${result.rank}) added successfully`,
    })
    router.push('/dashboard/pilots')
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Failed to Create Pilot',
      description: error.message || 'Please check your input and try again',
    })
  }
}

// Update Pilot
const handleUpdatePilot = async (id, data) => {
  try {
    await updatePilot(id, data)
    toast({
      variant: 'success',
      title: 'Pilot Updated',
      description: 'Changes saved successfully',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Update Failed',
      description: error.message,
    })
  }
}

// Delete Pilot
const handleDeletePilot = async (pilot) => {
  try {
    await deletePilot(pilot.id)
    toast({
      title: 'Pilot Deleted',
      description: `${pilot.full_name} has been removed`,
      action: (
        <ToastAction altText="Undo deletion" onClick={() => handleRestorePilot(pilot)}>
          Undo
        </ToastAction>
      ),
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Deletion Failed',
      description: error.message,
    })
  }
}
```

### Certification Management

```tsx
// Add Certification
const handleAddCertification = async (pilotId, certData) => {
  try {
    const result = await createCertification(pilotId, certData)
    toast({
      variant: 'success',
      title: 'Certification Added',
      description: `${certData.check_type} added for ${result.pilot_name}`,
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Failed to Add Certification',
      description: error.message,
    })
  }
}

// Expiring Certification Alert
const checkExpiringCertifications = (certifications) => {
  const expiringSoon = certifications.filter(
    (cert) => cert.days_until_expiry <= 30 && cert.days_until_expiry > 0
  )

  if (expiringSoon.length > 0) {
    toast({
      variant: 'warning',
      title: 'Certifications Expiring',
      description: `${expiringSoon.length} certification(s) expire within 30 days`,
    })
  }
}
```

### Leave Request Management

```tsx
// Submit Leave Request
const handleSubmitLeaveRequest = async (data) => {
  try {
    const result = await submitLeaveRequest(data)
    toast({
      variant: 'success',
      title: 'Leave Request Submitted',
      description: `Request for ${data.roster_period} submitted successfully`,
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Submission Failed',
      description: error.message,
    })
  }
}

// Approve Leave Request
const handleApproveLeave = async (requestId) => {
  try {
    await approveLeaveRequest(requestId)
    toast({
      variant: 'success',
      title: 'Leave Approved',
      description: 'The leave request has been approved',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Approval Failed',
      description: error.message,
    })
  }
}

// Eligibility Alert
if (eligibilityAlert) {
  toast({
    variant: 'warning',
    title: 'Eligibility Alert',
    description: `Multiple ${rank}s have requested the same dates. Review conflicts.`,
  })
}
```

### Data Import/Export

```tsx
// Export Data
const handleExport = async () => {
  const { id } = toast({
    title: 'Exporting...',
    description: 'Preparing your data',
  })

  try {
    const data = await exportPilotData()
    toast({
      variant: 'success',
      title: 'Export Complete',
      description: 'Your data has been downloaded',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Export Failed',
      description: error.message,
    })
  } finally {
    dismiss(id)
  }
}

// Import Data
const handleImport = async (file) => {
  try {
    const result = await importPilotData(file)
    toast({
      variant: 'success',
      title: 'Import Complete',
      description: `Imported ${result.count} pilots successfully`,
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Import Failed',
      description: error.message,
    })
  }
}
```

### Form Validation

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  rank: z.enum(['Captain', 'First Officer']),
  employee_number: z.string().min(1, 'Employee number is required'),
})

const onSubmit = async (data) => {
  try {
    await createPilot(data)
    toast({
      variant: 'success',
      title: 'Pilot Created',
      description: 'New pilot added successfully',
    })
    form.reset()
  } catch (error) {
    // Validation errors
    if (error.code === 'VALIDATION_ERROR') {
      toast({
        variant: 'destructive',
        title: 'Validation Failed',
        description: error.details.join(', '),
      })
    }
    // Duplicate entry
    else if (error.code === 'DUPLICATE_ENTRY') {
      toast({
        variant: 'destructive',
        title: 'Duplicate Entry',
        description: 'A pilot with this employee number already exists',
      })
    }
    // Generic error
    else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create pilot. Please try again.',
      })
    }
  }
}
```

## Best Practices

### Do's

1. **Use appropriate variants**
   - Success for completed actions
   - Warning for non-critical issues
   - Destructive for errors

2. **Keep messages concise**
   - Title: 1-3 words
   - Description: 1-2 sentences max

3. **Be specific**
   - Include entity names (pilot name, certification type)
   - Provide context about what happened

4. **Use action buttons wisely**
   - Undo for reversible actions
   - Retry for failed operations
   - View details for complex results

5. **Handle errors gracefully**
   - Always show error toasts for failed operations
   - Provide helpful error messages
   - Suggest next steps when possible

### Don'ts

1. **Don't overuse toasts**
   - Avoid toasts for every minor action
   - Don't stack too many toasts at once

2. **Don't use for critical information**
   - Use dialogs for important decisions
   - Use alerts for critical system messages

3. **Don't make content too long**
   - Avoid paragraph-length descriptions
   - Don't include multiple actions

4. **Don't rely solely on toasts**
   - Also update UI state
   - Provide visual feedback in forms
   - Use loading states appropriately

## Aviation-Specific Guidelines

### Certification Status Colors

Match toast variants to certification status colors:

```tsx
// Expired (Red)
if (cert.days_until_expiry < 0) {
  toast({
    variant: 'destructive',
    title: 'Certification Expired',
    description: `${cert.check_type} expired ${Math.abs(cert.days_until_expiry)} days ago`,
  })
}

// Expiring Soon (Yellow)
else if (cert.days_until_expiry <= 30) {
  toast({
    variant: 'warning',
    title: 'Certification Expiring',
    description: `${cert.check_type} expires in ${cert.days_until_expiry} days`,
  })
}

// Current (Green)
else {
  toast({
    variant: 'success',
    title: 'Certification Current',
    description: `${cert.check_type} is up to date`,
  })
}
```

### Roster Period Messages

```tsx
// Leave request submitted
toast({
  variant: 'success',
  title: 'Leave Request Submitted',
  description: `Request for ${rosterPeriod} (${startDate} - ${endDate})`,
})

// Roster period transition
toast({
  variant: 'default',
  title: 'New Roster Period',
  description: `Now accepting requests for ${nextRosterPeriod}`,
})
```

### Compliance Alerts

```tsx
// Fleet compliance below threshold
if (complianceRate < 90) {
  toast({
    variant: 'destructive',
    title: 'Critical: Fleet Compliance',
    description: `Compliance at ${complianceRate}%. Immediate action required.`,
  })
} else if (complianceRate < 95) {
  toast({
    variant: 'warning',
    title: 'Warning: Fleet Compliance',
    description: `Compliance at ${complianceRate}%. Monitor closely.`,
  })
}
```

## Testing

### Manual Testing

Test toasts in Storybook:

```bash
npm run storybook
```

Navigate to "UI/Toast" to interact with all toast variants.

### E2E Testing

Test toasts in Playwright:

```typescript
import { test, expect } from '@playwright/test'

test('should show success toast after creating pilot', async ({ page }) => {
  await page.goto('/dashboard/pilots/new')
  await page.fill('[name="full_name"]', 'John Doe')
  await page.fill('[name="employee_number"]', '12345')
  await page.selectOption('[name="rank"]', 'Captain')
  await page.click('button[type="submit"]')

  // Wait for toast to appear
  const toast = page.locator('[role="status"]')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('Pilot Created')
  await expect(toast).toContainText('John Doe')
})

test('should show error toast on failed submission', async ({ page }) => {
  await page.goto('/dashboard/pilots/new')
  await page.click('button[type="submit"]') // Submit without filling required fields

  const toast = page.locator('[role="status"]')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('Error')
})
```

## Troubleshooting

### Toast Not Appearing

1. Verify Toaster is added to layout:

   ```tsx
   // app/layout.tsx
   import { Toaster } from '@/components/ui/toaster'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Toaster /> {/* Must be here */}
         </body>
       </html>
     )
   }
   ```

2. Check z-index conflicts:
   - Toasts use `z-[100]`
   - Ensure no elements with higher z-index overlap

3. Verify imports:
   ```tsx
   import { useToast } from '@/hooks/use-toast'
   // Not from @/components/ui/toast
   ```

### Toast Styling Issues

1. Ensure Tailwind CSS is properly configured
2. Check dark mode theme provider is set up
3. Verify `globals.css` includes all necessary styles

### Multiple Toasts Not Stacking

Toasts are limited to 5 at once by design. Older toasts are automatically removed when the limit is reached.

## Additional Resources

- [Radix UI Toast Documentation](https://www.radix-ui.com/docs/primitives/components/toast)
- [shadcn/ui Toast Component](https://ui.shadcn.com/docs/components/toast)
- [Storybook Toast Stories](http://localhost:6006/?path=/story/ui-toast)

## Related Components

- **Alert**: For static, persistent messages
- **Dialog**: For critical user decisions
- **Alert Dialog**: For destructive confirmations

---

**Version**: 1.0.0
**Last Updated**: October 17, 2025
