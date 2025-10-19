# Optimistic UI Updates Guide

## Overview

Optimistic UI is a UX pattern that provides instant visual feedback to users by updating the interface immediately, before waiting for server confirmation. This creates a perception of speed and responsiveness, improving the overall user experience.

**Version**: 1.0.0
**Last Updated**: October 19, 2025
**Author**: Maurice (Skycruzer)

---

## Benefits

1. **Perceived Performance**: UI feels instant, even with slow network connections
2. **Better UX**: Users don't wait for spinners after every action
3. **Reduced Friction**: Seamless interactions encourage user engagement
4. **Error Recovery**: Automatic rollback on failures maintains data consistency

---

## Implementation Approach

### React 19's useOptimistic Hook

We leverage React 19's built-in `useOptimistic` hook for seamless optimistic updates with automatic rollback capabilities.

```tsx
import { useOptimistic } from 'react'

const [optimisticData, setOptimisticData] = useOptimistic(
  initialData,
  (state, update) => {
    // Apply optimistic update
    return updatedState
  }
)
```

### Custom Hooks

We've created two primary hooks for optimistic updates:

1. **`useOptimisticMutation`** - For standalone data mutations
2. **`usePortalForm`** (enhanced) - For form submissions with optimistic updates

---

## Quick Start

### 1. Simple Optimistic Update

```tsx
'use client'

import { useOptimisticMutation } from '@/lib/hooks/use-optimistic-mutation'
import { generateTempId } from '@/lib/utils/optimistic-utils'

function PilotList({ initialPilots }) {
  const { data: pilots, mutate, isPending, error } = useOptimisticMutation(
    initialPilots,
    async (update) => {
      // Your API call
      const response = await fetch('/api/pilots', {
        method: 'POST',
        body: JSON.stringify(update.data)
      })
      return response.json()
    }
  )

  const handleCreate = async () => {
    await mutate({
      action: 'create',
      data: newPilot,
      tempId: generateTempId('pilot')
    })
  }

  return (
    <div>
      {pilots.map(pilot => (
        <PilotCard key={pilot.id} pilot={pilot} />
      ))}
    </div>
  )
}
```

### 2. Optimistic Form Submission

```tsx
'use client'

import { usePortalForm } from '@/lib/hooks/use-portal-form'

function FeedbackForm() {
  const {
    isSubmitting,
    optimisticSuccess,
    error,
    handleSubmit
  } = usePortalForm({
    enableOptimistic: true,
    successRedirect: '/portal/feedback',
    successMessage: 'feedback_submitted'
  })

  const onSubmit = async (data) => {
    await handleSubmit(() => submitFeedbackAction(data))
  }

  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}

      {optimisticSuccess && (
        <div className="success-message">
          ✓ Submitted! Syncing with server...
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  )
}
```

### 3. Optimistic Voting (Feedback)

```tsx
'use client'

import { useOptimistic } from 'react'

function FeedbackItem({ feedback }) {
  const [optimisticFeedback, setOptimisticFeedback] = useOptimistic(
    feedback,
    (state, action) => {
      if (action.type === 'upvote') {
        return { ...state, upvotes: state.upvotes + 1 }
      }
      return state
    }
  )

  const handleVote = async () => {
    // Apply optimistic update immediately
    setOptimisticFeedback({ type: 'upvote' })

    try {
      await fetch(`/api/feedback/${feedback.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote: 'up' })
      })
    } catch (error) {
      // Automatic rollback on error
      console.error('Vote failed')
    }
  }

  return (
    <div>
      <button onClick={handleVote}>
        👍 {optimisticFeedback.upvotes}
      </button>
    </div>
  )
}
```

---

## API Reference

### useOptimisticMutation

Hook for optimistic mutations with automatic rollback.

#### Type Signature

```typescript
function useOptimisticMutation<T extends { id: string }>(
  initialData: T[],
  mutationFn: (update: OptimisticUpdate<T>) => Promise<T>
): OptimisticMutationResult<T>
```

#### Parameters

- **`initialData`**: Initial array of data items
- **`mutationFn`**: Async function that performs the actual mutation

#### Returns

```typescript
{
  data: T[]                // Current data (with optimistic updates)
  isPending: boolean       // Whether mutation is in progress
  error: Error | null      // Error if mutation failed
  mutate: (update, options?) => Promise<void>  // Trigger mutation
  reset: () => void        // Clear error state
}
```

#### Update Object

```typescript
interface OptimisticUpdate<T> {
  action: 'create' | 'update' | 'delete'
  data: T
  tempId?: string  // Temporary ID for create operations
}
```

#### Options

```typescript
interface MutationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  optimisticData?: Partial<T>
}
```

---

### usePortalForm (Enhanced)

Form submission hook with optimistic update support.

#### Type Signature

```typescript
function usePortalForm(options?: UsePortalFormOptions)
```

#### Options

```typescript
interface UsePortalFormOptions {
  onSuccess?: (data: any) => void
  successRedirect?: string
  successMessage?: string
  enableOptimistic?: boolean     // NEW: Enable optimistic updates
  optimisticFeedback?: string    // NEW: Message during optimistic state
}
```

#### Returns

```typescript
{
  isSubmitting: boolean
  error: string | null
  success: boolean
  optimisticSuccess: boolean     // NEW: Optimistic success state
  isPending: boolean             // NEW: Transition pending state
  handleSubmit: (fn) => Promise<void>
  resetError: () => void
  resetForm: () => void
}
```

---

## Utility Functions

### generateTempId

Generate a unique temporary ID for optimistic creates.

```typescript
generateTempId(prefix?: string): string

// Usage
const tempId = generateTempId('pilot') // "pilot-1729367890123-abc123def"
```

### isTempId

Check if an ID is a temporary optimistic ID.

```typescript
isTempId(id: string): boolean

// Usage
if (isTempId(pilot.id)) {
  // This is an optimistic create, show loading state
}
```

### replaceTempId

Replace temporary IDs with real server IDs.

```typescript
replaceTempId<T>(items: T[], tempId: string, realId: string): T[]

// Usage
const updatedPilots = replaceTempId(pilots, 'temp-123', 'uuid-456')
```

### applyRollback

Apply rollback strategy when mutations fail.

```typescript
applyRollback<T>(
  currentData: T[],
  failedItem: T,
  options: RollbackOptions<T>
): T[]

// Usage
const rolledBackData = applyRollback(pilots, failedPilot, {
  strategy: 'remove',
  previousData: originalPilots
})
```

---

## Patterns & Best Practices

### 1. Visual Indicators for Optimistic State

Always indicate when data is in an optimistic state:

```tsx
<div className={pilot.id.startsWith('temp-') ? 'opacity-60 border-dashed' : ''}>
  <h3>{pilot.name}</h3>
  {pilot.id.startsWith('temp-') && (
    <span className="text-sm text-blue-600">Creating...</span>
  )}
</div>
```

### 2. Disable Actions During Pending State

Prevent race conditions by disabling actions while mutations are pending:

```tsx
<Button
  onClick={handleUpdate}
  disabled={isPending || isTempId(pilot.id)}
>
  Update
</Button>
```

### 3. Error Handling with Retry

Provide clear error messages with retry capability:

```tsx
{error && (
  <Alert variant="destructive">
    <AlertTitle>Operation Failed</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
    <Button onClick={() => mutate(lastUpdate)}>Retry</Button>
  </Alert>
)}
```

### 4. Rollback Strategies

Choose appropriate rollback strategy based on operation:

- **`remove`**: For failed creates (remove the optimistic item)
- **`restore`**: For failed updates (restore previous state)
- **`mark-error`**: For debugging (keep item but mark as errored)

```typescript
const { mutate } = useOptimisticMutation(data, mutationFn)

await mutate(update, {
  onError: (error) => {
    // Automatic rollback already happened
    toast({
      title: 'Failed to save',
      description: error.message,
      variant: 'destructive'
    })
  }
})
```

### 5. Conflict Resolution

Handle conflicts between optimistic and server data:

```typescript
import { resolveConflict } from '@/lib/utils/optimistic-utils'

const resolved = resolveConflict(clientData, serverData, {
  type: 'merge',
  mergeStrategy: (client, server) => ({
    ...server,
    // Keep client's UI-only fields
    _isExpanded: client._isExpanded,
    _selectedTab: client._selectedTab
  })
})
```

---

## Examples

### Complete Pilot Management Example

See: `components/examples/optimistic-pilot-list.tsx`

Features:
- Create with instant feedback
- Update with optimistic state
- Delete with confirmation
- Pending indicators
- Error handling with retry
- Stats dashboard

### Feedback Voting Example

See: `components/examples/optimistic-feedback-example.tsx`

Features:
- Instant vote updates
- Toggle vote on/off
- Change vote type
- Success toasts
- Automatic rollback on error

---

## Testing Optimistic Updates

### 1. Test Happy Path

```typescript
test('should optimistically add pilot', async () => {
  const { getByText, getByRole } = render(<PilotList />)

  fireEvent.click(getByRole('button', { name: /add pilot/i }))

  // Should show optimistic pilot immediately
  expect(getByText(/creating/i)).toBeInTheDocument()

  // Wait for server confirmation
  await waitFor(() => {
    expect(getByText(/john doe/i)).toBeInTheDocument()
  })
})
```

### 2. Test Error Rollback

```typescript
test('should rollback on error', async () => {
  // Mock API failure
  server.use(
    rest.post('/api/pilots', (req, res, ctx) => {
      return res(ctx.status(500))
    })
  )

  const { getByText, queryByText } = render(<PilotList />)

  fireEvent.click(getByRole('button', { name: /add pilot/i }))

  // Should show optimistic state
  expect(getByText(/creating/i)).toBeInTheDocument()

  // Wait for rollback
  await waitFor(() => {
    expect(queryByText(/creating/i)).not.toBeInTheDocument()
  })

  // Should show error
  expect(getByText(/failed to create/i)).toBeInTheDocument()
})
```

### 3. Test Race Conditions

```typescript
test('should handle rapid mutations', async () => {
  const { getByRole, findByText } = render(<PilotList />)

  // Trigger multiple rapid updates
  fireEvent.click(getByRole('button', { name: /update/i }))
  fireEvent.click(getByRole('button', { name: /update/i }))
  fireEvent.click(getByRole('button', { name: /update/i }))

  // Should eventually settle on final state
  await findByText(/updated successfully/i)
})
```

---

## Performance Considerations

### 1. Debounce Rapid Updates

For high-frequency updates (like typing), debounce optimistic mutations:

```typescript
import { debounceOptimistic } from '@/lib/utils/optimistic-utils'

const debouncedMutate = debounceOptimistic(mutate, 300)

const handleChange = (value) => {
  debouncedMutate({ action: 'update', data: { ...pilot, name: value } })
}
```

### 2. Batch Updates

Use `OptimisticQueue` for batching multiple operations:

```typescript
import { OptimisticQueue } from '@/lib/utils/optimistic-utils'

const queue = new OptimisticQueue()

// Add multiple operations
queue.add('create', newPilot1)
queue.add('create', newPilot2)
queue.add('update', updatedPilot)

// Flush and execute in batch
const operations = queue.flush()
await Promise.all(operations.map(op => mutate(op)))
```

### 3. Limit Optimistic State Duration

Clear old optimistic errors automatically:

```typescript
import { clearOldErrors } from '@/lib/utils/optimistic-utils'

const cleanState = clearOldErrors(state, 5000) // Clear errors older than 5s
```

---

## Migration Guide

### From Standard Form to Optimistic Form

**Before:**
```tsx
const { isSubmitting, error, handleSubmit } = usePortalForm({
  successRedirect: '/dashboard'
})
```

**After:**
```tsx
const {
  isSubmitting,
  optimisticSuccess,  // NEW
  isPending,          // NEW
  error,
  handleSubmit
} = usePortalForm({
  enableOptimistic: true,  // NEW
  successRedirect: '/dashboard'
})

// Show optimistic feedback
{optimisticSuccess && <SuccessMessage />}
```

### From Direct API Calls to Optimistic Mutation

**Before:**
```tsx
const [pilots, setPilots] = useState(initialPilots)
const [loading, setLoading] = useState(false)

const handleCreate = async (data) => {
  setLoading(true)
  const result = await fetch('/api/pilots', { method: 'POST', body: JSON.stringify(data) })
  const newPilot = await result.json()
  setPilots([...pilots, newPilot])
  setLoading(false)
}
```

**After:**
```tsx
const { data: pilots, mutate, isPending } = useOptimisticMutation(
  initialPilots,
  async (update) => {
    const result = await fetch('/api/pilots', { method: 'POST', body: JSON.stringify(update.data) })
    return result.json()
  }
)

const handleCreate = async (data) => {
  await mutate({
    action: 'create',
    data,
    tempId: generateTempId('pilot')
  })
}
```

---

## Troubleshooting

### Issue: Optimistic updates not reverting on error

**Solution**: Ensure you're using `useTransition` or `useOptimistic` which handle rollback automatically.

```typescript
// ❌ Wrong - manual state management
const [data, setData] = useState(initial)
setData(optimisticData) // Won't rollback automatically

// ✅ Correct - use useOptimistic
const [data, setData] = useOptimistic(initial, reducer)
setData(update) // Automatic rollback on error
```

### Issue: Temporary IDs showing in UI

**Solution**: Use visual indicators and replace temp IDs after server confirmation.

```typescript
// Check for temp IDs
const isOptimistic = pilot.id.startsWith('temp-')

// Replace after server confirmation
const realPilot = await mutate({ ... })
// Hook automatically replaces temp ID with real ID
```

### Issue: Race conditions with rapid updates

**Solution**: Use debouncing for high-frequency updates.

```typescript
import { debounceOptimistic } from '@/lib/utils/optimistic-utils'

const debouncedUpdate = debounceOptimistic(mutate, 300)
```

---

## Additional Resources

- [React 19 useOptimistic Documentation](https://react.dev/reference/react/useOptimistic)
- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Next.js Server Actions with Optimistic UI](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#optimistic-updates)

---

## Summary

Optimistic UI updates provide a significant UX improvement by making the interface feel instant. The key points:

1. ✅ Use `useOptimistic` from React 19 for automatic rollback
2. ✅ Provide visual indicators for optimistic state (dashed borders, loading text)
3. ✅ Disable actions during pending state to prevent race conditions
4. ✅ Handle errors gracefully with clear messaging and retry options
5. ✅ Test both success and failure scenarios thoroughly
6. ✅ Choose appropriate rollback strategies for different operations

By following this guide, you can implement robust optimistic UI updates that enhance user experience while maintaining data consistency.

---

**Last Updated**: 2025-10-19
**Maintainer**: Maurice (Skycruzer)
**Version**: 1.0.0
