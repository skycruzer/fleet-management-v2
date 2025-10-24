/**
 * Optimistic Pilot Hook
 * Provides instant UI feedback for pilot profile updates with automatic rollback on error
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/services/logging-service'

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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      await queryClient.cancelQueries({ queryKey: ['pilots'] })
      await queryClient.cancelQueries({ queryKey: ['pilot', updatedPilot.id] })
      await queryClient.cancelQueries({ queryKey: ['pilots-grouped'] })

      // Snapshot previous values
      const previousPilots = queryClient.getQueryData(['pilots'])
      const previousPilot = queryClient.getQueryData(['pilot', updatedPilot.id])
      const previousGrouped = queryClient.getQueryData(['pilots-grouped'])

      // Optimistically update pilots list
      queryClient.setQueryData(['pilots'], (old: any) => {
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
      queryClient.setQueryData(['pilot', updatedPilot.id], (old: any) => {
        if (!old) return old

        return {
          ...old,
          ...updatedPilot,
          _optimistic: true,
          updated_at: new Date().toISOString(),
        }
      })

      // Optimistically update grouped pilots (used in pilots page)
      queryClient.setQueryData(['pilots-grouped'], (old: any) => {
        if (!old) return old

        // Update pilot in the appropriate rank group
        const newGrouped = { ...old }
        const pilotRole = updatedPilot.role || 'Captain'

        if (newGrouped[pilotRole]) {
          newGrouped[pilotRole] = newGrouped[pilotRole].map((pilot: any) =>
            pilot.id === updatedPilot.id ? { ...pilot, ...updatedPilot, _optimistic: true } : pilot
          )
        }

        return newGrouped
      })

      return { previousPilots, previousPilot, previousGrouped }
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // Rollback pilots list
      if (context?.previousPilots) {
        queryClient.setQueryData(['pilots'], context.previousPilots)
      }

      // Rollback single pilot
      if (context?.previousPilot) {
        queryClient.setQueryData(['pilot', variables.id], context.previousPilot)
      }

      // Rollback grouped pilots
      if (context?.previousGrouped) {
        queryClient.setQueryData(['pilots-grouped'], context.previousGrouped)
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
      queryClient.invalidateQueries({ queryKey: ['pilots'] })
      queryClient.invalidateQueries({ queryKey: ['pilot', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['pilots-grouped'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create pilot')
      }

      return response.json()
    },

    onMutate: async (newPilot) => {
      await queryClient.cancelQueries({ queryKey: ['pilots'] })
      await queryClient.cancelQueries({ queryKey: ['pilots-grouped'] })

      const previousPilots = queryClient.getQueryData(['pilots'])
      const previousGrouped = queryClient.getQueryData(['pilots-grouped'])

      // Optimistically add to pilots list
      queryClient.setQueryData(['pilots'], (old: any) => {
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

      // Optimistically add to grouped pilots
      queryClient.setQueryData(['pilots-grouped'], (old: any) => {
        if (!old) return old

        const optimisticPilot = {
          id: `temp-${Date.now()}`,
          ...newPilot,
          _optimistic: true,
        }

        const newGrouped = { ...old }
        if (newGrouped[newPilot.role]) {
          newGrouped[newPilot.role] = [optimisticPilot, ...newGrouped[newPilot.role]]
        }

        return newGrouped
      })

      return { previousPilots, previousGrouped }
    },

    onError: (error, _variables, context) => {
      if (context?.previousPilots) {
        queryClient.setQueryData(['pilots'], context.previousPilots)
      }

      if (context?.previousGrouped) {
        queryClient.setQueryData(['pilots-grouped'], context.previousGrouped)
      }

      logger.error('Pilot creation failed', {
        error: error.message,
        component: 'useOptimisticPilotCreate',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pilots'] })
      queryClient.invalidateQueries({ queryKey: ['pilots-grouped'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },

    onSuccess: (data) => {
      logger.info('Pilot created successfully', {
        pilotId: data.data?.id,
        component: 'useOptimisticPilotCreate',
      })
    },
  })
}
