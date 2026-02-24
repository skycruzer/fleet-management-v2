/**
 * Optimistic Certification Hook
 * Provides instant UI feedback for certification updates with automatic rollback on error
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { logger } from '@/lib/services/logging-service'

interface CertificationUpdateData {
  id: string
  check_date?: string
  expiry_date?: string
  notes?: string
  is_current?: boolean
}

interface CertificationResponse {
  success: boolean
  data?: {
    id: string
    pilot_id: string
    check_type_id: string
    check_date: string
    expiry_date: string
    notes: string | null
    is_current: boolean
    updated_at: string
  }
  error?: string
}

/**
 * Hook for optimistic certification updates
 *
 * Features:
 * - Instant UI update (optimistic)
 * - Automatic rollback on error
 * - Success/error notifications
 * - Query invalidation on success
 *
 * @example
 * const { mutate, isPending } = useOptimisticCertificationUpdate()
 *
 * mutate({
 *   id: 'cert-123',
 *   check_date: '2025-01-15',
 *   expiry_date: '2026-01-15',
 *   is_current: true
 * })
 */
export function useOptimisticCertificationUpdate() {
  const queryClient = useQueryClient()

  return useMutation<
    CertificationResponse,
    Error,
    CertificationUpdateData,
    { previousCertifications: unknown; previousPilot: unknown }
  >({
    mutationFn: async ({ id, ...data }) => {
      const response = await fetch(`/api/certifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update certification')
      }

      return response.json()
    },

    // Optimistic update - runs immediately
    onMutate: async (updatedCert) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['certifications'] })
      await queryClient.cancelQueries({ queryKey: ['pilot', updatedCert.id] })

      // Snapshot previous values
      const previousCertifications = queryClient.getQueryData(['certifications'])
      const previousPilot = queryClient.getQueryData(['pilot', updatedCert.id])

      // Optimistically update certifications list
      queryClient.setQueryData(['certifications'], (old: any) => {
        if (!old?.data) return old

        return {
          ...old,
          data: old.data.map((cert: any) =>
            cert.id === updatedCert.id
              ? { ...cert, ...updatedCert, _optimistic: true, updated_at: new Date().toISOString() }
              : cert
          ),
        }
      })

      // Optimistically update pilot details if cached
      queryClient.setQueryData(['pilot', updatedCert.id], (old: any) => {
        if (!old) return old

        return {
          ...old,
          certifications: old.certifications?.map((cert: any) =>
            cert.id === updatedCert.id ? { ...cert, ...updatedCert, _optimistic: true } : cert
          ),
        }
      })

      return { previousCertifications, previousPilot }
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // Rollback certifications list
      if (context?.previousCertifications) {
        queryClient.setQueryData(['certifications'], context.previousCertifications)
      }

      // Rollback pilot details
      if (context?.previousPilot) {
        queryClient.setQueryData(['pilot', variables.id], context.previousPilot)
      }

      // Log error
      logger.error('Certification update failed', {
        error: error.message,
        certificationId: variables.id,
        component: 'useOptimisticCertificationUpdate',
      })
    },

    // Always refetch after success or error
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] })
      queryClient.invalidateQueries({ queryKey: ['pilot', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['expiring-certifications'] })
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
    },

    // Success callback
    onSuccess: (data) => {
      logger.info('Certification updated successfully', {
        certificationId: data.data?.id,
        component: 'useOptimisticCertificationUpdate',
      })
    },
  })
}

/**
 * Hook for optimistic certification creation
 */
export function useOptimisticCertificationCreate() {
  const queryClient = useQueryClient()

  interface CreateCertificationData {
    pilot_id: string
    check_type_id: string
    check_date: string
    expiry_date: string
    notes?: string
  }

  return useMutation<
    CertificationResponse,
    Error,
    CreateCertificationData,
    { previousCertifications: unknown }
  >({
    mutationFn: async (data) => {
      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create certification')
      }

      return response.json()
    },

    onMutate: async (newCert) => {
      await queryClient.cancelQueries({ queryKey: ['certifications'] })
      const previousCertifications = queryClient.getQueryData(['certifications'])

      queryClient.setQueryData(['certifications'], (old: any) => {
        if (!old) return old

        const optimisticCert = {
          id: `temp-${Date.now()}`,
          ...newCert,
          is_current: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _optimistic: true,
        }

        return {
          ...old,
          data: [optimisticCert, ...(old.data || [])],
        }
      })

      return { previousCertifications }
    },

    onError: (error, _variables, context) => {
      if (context?.previousCertifications) {
        queryClient.setQueryData(['certifications'], context.previousCertifications)
      }

      logger.error('Certification creation failed', {
        error: error.message,
        component: 'useOptimisticCertificationCreate',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
    },

    onSuccess: (data) => {
      logger.info('Certification created successfully', {
        certificationId: data.data?.id,
        component: 'useOptimisticCertificationCreate',
      })
    },
  })
}
