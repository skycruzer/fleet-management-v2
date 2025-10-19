# Loading States Implementation Guide

This document provides a comprehensive guide to implementing loading states across the Fleet Management V2 application.

## Overview

Loading states have been implemented using a multi-layered approach:
1. **Next.js 15 loading.tsx files** - Route-level loading states
2. **Skeleton components** - Content placeholders during data fetching
3. **Enhanced Button component** - Built-in loading state support
4. **Spinner components** - Reusable loading indicators
5. **Data table loading** - Specialized loading states for tables

---

## 1. Route-Level Loading States (loading.tsx)

Next.js 15 automatically shows loading.tsx while a route segment is loading. We've created loading files for all major routes.

### Available Loading Routes

```
app/
├── loading.tsx                        # Root loading
├── dashboard/
│   ├── loading.tsx                   # Dashboard loading
│   ├── pilots/loading.tsx            # Pilots list loading
│   ├── certifications/loading.tsx    # Certifications loading
│   ├── leave/loading.tsx             # Leave requests loading
│   └── analytics/loading.tsx         # Analytics loading
└── portal/
    ├── loading.tsx                   # Portal loading
    ├── dashboard/loading.tsx         # Portal dashboard loading
    ├── leave/loading.tsx             # Portal leave loading
    └── certifications/loading.tsx    # Portal certifications loading
```

### Usage

These loading states are **automatic** - Next.js displays them while the route is loading. No code changes needed.

```tsx
// app/dashboard/pilots/page.tsx
export default async function PilotsPage() {
  const pilots = await fetchPilots() // During fetch, loading.tsx is shown
  return <PilotsTable pilots={pilots} />
}
```

---

## 2. Skeleton Components

Located in `components/ui/skeleton.tsx`, these provide content placeholders.

### Available Skeleton Components

#### Base Skeleton
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-4 w-48" />
<Skeleton className="h-10 w-full rounded-lg" />
```

#### Specialized Skeletons

1. **PilotListSkeleton**
   ```tsx
   import { PilotListSkeleton } from '@/components/ui/skeleton'

   <PilotListSkeleton count={5} />
   ```

2. **TableSkeleton**
   ```tsx
   import { TableSkeleton } from '@/components/ui/skeleton'

   <TableSkeleton rows={5} columns={4} />
   ```

3. **FormSkeleton**
   ```tsx
   import { FormSkeleton } from '@/components/ui/skeleton'

   <FormSkeleton fields={5} />
   ```

4. **MetricCardSkeleton**
   ```tsx
   import { MetricCardSkeleton } from '@/components/ui/skeleton'

   <MetricCardSkeleton count={4} />
   ```

5. **ChartSkeleton**
   ```tsx
   import { ChartSkeleton } from '@/components/ui/skeleton'

   <ChartSkeleton height={300} />
   ```

6. **PageSkeleton**
   ```tsx
   import { PageSkeleton } from '@/components/ui/skeleton'

   <PageSkeleton />
   ```

### Example: Client Component with Loading State

```tsx
'use client'

import { useState, useEffect } from 'react'
import { TableSkeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function DataTable() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <Card className="p-6">
        <TableSkeleton rows={5} columns={4} />
      </Card>
    )
  }

  return <Table data={data} />
}
```

---

## 3. Enhanced Button Component

The Button component now supports built-in loading states.

### Button with Loading State

```tsx
import { Button } from '@/components/ui/button'

// Basic loading state
<Button loading>Submit</Button>

// With custom loading text
<Button loading loadingText="Submitting...">
  Submit Form
</Button>

// Different variants
<Button variant="outline" loading>Save</Button>
<Button variant="destructive" loading loadingText="Deleting...">
  Delete
</Button>
```

### Button Props

```typescript
interface ButtonProps {
  loading?: boolean        // Show loading spinner and disable button
  loadingText?: string     // Text to display when loading (optional)
  // ... other button props
}
```

### Example: Form Submit Button

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      await submitData()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button
        type="submit"
        loading={isSubmitting}
        loadingText="Submitting..."
      >
        Submit Form
      </Button>
    </form>
  )
}
```

---

## 4. Spinner Components

Located in `components/ui/spinner.tsx`, these provide flexible loading indicators.

### Available Spinner Variants

#### 1. Basic Spinner
```tsx
import { Spinner } from '@/components/ui/spinner'

<Spinner size="md" variant="primary" />
<Spinner size="lg" variant="white" />
<Spinner size="xl" variant="gray" />
```

Sizes: `sm`, `md`, `lg`, `xl`
Variants: `primary`, `white`, `gray`

#### 2. Centered Spinner
```tsx
import { CenteredSpinner } from '@/components/ui/spinner'

<CenteredSpinner
  size="lg"
  text="Loading data..."
  minHeight="300px"
/>
```

#### 3. Inline Spinner
```tsx
import { InlineSpinner } from '@/components/ui/spinner'

<p>
  Processing your request <InlineSpinner />
</p>
```

#### 4. Button Spinner
```tsx
import { ButtonSpinner } from '@/components/ui/spinner'

<button className="bg-blue-600 text-white px-4 py-2 rounded">
  <ButtonSpinner variant="white" />
  Submitting...
</button>
```

---

## 5. Data Table Loading Components

Located in `components/ui/data-table-loading.tsx`, specialized for table loading states.

### DataTableLoading

Full-featured table loading state with filters and pagination.

```tsx
import { DataTableLoading } from '@/components/ui/data-table-loading'

<DataTableLoading
  rows={5}
  columns={4}
  showPagination={true}
  showFilters={true}
/>
```

### SimpleTableLoading

Minimal loading state for simple tables.

```tsx
import { SimpleTableLoading } from '@/components/ui/data-table-loading'

<SimpleTableLoading rows={5} columns={4} />
```

### InlineTableLoading

For inline loading states within existing tables.

```tsx
import { InlineTableLoading } from '@/components/ui/data-table-loading'

<table>
  {loading ? (
    <tbody>
      <tr>
        <td colSpan={5}>
          <InlineTableLoading message="Loading pilots..." />
        </td>
      </tr>
    </tbody>
  ) : (
    <tbody>{/* table rows */}</tbody>
  )}
</table>
```

---

## 6. Portal Forms Loading States

### SubmitButton Component (Legacy)

The existing SubmitButton component now uses the enhanced Button component internally:

```tsx
import { SubmitButton } from '@/components/portal/submit-button'

<SubmitButton
  isSubmitting={isSubmitting}
  loadingText="Submitting..."
>
  Submit Request
</SubmitButton>
```

### EnhancedSubmitButton (Recommended)

New implementations should use the EnhancedSubmitButton:

```tsx
import { EnhancedSubmitButton } from '@/components/portal/submit-button'

<EnhancedSubmitButton
  loading={isSubmitting}
  loadingText="Submitting..."
  variant="default"
  size="lg"
>
  Submit Request
</EnhancedSubmitButton>
```

---

## Implementation Patterns

### Pattern 1: Server Component with Route Loading

```tsx
// app/dashboard/pilots/page.tsx (Server Component)
export default async function PilotsPage() {
  // Next.js automatically shows loading.tsx during this fetch
  const pilots = await getPilots()

  return <PilotsTable pilots={pilots} />
}

// app/dashboard/pilots/loading.tsx
export default function PilotsLoading() {
  return <DataTableLoading rows={8} columns={6} showFilters />
}
```

### Pattern 2: Client Component with State-Based Loading

```tsx
'use client'

import { useState, useEffect } from 'react'
import { SimpleTableLoading } from '@/components/ui/data-table-loading'

export function ClientDataTable() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading) return <SimpleTableLoading />

  return <Table data={data} />
}
```

### Pattern 3: Form with Loading State

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'

export function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit } = useForm()

  async function onSubmit(data) {
    setIsSubmitting(true)
    try {
      await submitData(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />

      <Button
        type="submit"
        loading={isSubmitting}
        loadingText="Saving..."
      >
        Save
      </Button>
    </form>
  )
}
```

### Pattern 4: Multiple Loading States

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InlineSpinner } from '@/components/ui/spinner'

export function ComplexComponent() {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (isLoading) {
    return <CenteredSpinner text="Loading..." />
  }

  return (
    <div>
      <Button
        loading={isSaving}
        loadingText="Saving..."
        onClick={handleSave}
      >
        Save
      </Button>

      <Button
        variant="destructive"
        loading={isDeleting}
        loadingText="Deleting..."
        onClick={handleDelete}
      >
        Delete
      </Button>
    </div>
  )
}
```

---

## Best Practices

### 1. Always Provide Loading Feedback

❌ **Bad**: No loading state
```tsx
async function handleSubmit() {
  await submitData()
  // User has no feedback during submission
}
```

✅ **Good**: Clear loading state
```tsx
async function handleSubmit() {
  setIsSubmitting(true)
  try {
    await submitData()
  } finally {
    setIsSubmitting(false)
  }
}

<Button loading={isSubmitting} loadingText="Submitting...">
  Submit
</Button>
```

### 2. Match Skeleton to Content

❌ **Bad**: Generic skeleton
```tsx
<div className="animate-pulse bg-gray-200 h-20" />
```

✅ **Good**: Matching skeleton
```tsx
<TableSkeleton rows={5} columns={4} /> // For table data
<FormSkeleton fields={5} />             // For form
<MetricCardSkeleton count={4} />        // For dashboard metrics
```

### 3. Disable Interactions During Loading

❌ **Bad**: Allow multiple submissions
```tsx
<button onClick={handleSubmit}>Submit</button>
```

✅ **Good**: Prevent duplicate submissions
```tsx
<Button
  onClick={handleSubmit}
  loading={isSubmitting}
  disabled={isSubmitting}
>
  Submit
</Button>
```

### 4. Provide Meaningful Loading Text

❌ **Bad**: Generic text
```tsx
<Button loading>Loading...</Button>
```

✅ **Good**: Specific text
```tsx
<Button loading loadingText="Submitting leave request...">
  Submit Request
</Button>
```

---

## Storybook Documentation

All loading components have Storybook stories for visual testing:

- `components/ui/spinner.stories.tsx` - All spinner variants
- `components/ui/skeleton.stories.tsx` - Skeleton components
- `components/ui/button.stories.tsx` - Button loading states

Run Storybook to see examples:
```bash
npm run storybook
```

---

## Testing Loading States

### E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test'

test('should show loading state during submission', async ({ page }) => {
  await page.goto('/portal/leave/new')

  // Fill form
  await page.fill('[name="start_date"]', '2025-11-01')
  await page.fill('[name="end_date"]', '2025-11-05')

  // Click submit
  await page.click('button[type="submit"]')

  // Verify loading state appears
  await expect(page.locator('text=Submitting...')).toBeVisible()

  // Verify button is disabled during loading
  await expect(page.locator('button[type="submit"]')).toBeDisabled()
})
```

---

## Migration Guide

### Updating Existing Components

#### Before (Custom Loading)
```tsx
{loading ? (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-2 border-blue-600" />
    <p>Loading...</p>
  </div>
) : (
  <Table data={data} />
)}
```

#### After (Using Components)
```tsx
{loading ? (
  <SimpleTableLoading />
) : (
  <Table data={data} />
)}
```

#### Before (Custom Submit Button)
```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</button>
```

#### After (Enhanced Button)
```tsx
<Button
  type="submit"
  loading={isSubmitting}
  loadingText="Submitting..."
>
  Submit
</Button>
```

---

## Summary

Loading states are now implemented across the application using:

✅ **Route-level loading** (loading.tsx) for automatic route transitions
✅ **Skeleton components** for content placeholders
✅ **Enhanced Button** with built-in loading support
✅ **Spinner components** for flexible loading indicators
✅ **Data table loading** for specialized table states
✅ **Form loading** with disabled states and visual feedback

This provides a consistent, accessible, and performant loading experience throughout the application.

---

**Last Updated**: October 19, 2025
**Version**: 1.0.0
