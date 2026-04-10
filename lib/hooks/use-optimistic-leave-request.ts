/**
 * Optimistic Leave Request Hook
 * Provides instant UI feedback for leave request submissions with automatic rollback on error
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { logger } from '@/lib/services/logging-service'

interface LeaveRequestData {
  pilot_id: string
  roster_period_id: string
  start_date: string
  end_date: string
  type: 'annual' | 'sick' | 'personal' | 'compassionate'
  notes?: string
}

interface LeaveRequestResponse {
  success: boolean
  data?: {
    id: string
    pilot_id: string
    roster_period_id: string
    start_date: string
    end_date: string
    type: string
    status: 'pending' | 'approved' | 'rejected'
    notes: string | null
    created_at: string
  }
  error?: string
}

/**
 * Hook for optimistic leave request creation
 *
 * Features:
 * - Instant UI update (optimistic)
 * - Automatic rollback on error
 * - Success/error notifications
 * - Query invalidation on success
 *
 * @example
 * const { mutate, isPending } = useOptimisticLeaveRequest()
 *
 * mutate({
 *   pilot_id: '123',
 *   roster_period_id: 'RP01/2025',
 *   start_date: '2025-01-15',
 *   end_date: '2025-01-20',
 *   type: 'annual'
 * })
 */
export function useOptimisticLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation<LeaveRequestResponse, Error, LeaveRequestData, { previousRequests: unknown }>({
    mutationFn: async (data: LeaveRequestData) => {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create leave request')
      }

      return response.json()
    },

    // Optimistic update - runs immediately
    onMutate: async (newRequest) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leave-requests'] })

      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(['leave-requests'])

      // Optimistically update to the new value
      queryClient.setQueryData(['leave-requests'], (old: any) => {
        if (!old) return old

        const optimisticRequest = {
          id: `temp-${Date.now()}`, // Temporary ID
          ...newRequest,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          _optimistic: true, // Flag for UI to show loading state
        }

        return {
          ...old,
          data: [optimisticRequest, ...(old.data || [])],
        }
      })

      // Return context with snapshot for rollback
      return { previousRequests }
    },

    // Rollback on error
    onError: (error, _variables, context) => {
      // Rollback to previous state
      if (context?.previousRequests) {
        queryClient.setQueryData(['leave-requests'], context.previousRequests)
      }

      // Log error
      logger.error('Leave request creation failed', {
        error: error.message,
        component: 'useOptimisticLeaveRequest',
      })
    },

    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-eligibility'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },

    // Success callback
    onSuccess: (data) => {
      logger.info('Leave request created successfully', {
        requestId: data.data?.id,
        component: 'useOptimisticLeaveRequest',
      })
    },
  })
}

/**
 * Hook for optimistic leave request update
 */
export function useOptimisticLeaveRequestUpdate() {
  const queryClient = useQueryClient()

  return useMutation<
    LeaveRequestResponse,
    Error,
    { id: string; status: 'approved' | 'rejected' },
    { previousRequests: unknown }
  >({
    mutationFn: async ({ id, status }) => {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update leave request')
      }

      return response.json()
    },

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['leave-requests'] })
      const previousRequests = queryClient.getQueryData(['leave-requests'])

      queryClient.setQueryData(['leave-requests'], (old: any) => {
        if (!old?.data) return old

        return {
          ...old,
          data: old.data.map((req: any) =>
            req.id === id ? { ...req, status, _optimistic: true } : req
          ),
        }
      })

      return { previousRequests }
    },

    onError: (error, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(['leave-requests'], context.previousRequests)
      }

      logger.error('Leave request update failed', {
        error: error.message,
        component: 'useOptimisticLeaveRequestUpdate',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-eligibility'] })
    },

    onSuccess: (data) => {
      logger.info('Leave request updated successfully', {
        requestId: data.data?.id,
        status: data.data?.status,
        component: 'useOptimisticLeaveRequestUpdate',
      })
    },
  })
}
