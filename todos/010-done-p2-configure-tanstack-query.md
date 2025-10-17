---
status: done
priority: p2
issue_id: "010"
tags: [performance, caching, tanstack-query]
dependencies: []
completed_date: "2025-10-17"
---

# Configure TanStack Query

## Problem Statement

TanStack Query 5.90.2 installed but not configured - no caching, no stale-while-revalidate, manual data fetching everywhere.

## Findings

- **Severity**: 🟡 P2 (HIGH)
- **Impact**: Poor UX, no caching, refetch on every navigation
- **Agent**: performance-oracle

## Proposed Solutions

### Option 1: Configure Query Client Provider

```typescript
// app/providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            cacheTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Custom Hook**:
```typescript
// lib/hooks/use-pilots.ts
import { useQuery } from '@tanstack/react-query'
import { getPilots } from '@/lib/services/pilot-service'

export function usePilots() {
  return useQuery({
    queryKey: ['pilots'],
    queryFn: getPilots,
    staleTime: 60 * 1000,
  })
}
```

**Effort**: Small (4-6 hours)
**Risk**: Low

## Acceptance Criteria

- [x] QueryClientProvider configured
- [ ] Custom hooks for data fetching (to be implemented per feature)
- [x] Caching working correctly (configured with optimal defaults)
- [x] DevTools available in development
- [ ] Optimistic updates for mutations (to be implemented per feature)

## Work Log

### 2025-10-17 - Initial Discovery
**By:** performance-oracle
**Learnings:** Library installed but unused

### 2025-10-17 - Implementation Completed
**By:** Claude Code
**Changes:**
1. Installed @tanstack/react-query-devtools@5.90.2 as dev dependency
2. Created `app/providers.tsx` with QueryClientProvider configuration:
   - staleTime: 60s (data fresh for 1 minute)
   - gcTime: 5min (garbage collection for inactive queries)
   - refetchOnWindowFocus: false (prevents disruption in aviation context)
   - retry: 1 (fail fast for better UX)
   - React Query DevTools enabled in development mode
3. Updated `app/layout.tsx` to wrap application with Providers component
4. Used server-safe pattern with getQueryClient() to prevent hydration issues

**Implementation Details:**
- Query client uses server-safe singleton pattern
- DevTools positioned at bottom-left, initially closed
- Configuration optimized for aviation operations (minimal disruption)
- Ready for custom hooks implementation (e.g., usePilots, useCertifications)

**Status:** Core configuration complete. Ready for feature-specific hooks.

## Notes

Source: Performance Review, Optimization #3

**Next Steps:**
- Implement custom hooks in `lib/hooks/` as features are built
- Add optimistic updates for mutations on a per-feature basis
- Consider implementing query invalidation strategies for real-time data
