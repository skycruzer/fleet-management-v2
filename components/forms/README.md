# Reusable Form Components

This directory contains reusable form components that eliminate duplication and provide consistent validation across the application.

## Overview

All forms are built with:
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **shadcn/ui** - UI components
- **TypeScript** - Type safety

## Base Form Wrappers

These wrapper components provide consistent styling, validation, and error handling for common form field types.

### FormFieldWrapper

Text input wrapper with label, validation, and error display.

```tsx
import { FormFieldWrapper } from '@/components/forms'

<FormFieldWrapper
  name="first_name"
  label="First Name"
  placeholder="John"
  required
  description="Pilot's first name"
/>
```

**Props:**
- `name` (required): Field name in form data
- `label` (required): Display label
- `description`: Optional help text
- `placeholder`: Placeholder text
- `type`: Input type (text, email, password, number, tel, url)
- `disabled`: Disable the field
- `required`: Show required indicator (*)
- `className`: Additional CSS classes

### FormSelectWrapper

Dropdown select wrapper with options.

```tsx
import { FormSelectWrapper } from '@/components/forms'

<FormSelectWrapper
  name="role"
  label="Rank"
  options={[
    { label: 'Captain', value: 'Captain' },
    { label: 'First Officer', value: 'First Officer' }
  ]}
  placeholder="Select rank"
  required
/>
```

**Props:**
- `name` (required): Field name in form data
- `label` (required): Display label
- `options` (required): Array of `{ label, value }` objects
- `description`: Optional help text
- `placeholder`: Placeholder text
- `disabled`: Disable the field
- `required`: Show required indicator (*)
- `className`: Additional CSS classes

### FormTextareaWrapper

Multi-line text input with character count.

```tsx
import { FormTextareaWrapper } from '@/components/forms'

<FormTextareaWrapper
  name="notes"
  label="Notes"
  placeholder="Add notes..."
  rows={4}
  maxLength={500}
  description="Optional notes"
/>
```

**Props:**
- `name` (required): Field name in form data
- `label` (required): Display label
- `description`: Optional help text
- `placeholder`: Placeholder text
- `rows`: Number of visible text rows (default: 4)
- `maxLength`: Maximum character count
- `disabled`: Disable the field
- `required`: Show required indicator (*)
- `className`: Additional CSS classes

### FormCheckboxWrapper

Checkbox input with label.

```tsx
import { FormCheckboxWrapper } from '@/components/forms'

<FormCheckboxWrapper
  name="is_active"
  label="Active Status"
  description="Is this pilot currently active?"
/>
```

**Props:**
- `name` (required): Field name in form data
- `label` (required): Display label
- `description`: Optional help text
- `disabled`: Disable the field
- `className`: Additional CSS classes

### FormDatePickerWrapper

Date picker with calendar popup.

```tsx
import { FormDatePickerWrapper } from '@/components/forms'

<FormDatePickerWrapper
  name="date_of_birth"
  label="Date of Birth"
  disableFuture
  required
  description="Must be at least 18 years old"
/>
```

**Props:**
- `name` (required): Field name in form data
- `label` (required): Display label
- `description`: Optional help text
- `placeholder`: Placeholder text (default: "Pick a date")
- `disabled`: Disable the field
- `required`: Show required indicator (*)
- `disableFuture`: Disable future dates
- `disablePast`: Disable past dates
- `className`: Additional CSS classes

## Specialized Forms

These unified form components handle both create and edit modes for specific entities.

### PilotForm

Unified form for creating and editing pilots.

```tsx
import { PilotForm } from '@/components/forms'

<PilotForm
  mode="create"
  onSubmit={async (data) => {
    await createPilot(data)
  }}
  onCancel={() => router.back()}
  isLoading={isSubmitting}
/>
```

**Props:**
- `mode` (required): 'create' or 'edit'
- `defaultValues`: Pre-populate form data (for edit mode)
- `onSubmit` (required): Async function to handle form submission
- `onCancel`: Function to call when cancel is clicked
- `isLoading`: Show loading state

**Features:**
- Employee ID validation (6 digits)
- Name validation (letters only)
- Rank selection (Captain/First Officer)
- Captain qualifications (conditional, Captain only)
- Passport validation with expiry date
- Date of birth validation (must be 18+)
- Seniority number
- Active/inactive status

### CertificationForm

Unified form for creating and editing certifications.

```tsx
import { CertificationForm } from '@/components/forms'

<CertificationForm
  mode="create"
  pilots={pilotOptions}
  checkTypes={checkTypeOptions}
  showPilotSelect={true}
  onSubmit={async (data) => {
    await createCertification(data)
  }}
  isLoading={isSubmitting}
/>
```

**Props:**
- `mode` (required): 'create' or 'edit'
- `defaultValues`: Pre-populate form data (for edit mode)
- `onSubmit` (required): Async function to handle form submission
- `onCancel`: Function to call when cancel is clicked
- `isLoading`: Show loading state
- `pilots`: Array of pilot options for select dropdown
- `checkTypes`: Array of check type options for select dropdown
- `showPilotSelect`: Show/hide pilot selection (default: true)

**Features:**
- Pilot selection (if showPilotSelect is true)
- Check type selection
- Completion date (cannot be in future)
- Expiry date (must be after completion date)
- Roster period validation (RP1/2025 - RP13/2025)
- Notes field (max 500 characters)

### LeaveRequestForm

Unified form for creating and editing leave requests.

```tsx
import { LeaveRequestForm } from '@/components/forms'

<LeaveRequestForm
  mode="create"
  pilots={pilotOptions}
  showPilotSelect={true}
  onSubmit={async (data) => {
    await createLeaveRequest(data)
  }}
  isLoading={isSubmitting}
/>
```

**Props:**
- `mode` (required): 'create' or 'edit'
- `defaultValues`: Pre-populate form data (for edit mode)
- `onSubmit` (required): Async function to handle form submission
- `onCancel`: Function to call when cancel is clicked
- `isLoading`: Show loading state
- `pilots`: Array of pilot options for select dropdown
- `showPilotSelect`: Show/hide pilot selection (default: true)

**Features:**
- Pilot selection (if showPilotSelect is true)
- Leave type selection (RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
- Request method (EMAIL, ORACLE, LEAVE_BIDS, SYSTEM)
- Date range validation (start/end dates, max 90 days)
- Late request detection (< 21 days advance notice)
- Automatic late request warning
- Request date validation
- Reason field (optional, max 500 characters)

## Usage Examples

### Creating a New Pilot (Client Component)

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PilotForm } from '@/components/forms'
import type { PilotCreate } from '@/lib/validations/pilot-validation'

export default function CreatePilotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: PilotCreate) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create pilot')

      router.push('/dashboard/pilots')
      router.refresh()
    } catch (error) {
      console.error('Error creating pilot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <PilotForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={isLoading}
      />
    </div>
  )
}
```

### Editing an Existing Pilot

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PilotForm } from '@/components/forms'
import type { PilotUpdate } from '@/lib/validations/pilot-validation'

export default function EditPilotPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [pilot, setPilot] = useState(null)

  useEffect(() => {
    // Fetch pilot data
    fetch(`/api/pilots/${params.id}`)
      .then(res => res.json())
      .then(data => setPilot(data))
  }, [params.id])

  const handleSubmit = async (data: PilotUpdate) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/pilots/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update pilot')

      router.push('/dashboard/pilots')
      router.refresh()
    } catch (error) {
      console.error('Error updating pilot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!pilot) return <div>Loading...</div>

  return (
    <div className="container max-w-4xl py-8">
      <PilotForm
        mode="edit"
        defaultValues={pilot}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={isLoading}
      />
    </div>
  )
}
```

## Benefits

### Code Reduction
- **Before**: ~1,900 lines of duplicated form code
- **After**: ~900 lines of reusable components
- **Savings**: 52% reduction in code duplication

### Consistency
- Single source of truth for validation rules
- Consistent error messages across all forms
- Unified styling and user experience

### Maintainability
- Change validation logic in one place
- Update UI components globally
- Easier to add new features

### Type Safety
- Full TypeScript integration
- Zod schema validation
- Compile-time type checking

## Validation Integration

All forms integrate with Zod validation schemas from `lib/validations/`:

- `pilot-validation.ts` - PilotCreateSchema, PilotUpdateSchema
- `certification-validation.ts` - CertificationCreateSchema, CertificationUpdateSchema
- `leave-validation.ts` - LeaveRequestCreateSchema, LeaveRequestUpdateSchema

Changes to validation schemas automatically propagate to all forms using React Hook Form's zodResolver.

## Next Steps

1. **Update Existing Pages**: Replace old form implementations with new unified forms
2. **Remove Duplicates**: Delete old duplicate form files
3. **Add Storybook Stories**: Create stories for each form component
4. **Add E2E Tests**: Test form validation and submission flows
5. **Add Form Arrays**: Support for repeating field groups (e.g., multiple qualifications)

## Contributing

When adding new form components:

1. Follow the wrapper pattern for base components
2. Use TypeScript for type safety
3. Integrate with Zod validation schemas
4. Add proper JSDoc comments
5. Include usage examples in this README
6. Create Storybook stories for visual testing
