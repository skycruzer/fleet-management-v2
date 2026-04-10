/**
 * Optimistic Certification Hook
 * Provides instant UI feedback for certification updates with automatic rollback on error
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { logger } from '@/lib/services/logging-service'
import { queryKeys } from '@/lib/react-query/query-client'

interface CertificationUpdateData {
  id: string
  pilot_id: string
  check_date?: string
  expiry_date?: string
  notes?: string
  is_current?: boolean
}

interface CertificationItem {
  id: string
  pilot_id: string
  check_type_id: string
  check_date: string
  expiry_date: string
  notes: string | null
  is_current: boolean
  updated_at: string
  _optimistic?: boolean
  [key: string]: unknown
}

interface CertificationsQueryData {
  data: CertificationItem[]
  [key: string]: unknown
}

interface PilotQueryData {
  certifications?: CertificationItem[]
  [key: string]: unknown
}

interface CertificationResponse {
  success: boolean
  data?: CertificationItem
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
      await queryClient.cancelQueries({ queryKey: queryKeys.certifications.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.pilots.detail(updatedCert.pilot_id) })

      // Snapshot previous values
      const previousCertifications = queryClient.getQueryData(queryKeys.certifications.all)
      const previousPilot = queryClient.getQueryData(queryKeys.pilots.detail(updatedCert.pilot_id))

      // Optimistically update certifications list
      queryClient.setQueryData<CertificationsQueryData | undefined>(
        queryKeys.certifications.all,
        (old) => {
          if (!old?.data) return old

          return {
            ...old,
            data: old.data.map((cert) =>
              cert.id === updatedCert.id
                ? {
                    ...cert,
                    ...updatedCert,
                    _optimistic: true,
                    updated_at: new Date().toISOString(),
                  }
                : cert
            ),
          }
        }
      )

      // Optimistically update pilot details if cached
      queryClient.setQueryData<PilotQueryData | undefined>(
        queryKeys.pilots.detail(updatedCert.pilot_id),
        (old) => {
          if (!old) return old

          return {
            ...old,
            certifications: old.certifications?.map((cert) =>
              cert.id === updatedCert.id ? { ...cert, ...updatedCert, _optimistic: true } : cert
            ),
          }
        }
      )

      return { previousCertifications, previousPilot }
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // Rollback certifications list
      if (context?.previousCertifications) {
        queryClient.setQueryData(queryKeys.certifications.all, context.previousCertifications)
      }

      // Rollback pilot details
      if (context?.previousPilot) {
        queryClient.setQueryData(queryKeys.pilots.detail(variables.pilot_id), context.previousPilot)
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
      queryClient.invalidateQueries({ queryKey: queryKeys.certifications.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.pilots.detail(variables.pilot_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pilots.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.compliance })
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
      await queryClient.cancelQueries({ queryKey: queryKeys.certifications.all })
      const previousCertifications = queryClient.getQueryData(queryKeys.certifications.all)

      queryClient.setQueryData<CertificationsQueryData | undefined>(
        queryKeys.certifications.all,
        (old) => {
          if (!old) return old

          const optimisticCert: CertificationItem = {
            id: `temp-${Date.now()}`,
            pilot_id: newCert.pilot_id,
            check_type_id: newCert.check_type_id,
            check_date: newCert.check_date,
            expiry_date: newCert.expiry_date,
            notes: newCert.notes ?? null,
            is_current: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _optimistic: true,
          }

          return {
            ...old,
            data: [optimisticCert, ...(old.data || [])],
          }
        }
      )

      return { previousCertifications }
    },

    onError: (error, _variables, context) => {
      if (context?.previousCertifications) {
        queryClient.setQueryData(queryKeys.certifications.all, context.previousCertifications)
      }

      logger.error('Certification creation failed', {
        error: error.message,
        component: 'useOptimisticCertificationCreate',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certifications.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.pilots.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.compliance })
    },

    onSuccess: (data) => {
      logger.info('Certification created successfully', {
        certificationId: data.data?.id,
        component: 'useOptimisticCertificationCreate',
      })
    },
  })
}
