'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

/**
 * Query Client Configuration
 *
 * Configured with optimized defaults for the fleet management system:
 * - staleTime: 60s - Data is considered fresh for 1 minute
 * - gcTime: 5min - Inactive queries cached for 5 minutes (formerly cacheTime)
 * - refetchOnWindowFocus: false - Prevent excessive refetches on tab switches
 * - retry: 1 - Single retry attempt for failed queries
 * - networkMode: 'offlineFirst' - Deduplication works even when offline
 *
 * REQUEST DEDUPLICATION:
 * TanStack Query automatically deduplicates identical queries made simultaneously.
 * Multiple components calling useQuery with the same key will share a single request.
 * This prevents duplicate database queries and reduces server load.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data remains fresh for 1 minute (no refetch during this time)
        staleTime: 60 * 1000,
        // Garbage collect inactive queries after 5 minutes
        gcTime: 5 * 60 * 1000,
        // Disable automatic refetch on window focus (aviation context - prevents disruption)
        refetchOnWindowFocus: false,
        // Single retry for failed queries (fail fast for better UX)
        retry: 1,
        // Network mode for better deduplication
        networkMode: 'offlineFirst',
        // Refetch interval to keep data fresh
        refetchInterval: false, // Disabled - manual invalidation preferred
        // Keep previous data while fetching new data
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Single retry for failed mutations
        retry: 1,
        // Network mode for mutations
        networkMode: 'offlineFirst',
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

/**
 * Providers Component
 *
 * Wraps the application with TanStack Query context for data fetching, caching,
 * and state management. Includes React Query DevTools in development mode.
 *
 * @param children - React nodes to be wrapped with providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may
  // suspend because React will throw away the client on the initial
  // render if it suspends and there is no boundary
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only visible in development */}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-left"
        position="bottom"
      />
    </QueryClientProvider>
  )
}
