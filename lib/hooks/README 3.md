# TanStack Query Custom Hooks

This directory contains custom React hooks that wrap TanStack Query for data fetching, caching, and mutations.

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
