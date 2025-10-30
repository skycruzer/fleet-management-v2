/**
 * Portal Data Fetching Hooks
 *
 * Custom React Query hooks for pilot portal data fetching with caching,
 * background refetching, and optimistic updates.
 *
 * @created 2025-10-29
 * @priority Priority 3 - Performance Optimization
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

// Query Keys - Centralized for consistency and cache invalidation
export const QUERY_KEYS = {
  profile: ['portal', 'profile'] as const,
  certifications: ['portal', 'certifications'] as const,
  leaveRequests: ['portal', 'leave-requests'] as const,
  flightRequests: ['portal', 'flight-requests'] as const,
  notifications: ['portal', 'notifications'] as const,
  stats: ['portal', 'stats'] as const,
} as const

// Types
interface PilotProfile {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  rank: 'Captain' | 'First Officer'
  email: string
  phone_number: string | null
  commencement_date: string
  status: string
  contract_type: string
}

interface LeaveRequest {
  id: string
  pilot_id: string
  leave_type: string
  start_date: string
  end_date: string
  status: 'pending' | 'approved' | 'rejected'
  comments: string | null
  created_at: string
}

interface FlightRequest {
  id: string
  pilot_id: string
  requested_date: string
  flight_type: string
  departure_airport: string
  arrival_airport: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// ============================================================================
// QUERY HOOKS (Data Fetching)
// ============================================================================

/**
 * Fetch Pilot Profile
 *
 * Caches profile data for 5 minutes, refetches on window focus
 *
 * @example
 * const { data: profile, isLoading, error } = usePilotProfile()
 */
export function usePilotProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      const response = await fetch('/api/portal/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile')
      }
      return result.data as PilotProfile
    },
    // Profile data doesn't change often - cache for 10 minutes
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Fetch Pilot Certifications
 *
 * Caches certifications for 5 minutes
 *
 * @example
 * const { data: certifications, isLoading } = usePilotCertifications()
 */
export function usePilotCertifications() {
  return useQuery({
    queryKey: QUERY_KEYS.certifications,
    queryFn: async () => {
      const response = await fetch('/api/portal/certifications')
      if (!response.ok) {
        throw new Error('Failed to fetch certifications')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch certifications')
      }
      return result.data
    },
    // Certifications change monthly - cache for 5 minutes
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch Leave Requests
 *
 * Caches leave requests for 1 minute (frequently changing)
 *
 * @example
 * const { data: leaveRequests, isLoading } = useLeaveRequests()
 */
export function useLeaveRequests() {
  return useQuery({
    queryKey: QUERY_KEYS.leaveRequests,
    queryFn: async () => {
      const response = await fetch('/api/portal/leave-requests')
      if (!response.ok) {
        throw new Error('Failed to fetch leave requests')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leave requests')
      }
      return result.data as LeaveRequest[]
    },
    // Leave requests change frequently - shorter cache
    staleTime: 1000 * 60,
  })
}

/**
 * Fetch Flight Requests
 *
 * Caches flight requests for 1 minute
 *
 * @example
 * const { data: flightRequests, isLoading } = useFlightRequests()
 */
export function useFlightRequests() {
  return useQuery({
    queryKey: QUERY_KEYS.flightRequests,
    queryFn: async () => {
      const response = await fetch('/api/portal/flight-requests')
      if (!response.ok) {
        throw new Error('Failed to fetch flight requests')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch flight requests')
      }
      return result.data as FlightRequest[]
    },
    staleTime: 1000 * 60,
  })
}

/**
 * Fetch Dashboard Stats
 *
 * Caches stats for 2 minutes
 *
 * @example
 * const { data: stats } = useDashboardStats()
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: async () => {
      const response = await fetch('/api/portal/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// ============================================================================
// MUTATION HOOKS (Data Updates with Optimistic UI)
// ============================================================================

/**
 * Submit Leave Request with Optimistic Update
 *
 * Immediately updates UI before server confirms, rolls back on error
 *
 * @example
 * const mutation = useSubmitLeaveRequest()
 * mutation.mutate({ leave_type: 'ANNUAL', start_date: '...', ... })
 */
export function useSubmitLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      leave_type: string
      start_date: string
      end_date: string
      comments?: string
    }) => {
      const response = await fetch('/api/portal/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to submit leave request')
      }
      return response.json()
    },
    // Optimistic update - immediately add to UI
    onMutate: async (newRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.leaveRequests })

      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(QUERY_KEYS.leaveRequests)

      // Optimistically update to the new value
      queryClient.setQueryData(QUERY_KEYS.leaveRequests, (old: LeaveRequest[] | undefined) => [
        ...(old || []),
        {
          id: 'temp-' + Date.now(),
          pilot_id: 'pending',
          leave_type: newRequest.leave_type,
          start_date: newRequest.start_date,
          end_date: newRequest.end_date,
          status: 'pending' as const,
          comments: newRequest.comments || null,
          created_at: new Date().toISOString(),
        },
      ])

      // Return context for rollback
      return { previousRequests }
    },
    // On error, roll back to previous state
    onError: (err, newRequest, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(QUERY_KEYS.leaveRequests, context.previousRequests)
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit leave request',
      })
    },
    // On success, refetch to get server data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveRequests })
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Leave request submitted successfully',
      })
    },
  })
}

/**
 * Submit Flight Request with Optimistic Update
 *
 * @example
 * const mutation = useSubmitFlightRequest()
 * mutation.mutate({ requested_date: '...', flight_type: 'RDO', ... })
 */
export function useSubmitFlightRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      requested_date: string
      flight_type: string
      departure_airport: string
      arrival_airport: string
      comments?: string
    }) => {
      const response = await fetch('/api/portal/flight-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to submit flight request')
      }
      return response.json()
    },
    onMutate: async (newRequest) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.flightRequests })
      const previousRequests = queryClient.getQueryData(QUERY_KEYS.flightRequests)

      queryClient.setQueryData(QUERY_KEYS.flightRequests, (old: FlightRequest[] | undefined) => [
        ...(old || []),
        {
          id: 'temp-' + Date.now(),
          pilot_id: 'pending',
          requested_date: newRequest.requested_date,
          flight_type: newRequest.flight_type,
          departure_airport: newRequest.departure_airport,
          arrival_airport: newRequest.arrival_airport,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
        },
      ])

      return { previousRequests }
    },
    onError: (err, newRequest, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(QUERY_KEYS.flightRequests, context.previousRequests)
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit flight request',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flightRequests })
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Flight request submitted successfully',
      })
    },
  })
}

/**
 * Cancel Leave Request with Optimistic Update
 *
 * @example
 * const mutation = useCancelLeaveRequest()
 * mutation.mutate('leave-request-id')
 */
export function useCancelLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/portal/leave-requests/${requestId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to cancel leave request')
      }
      return response.json()
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.leaveRequests })
      const previousRequests = queryClient.getQueryData(QUERY_KEYS.leaveRequests)

      // Remove request from cache optimistically
      queryClient.setQueryData(
        QUERY_KEYS.leaveRequests,
        (old: LeaveRequest[] | undefined) => old?.filter((req) => req.id !== requestId) || []
      )

      return { previousRequests }
    },
    onError: (err, requestId, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(QUERY_KEYS.leaveRequests, context.previousRequests)
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to cancel request',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveRequests })
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Leave request cancelled successfully',
      })
    },
  })
}
