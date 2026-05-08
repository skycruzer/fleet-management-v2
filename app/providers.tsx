'use client'

import * as React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { CsrfProvider } from '@/lib/providers/csrf-provider'
import { getQueryClient } from '@/lib/react-query/query-client'

/**
 * Providers Component
 * Developer: Maurice Rondeau
 *
 * Wraps the application with TanStack Query context for data fetching, caching,
 * and state management. Includes ThemeProvider for dark/light mode support.
 * Includes React Query DevTools in development mode.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <NuqsAdapter>
          <CsrfProvider>{children}</CsrfProvider>
        </NuqsAdapter>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
            position="bottom"
          />
        )}
    </QueryClientProvider>
  )
}
