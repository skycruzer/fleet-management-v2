# Custom React Hooks

This directory contains custom React hooks for data fetching, mutations, and optimistic UI updates.

## Available Hooks

### Focus Management & Accessibility Hooks (NEW)

- **`useFocusManagement`** - Comprehensive focus management with trap support
- **`useFormFocusManagement`** - Focus management for forms (first field, success message)
- **`useRouteChangeFocus`** - Focus management on route changes

### Network & Connection Hooks

- **`useOnlineStatus`** - Monitor online/offline status with callbacks
- **`useIsOffline`** - Shorthand hook returning offline state
- **`useIsOnline`** - Shorthand hook returning online state
- **`useOnlineStatusWithReconnect`** - Online status with auto-reconnect support

### Retry & Resilience Hooks

- **`useRetryState`** - Execute functions with retry logic and state tracking
- **`useRetry`** - Simplified retry without detailed state tracking
- **`useDeduplicatedSubmit`** - Prevent duplicate form submissions

### Optimistic UI Hooks

- **`useOptimisticMutation`** - Optimistic updates with automatic rollback
- **`useOptimisticQuery`** - TanStack Query integration for optimistic updates
- **`usePortalForm`** - Enhanced form hook with optimistic support

### TanStack Query Hooks

Custom hooks that wrap TanStack Query for data fetching, caching, and mutations.

## Usage Pattern

### Query Hook Example (Data Fetching)

```typescript
// lib/hooks/use-pilots.ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { getPilots } from '@/lib/services/pilot-service'

export function usePilots() {
  return useQuery({
    queryKey: ['pilots'],
    queryFn: getPilots,
    staleTime: 60 * 1000, // Optional: override default staleTime
  })
}
```

### Mutation Hook Example (Data Modification)

```typescript
// lib/hooks/use-create-pilot.ts
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPilot } from '@/lib/services/pilot-service'

export function useCreatePilot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPilot,
    onSuccess: () => {
      // Invalidate and refetch pilots list after successful creation
      queryClient.invalidateQueries({ queryKey: ['pilots'] })
    },
  })
}
```

### Component Usage

```typescript
'use client'
import { usePilots } from '@/lib/hooks/use-pilots'
import { useCreatePilot } from '@/lib/hooks/use-create-pilot'

export function PilotsList() {
  const { data: pilots, isLoading, error } = usePilots()
  const createPilot = useCreatePilot()

  if (isLoading) return <div>Loading pilots...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {pilots?.map(pilot => (
        <div key={pilot.id}>{pilot.name}</div>
      ))}
      <button onClick={() => createPilot.mutate({ name: 'New Pilot' })}>
        Add Pilot
      </button>
    </div>
  )
}
```

## Query Key Conventions

Use hierarchical query keys for better cache management:

- `['pilots']` - All pilots
- `['pilots', id]` - Single pilot by ID
- `['pilots', 'certifications', id]` - Pilot's certifications
- `['certifications']` - All certifications
- `['certifications', 'expiring']` - Expiring certifications

## Benefits

1. **Automatic Caching**: Data is cached and reused across components
2. **Background Refetching**: Stale data is automatically refetched
3. **Optimistic Updates**: UI updates immediately before server response
4. **Error Handling**: Built-in error states and retry logic
5. **Loading States**: Automatic loading state management
6. **DevTools**: React Query DevTools available in development mode

## Configuration

Global configuration is set in `app/providers.tsx`:
- **staleTime**: 60 seconds (data fresh for 1 minute)
- **gcTime**: 5 minutes (garbage collection for inactive queries)
- **refetchOnWindowFocus**: false (prevents disruption)
- **retry**: 1 (single retry attempt)

Override these defaults per-hook as needed for specific use cases.

---

## Optimistic UI Hooks

### useOptimisticMutation

Hook for implementing optimistic UI updates with automatic rollback on errors. Uses React 19's `useOptimistic` under the hood.

**File**: `use-optimistic-mutation.ts`

**Example:**
```typescript
import { useOptimisticMutation } from '@/lib/hooks/use-optimistic-mutation'
import { generateTempId } from '@/lib/utils/optimistic-utils'

function PilotList({ initialPilots }) {
  const { data: pilots, mutate, isPending, error } = useOptimisticMutation(
    initialPilots,
    async (update) => {
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
    }, {
      onSuccess: (result) => console.log('Created:', result),
      onError: (err) => console.error('Failed:', err)
    })
  }

  return (
    <div>
      {pilots.map(pilot => (
        <div key={pilot.id}>
          {pilot.name}
          {pilot.id.startsWith('temp-') && <span>Creating...</span>}
        </div>
      ))}
      <button onClick={handleCreate}>Add Pilot</button>
    </div>
  )
}
```

**API:**
```typescript
interface OptimisticMutationResult<T> {
  data: T[]                // Current data with optimistic updates
  isPending: boolean       // Mutation in progress
  error: Error | null      // Error if failed
  mutate: (update, options?) => Promise<void>
  reset: () => void        // Clear error state
}
```

### useOptimisticQuery

TanStack Query integration for optimistic updates. Manages cache invalidation and rollback automatically.

**File**: `use-optimistic-mutation.ts`

**Example:**
```typescript
import { useOptimisticQuery } from '@/lib/hooks/use-optimistic-mutation'
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
const { mutate } = useOptimisticQuery(
  ['pilots'],
  queryClient,
  async (update) => {
    const response = await fetch('/api/pilots', {
      method: 'POST',
      body: JSON.stringify(update.data)
    })
    return response.json()
  }
)
```

### usePortalForm (Enhanced v2.0)

Enhanced form submission hook with optimistic update support.

**File**: `use-portal-form.ts`

**Example:**
```typescript
import { usePortalForm } from '@/lib/hooks/use-portal-form'

function FeedbackForm() {
  const {
    isSubmitting,
    optimisticSuccess,  // NEW in v2.0
    isPending,          // NEW in v2.0
    error,
    handleSubmit
  } = usePortalForm({
    enableOptimistic: true,  // Enable optimistic updates
    successRedirect: '/portal/feedback',
    successMessage: 'feedback_submitted'
  })

  const onSubmit = async (data) => {
    await handleSubmit(() => submitFormAction(data))
  }

  return (
    <form onSubmit={onSubmit}>
      {optimisticSuccess && (
        <div className="success-banner">
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

**API:**
```typescript
interface UsePortalFormOptions {
  onSuccess?: (data: any) => void
  successRedirect?: string
  successMessage?: string
  enableOptimistic?: boolean     // Enable optimistic updates
  optimisticFeedback?: string    // Message during optimistic state
}
```

## Optimistic UI Utilities

See `lib/utils/optimistic-utils.ts` for helper functions:

- **`generateTempId(prefix)`** - Generate unique temporary IDs
- **`isTempId(id)`** - Check if ID is temporary
- **`applyRollback(data, item, options)`** - Apply rollback strategy
- **`debounceOptimistic(fn, delay)`** - Debounce high-frequency updates
- **`OptimisticQueue`** - Queue and batch operations

## Examples

See `components/examples/` for complete working examples:

- **`optimistic-pilot-list.tsx`** - CRUD operations with optimistic updates
- **`optimistic-feedback-example.tsx`** - Voting system with instant feedback

## Connection Error Handling

### useOnlineStatus

Monitor online/offline status with automatic event handling and callbacks.

**File**: `use-online-status.ts`

**Example:**
```typescript
import { useOnlineStatus } from '@/lib/hooks/use-online-status'
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator'

function MyComponent() {
  const { isOnline, isOffline, lastChanged } = useOnlineStatus({
    onOnline: () => {
      console.log('Connection restored!')
      // Optionally: refresh data
    },
    onOffline: () => {
      console.log('Connection lost!')
      // Optionally: show notification
    },
    debounceDelay: 500  // Optional: debounce rapid changes
  })

  return (
    <div>
      <NetworkStatusIndicator
        isOnline={isOnline}
        variant="banner"
        showOnlyWhenOffline={true}
      />
      <button disabled={isOffline}>Submit</button>
    </div>
  )
}
```

**API:**
```typescript
interface UseOnlineStatusReturn {
  isOnline: boolean          // Current online status
  isOffline: boolean         // Inverse of isOnline
  lastChanged: string | null // ISO timestamp of last change
  checkStatus: () => boolean // Manual status check
}
```

### useRetryState

Execute functions with automatic retry logic and visual feedback.

**File**: `use-retry-state.ts`

**Example:**
```typescript
import { useRetryState } from '@/lib/hooks/use-retry-state'
import { RetryIndicator } from '@/components/ui/retry-indicator'

function DataLoader() {
  const {
    executeWithRetry,
    isRetrying,
    statusMessage,
    progress,
    retryState
  } = useRetryState(3) // Max 3 retries

  const fetchData = async () => {
    try {
      const data = await executeWithRetry(
        async () => {
          const res = await fetch('/api/pilots')
          if (!res.ok) throw new Error('Failed to fetch')
          return res.json()
        },
        {
          maxRetries: 3,
          retryDelay: 1000,        // Initial delay: 1s
          backoffMultiplier: 2,    // Double each retry: 1s, 2s, 4s
        }
      )
      setPilots(data)
    } catch (error) {
      console.error('Failed after retries:', error)
    }
  }

  return (
    <div>
      {isRetrying && (
        <RetryIndicator
          isRetrying={isRetrying}
          statusMessage={statusMessage}
          progress={progress}
          attempt={retryState.attempt}
          maxRetries={retryState.maxRetries}
        />
      )}
      <button onClick={fetchData} disabled={isRetrying}>
        Load Data
      </button>
    </div>
  )
}
```

**API:**
```typescript
interface UseRetryStateReturn {
  retryState: RetryState      // Full retry state
  isRetrying: boolean         // Retry in progress
  statusMessage: string       // User-friendly message
  progress: number            // Progress 0-100%
  executeWithRetry: <T>(fn, config?) => Promise<T>
  reset: () => void           // Reset state
}
```

### useOnlineStatusWithReconnect

Combines online status with automatic reconnection handling.

**Example:**
```typescript
import { useOnlineStatusWithReconnect } from '@/lib/hooks/use-online-status'

function Dashboard() {
  const { isOnline, reconnect, isReconnecting } = useOnlineStatusWithReconnect({
    onReconnect: async () => {
      // Refresh data when coming back online
      await refetchDashboardData()
    },
    autoReconnect: true  // Automatically reconnect when online
  })

  return (
    <div>
      {!isOnline && (
        <NetworkStatusIndicator
          isOnline={isOnline}
          variant="floating"
          showReconnectButton={true}
          onReconnect={reconnect}
          isReconnecting={isReconnecting}
        />
      )}
      <DashboardContent />
    </div>
  )
}
```

### Complete Example: Form with Error Handling

```typescript
import { useOnlineStatus } from '@/lib/hooks/use-online-status'
import { useRetryState } from '@/lib/hooks/use-retry-state'
import { NetworkStatusIndicator, OfflineWarning } from '@/components/ui/network-status-indicator'
import { RetryIndicator, NetworkErrorBanner } from '@/components/ui/retry-indicator'
import { getUserFriendlyMessage, isNetworkError } from '@/lib/error-logger'

function PilotForm() {
  const { isOnline, isOffline } = useOnlineStatus()
  const { executeWithRetry, isRetrying, statusMessage, retryState } = useRetryState(3)
  const [error, setError] = useState<Error | null>(null)

  const handleSubmit = async (data: FormData) => {
    // Don't allow offline submissions
    if (isOffline) {
      setError(new Error('Cannot submit while offline'))
      return
    }

    setError(null)

    try {
      await executeWithRetry(
        async () => {
          const res = await fetch('/api/pilots', {
            method: 'POST',
            body: JSON.stringify(data)
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        },
        { maxRetries: 3, retryDelay: 2000 }
      )
      toast.success('Pilot created successfully')
    } catch (err) {
      setError(err as Error)
      toast.error(getUserFriendlyMessage(err as Error))
    }
  }

  return (
    <div>
      {/* Network status banner */}
      <NetworkStatusIndicator
        isOnline={isOnline}
        variant="banner"
        showOnlyWhenOffline={true}
      />

      {/* Retry indicator */}
      {isRetrying && (
        <RetryIndicator
          isRetrying={isRetrying}
          statusMessage={statusMessage}
          attempt={retryState.attempt}
          maxRetries={retryState.maxRetries}
        />
      )}

      {/* Error banner */}
      {error && !isRetrying && (
        <NetworkErrorBanner
          show={true}
          message={getUserFriendlyMessage(error)}
          onRetry={() => setError(null)}
        />
      )}

      {/* Offline warning */}
      <OfflineWarning
        show={isOffline}
        message="You must be online to submit this form."
      />

      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <button type="submit" disabled={isOffline || isRetrying}>
          Submit
        </button>
      </form>
    </div>
  )
}
```

## Documentation

For comprehensive documentation, see:
- **`docs/OPTIMISTIC-UI-GUIDE.md`** - Complete guide with examples, best practices, and troubleshooting
- **`docs/CONNECTION-ERROR-HANDLING.md`** - Connection error handling, offline detection, and retry strategies
