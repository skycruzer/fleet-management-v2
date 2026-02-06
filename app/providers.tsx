'use client'

import * as React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
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
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <CsrfProvider>{children}</CsrfProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" position="bottom" />
    </QueryClientProvider>
  )
}
