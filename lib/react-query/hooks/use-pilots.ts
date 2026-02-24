/**
 * React Query Hooks for Pilots
 *
 * Custom hooks for fetching and mutating pilot data with automatic caching,
 * background refetching, and optimistic updates.
 *
 * USAGE EXAMPLE:
 * ```tsx
 * 'use client'
 * import { usePilots, usePilot } from '@/lib/react-query/hooks/use-pilots'
 *
 * function PilotList() {
 *   const { data: pilots, isLoading, error } = usePilots()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {pilots?.map(pilot => (
 *         <li key={pilot.id}>{pilot.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { queryKeys, queryPresets } from '../query-client'

/**
 * Pilot Type (simplified - use actual type from supabase.ts)
 */
interface Pilot {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  rank: string
  email: string
  status: string
  seniority_number: number | null
  commencement_date: string | null
  // ... other fields
}

/**
 * Fetch all pilots
 */
async function fetchPilots(): Promise<Pilot[]> {
  const response = await fetch('/api/pilots')
  if (!response.ok) {
    throw new Error('Failed to fetch pilots')
  }
  const result = await response.json()
  return result.data || []
}

/**
 * Fetch single pilot by ID
 */
async function fetchPilot(id: string): Promise<Pilot> {
  const response = await fetch(`/api/pilots/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch pilot')
  }
  const result = await response.json()
  return result.data
}

/**
 * Update pilot
 */
async function updatePilot(data: { id: string; updates: Partial<Pilot> }): Promise<Pilot> {
  const response = await fetch(`/api/pilots/${data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify(data.updates),
  })

  if (!response.ok) {
    throw new Error('Failed to update pilot')
  }

  const result = await response.json()
  return result.data
}

/**
 * Hook: Get all pilots
 *
 * Fetches and caches the full pilot list with automatic background refetching.
 *
 * @param options - Additional query options
 */
export function usePilots(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.pilots.lists(),
    queryFn: fetchPilots,
    ...queryPresets.standard, // 5 minute stale time
    ...options,
  })
}

/**
 * Hook: Get single pilot by ID
 *
 * Fetches and caches a single pilot's details.
 *
 * @param id - Pilot ID
 * @param options - Additional query options
 */
export function usePilot(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.pilots.detail(id || ''),
    queryFn: () => fetchPilot(id!),
    ...queryPresets.standard,
    enabled: !!id && (options?.enabled ?? true),
  })
}

/**
 * Hook: Update pilot
 *
 * Mutation hook for updating pilot data with optimistic updates and cache invalidation.
 *
 * USAGE:
 * ```tsx
 * const updatePilot = useUpdatePilot()
 *
 * async function handleSubmit(data) {
 *   await updatePilot.mutateAsync({
 *     id: pilotId,
 *     updates: data
 *   })
 * }
 * ```
 */
export function useUpdatePilot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePilot,
    onSuccess: (data, variables) => {
      // Invalidate and refetch pilot list
      queryClient.invalidateQueries({
        queryKey: queryKeys.pilots.lists(),
      })

      // Invalidate and refetch the specific pilot
      queryClient.invalidateQueries({
        queryKey: queryKeys.pilots.detail(variables.id),
      })

      // Optionally: Update cache optimistically (without waiting for refetch)
      queryClient.setQueryData(queryKeys.pilots.detail(variables.id), data)
    },
    onError: (error) => {
      console.error('Failed to update pilot:', error)
    },
  })
}

/**
 * Hook: Prefetch pilot
 *
 * Prefetches pilot data in the background (useful for hover states, navigation).
 *
 * USAGE:
 * ```tsx
 * const prefetchPilot = usePrefetchPilot()
 *
 * <Link
 *   href={`/pilots/${pilot.id}`}
 *   onMouseEnter={() => prefetchPilot(pilot.id)}
 * >
 *   {pilot.name}
 * </Link>
 * ```
 */
export function usePrefetchPilot() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.pilots.detail(id),
      queryFn: () => fetchPilot(id),
      staleTime: queryPresets.standard.staleTime,
    })
  }
}
