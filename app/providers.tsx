'use client'

import * as React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { CsrfProvider } from '@/lib/providers/csrf-provider'
import { getQueryClient } from '@/lib/react-query/query-client'

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <CsrfProvider>{children}</CsrfProvider>
        {/* React Query DevTools - only visible in development */}
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" position="bottom" />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
