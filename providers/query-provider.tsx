/**
 * React Query Provider
 *
 * Configures TanStack Query (React Query) for efficient data caching,
 * background refetching, and optimistic updates across the application.
 *
 * @created 2025-10-29
 * @priority Priority 3 - Performance Optimization
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * Query Client Configuration
 *
 * Default settings optimized for pilot portal use cases:
 * - 5 minute cache time (good balance for frequently changing data)
 * - 1 minute stale time (data considered fresh for 1 min)
 * - Background refetch on window focus
 * - Retry failed requests 3 times with exponential backoff
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes
        gcTime: 1000 * 60 * 5,

        // Consider data stale after 1 minute
        staleTime: 1000 * 60,

        // Refetch stale data on window focus
        refetchOnWindowFocus: true,

        // Refetch on component mount if data is stale
        refetchOnMount: true,

        // Don't refetch on reconnect (handled by background refetch)
        refetchOnReconnect: false,

        // Retry failed requests 3 times
        retry: 3,

        // Exponential backoff for retries (1s, 2s, 4s)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,

        // Exponential backoff for mutation retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
