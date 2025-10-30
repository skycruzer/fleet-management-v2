'use client'

/**
 * React Query Provider Component
 *
 * Wraps the application with QueryClientProvider to enable React Query
 * across all client components.
 *
 * USAGE:
 * Import and wrap your app in layout.tsx or any parent component:
 *
 * ```tsx
 * import { QueryProvider } from '@/lib/react-query/query-provider'
 *
 * export default function Layout({ children }) {
 *   return (
 *     <QueryProvider>
 *       {children}
 *     </QueryProvider>
 *   )
 * }
 * ```
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { getQueryClient } from './query-client'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client instance
  // This ensures the client persists across component remounts
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
