/**
 * React Query Hooks for Certifications
 *
 * Custom hooks for certification data with automatic caching and refetching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { queryKeys, queryPresets } from '../query-client'

/**
 * Certification Type (simplified)
 */
interface Certification {
  id: string
  pilot_id: string
  check_type_id: string
  date_completed: string
  expiry_date: string
  result: string
  notes: string | null
  // ... other fields
}

/**
 * Fetch all certifications
 */
async function fetchCertifications(): Promise<Certification[]> {
  const response = await fetch('/api/certifications')
  if (!response.ok) {
    throw new Error('Failed to fetch certifications')
  }
  const result = await response.json()
  return result.data || []
}

/**
 * Fetch expiring certifications
 */
async function fetchExpiringCertifications(days: number = 30): Promise<Certification[]> {
  const response = await fetch(`/api/certifications?expiring_within=${days}`)
  if (!response.ok) {
    throw new Error('Failed to fetch expiring certifications')
  }
  const result = await response.json()
  return result.data || []
}

/**
 * Hook: Get all certifications
 */
export function useCertifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.certifications.lists(),
    queryFn: fetchCertifications,
    ...queryPresets.standard, // 5 minute stale time
    ...options,
  })
}

/**
 * Hook: Get expiring certifications
 *
 * Fetches certifications expiring within specified days.
 * Uses shorter stale time for real-time critical data.
 */
export function useExpiringCertifications(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.certifications.expiring(days),
    queryFn: () => fetchExpiringCertifications(days),
    ...queryPresets.realtime, // 30 second stale time (critical data)
  })
}

/**
 * Hook: Update certification
 */
export function useUpdateCertification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Certification> }) => {
      const response = await fetch(`/api/certifications/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(data.updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update certification')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.certifications.all,
      })

      // Also invalidate dashboard and analytics that depend on certifications
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.metrics,
      })
    },
  })
}
