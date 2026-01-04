/**
 * React Query (TanStack Query) Configuration
 *
 * Provides client-side data caching, automatic refetching, and optimistic updates
 * for improved performance and user experience.
 *
 * BENEFITS:
 * - Automatic background refetching
 * - Cache deduplication (multiple components, one request)
 * - Stale-while-revalidate pattern
 * - Optimistic updates for mutations
 * - Loading and error states managed automatically
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default Query Configuration
 *
 * These settings apply to all queries unless overridden
 */
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Stale time: How long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Cache time: How long unused data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

    // Retry failed requests 2 times with exponential backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (when user returns to tab)
    refetchOnWindowFocus: true,

    // Refetch on reconnect (when network restored)
    refetchOnReconnect: true,

    // Refetch on mount
    refetchOnMount: true,

    // Network mode: online only
    networkMode: 'online',
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
    retryDelay: 1000,

    // Network mode: online only
    networkMode: 'online',
  },
}

/**
 * Create Query Client Instance
 *
 * This function creates a new QueryClient with our default configuration.
 * Used in the QueryProvider to ensure a single instance per request.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  })
}

/**
 * Browser Query Client
 *
 * For client-side use, we maintain a singleton instance.
 * This ensures data persistence across component remounts.
 */
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
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

/**
 * Query Keys Factory
 *
 * Centralized query key management for consistency and type safety
 */
export const queryKeys = {
  // Pilots
  pilots: {
    all: ['pilots'] as const,
    lists: () => [...queryKeys.pilots.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.pilots.lists(), filters] as const,
    details: () => [...queryKeys.pilots.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pilots.details(), id] as const,
  },

  // Certifications
  certifications: {
    all: ['certifications'] as const,
    lists: () => [...queryKeys.certifications.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.certifications.lists(), filters] as const,
    details: () => [...queryKeys.certifications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.certifications.details(), id] as const,
    expiring: (days: number) => [...queryKeys.certifications.all, 'expiring', days] as const,
  },

  // Leave Requests
  leaveRequests: {
    all: ['leave-requests'] as const,
    lists: () => [...queryKeys.leaveRequests.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.leaveRequests.lists(), filters] as const,
    details: () => [...queryKeys.leaveRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leaveRequests.details(), id] as const,
    pending: () => [...queryKeys.leaveRequests.all, 'pending'] as const,
  },

  // Dashboard
  dashboard: {
    metrics: ['dashboard', 'metrics'] as const,
    stats: ['dashboard', 'stats'] as const,
    compliance: ['dashboard', 'compliance'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    certifications: () => [...queryKeys.analytics.all, 'certifications'] as const,
    retirement: () => [...queryKeys.analytics.all, 'retirement'] as const,
    risk: () => [...queryKeys.analytics.all, 'risk'] as const,
  },

  // Flight Requests
  flightRequests: {
    all: ['flight-requests'] as const,
    lists: () => [...queryKeys.flightRequests.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.flightRequests.lists(), filters] as const,
    details: () => [...queryKeys.flightRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.flightRequests.details(), id] as const,
  },

  // Pilot Portal
  portal: {
    profile: ['portal', 'profile'] as const,
    certifications: ['portal', 'certifications'] as const,
    notifications: ['portal', 'notifications'] as const,
    stats: ['portal', 'stats'] as const,
  },
} as const

/**
 * Query Options Presets
 *
 * Common query configurations for different data types
 */
export const queryPresets = {
  // Frequently changing data (30 seconds fresh)
  realtime: {
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  },

  // Moderate refresh rate (5 minutes fresh)
  standard: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },

  // Rarely changing data (30 minutes fresh)
  static: {
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  },

  // Very stable reference data (2 hours fresh)
  reference: {
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  },
} as const
