/**
 * Optimistic Pilot Hook
 * Provides instant UI feedback for pilot profile updates with automatic rollback on error
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { logger } from '@/lib/services/logging-service'
import { queryKeys } from '@/lib/react-query/query-client'

interface PilotUpdateData {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  role?: 'Captain' | 'First Officer'
  seniority_number?: number
  commencement_date?: string
  contract_type_id?: string
  qualifications?: Record<string, any>
  notes?: string
}

interface PilotResponse {
  success: boolean
  data?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    role: string
    seniority_number: number
    commencement_date: string
    contract_type_id: string | null
    qualifications: Record<string, any> | null
    notes: string | null
    updated_at: string
  }
  error?: string
}

/**
 * Hook for optimistic pilot profile updates
 *
 * Features:
 * - Instant UI update (optimistic)
 * - Automatic rollback on error
 * - Success/error notifications
 * - Query invalidation on success
 *
 * @example
 * const { mutate, isPending } = useOptimisticPilotUpdate()
 *
 * mutate({
 *   id: 'pilot-123',
 *   email: 'john.doe@example.com',
 *   qualifications: {
 *     line_captain: true,
 *     training_captain: false
 *   }
 * })
 */
export function useOptimisticPilotUpdate() {
  const queryClient = useQueryClient()

  return useMutation<
    PilotResponse,
    Error,
    PilotUpdateData,
    { previousPilots: unknown; previousPilot: unknown; previousGrouped: unknown }
  >({
    mutationFn: async ({ id, ...data }) => {
      const response = await fetch(`/api/pilots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update pilot')
      }

      return response.json()
    },

    // Optimistic update - runs immediately
    onMutate: async (updatedPilot) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.pilots.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.pilots.detail(updatedPilot.id) })

      // Snapshot previous values
      const previousPilots = queryClient.getQueryData(queryKeys.pilots.all)
      const previousPilot = queryClient.getQueryData(queryKeys.pilots.detail(updatedPilot.id))
      const previousGrouped = null // grouped pilots not tracked via queryKeys

      // Optimistically update pilots list
      queryClient.setQueryData(queryKeys.pilots.lists(), (old: any) => {
        if (!old?.data) return old

        return {
          ...old,
          data: old.data.map((pilot: any) =>
            pilot.id === updatedPilot.id
              ? {
                  ...pilot,
                  ...updatedPilot,
                  _optimistic: true,
                  updated_at: new Date().toISOString(),
                }
              : pilot
          ),
        }
      })

      // Optimistically update single pilot detail
      queryClient.setQueryData(queryKeys.pilots.detail(updatedPilot.id), (old: any) => {
        if (!old) return old

        return {
          ...old,
          ...updatedPilot,
          _optimistic: true,
          updated_at: new Date().toISOString(),
        }
      })

      return { previousPilots, previousPilot, previousGrouped }
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // Rollback pilots list
      if (context?.previousPilots) {
        queryClient.setQueryData(queryKeys.pilots.all, context.previousPilots)
      }

      // Rollback single pilot
      if (context?.previousPilot) {
        queryClient.setQueryData(queryKeys.pilots.detail(variables.id), context.previousPilot)
      }

      // Log error
      logger.error('Pilot update failed', {
        error: error.message,
        pilotId: variables.id,
        component: 'useOptimisticPilotUpdate',
      })
    },

    // Always refetch after success or error
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pilots.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.pilots.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.compliance })
    },

    // Success callback
    onSuccess: (data) => {
      logger.info('Pilot updated successfully', {
        pilotId: data.data?.id,
        component: 'useOptimisticPilotUpdate',
      })
    },
  })
}

/**
 * Hook for optimistic pilot creation
 */
export function useOptimisticPilotCreate() {
  const queryClient = useQueryClient()

  interface CreatePilotData {
    first_name: string
    last_name: string
    email?: string
    role: 'Captain' | 'First Officer'
    seniority_number: number
    commencement_date: string
    contract_type_id?: string
    qualifications?: Record<string, any>
    notes?: string
  }

  return useMutation<
    PilotResponse,
    Error,
    CreatePilotData,
    { previousPilots: unknown; previousGrouped: unknown }
  >({
    mutationFn: async (data) => {
      const response = await fetch('/api/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create pilot')
      }

      return response.json()
    },

    onMutate: async (newPilot) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pilots.all })

      const previousPilots = queryClient.getQueryData(queryKeys.pilots.all)
      const previousGrouped = null

      // Optimistically add to pilots list
      queryClient.setQueryData(queryKeys.pilots.lists(), (old: any) => {
        if (!old) return old

        const optimisticPilot = {
          id: `temp-${Date.now()}`,
          ...newPilot,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _optimistic: true,
        }

        return {
          ...old,
          data: [optimisticPilot, ...(old.data || [])],
        }
      })

      return { previousPilots, previousGrouped }
    },

    onError: (error, _variables, context) => {
      if (context?.previousPilots) {
        queryClient.setQueryData(queryKeys.pilots.all, context.previousPilots)
      }

      logger.error('Pilot creation failed', {
        error: error.message,
        component: 'useOptimisticPilotCreate',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pilots.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics })
    },

    onSuccess: (data) => {
      logger.info('Pilot created successfully', {
        pilotId: data.data?.id,
        component: 'useOptimisticPilotCreate',
      })
    },
  })
}
