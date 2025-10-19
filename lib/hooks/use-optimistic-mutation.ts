/**
 * Optimistic Mutation Hook
 * Provides instant UI feedback for mutations with automatic rollback on errors
 *
 * Uses React 19's useOptimistic for seamless optimistic updates
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useOptimistic, useTransition, useState } from 'react'

export type OptimisticAction = 'create' | 'update' | 'delete'

export interface OptimisticUpdate<T> {
  action: OptimisticAction
  data: T
  tempId?: string // Temporary ID for create operations
}

export interface MutationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  optimisticData?: Partial<T>
}

export interface OptimisticMutationResult<T> {
  data: T[]
  isPending: boolean
  error: Error | null
  mutate: (update: OptimisticUpdate<T>, options?: MutationOptions<T>) => Promise<void>
  reset: () => void
}

/**
 * Custom hook for optimistic mutations
 *
 * @example
 * ```tsx
 * const { data: pilots, mutate, isPending } = useOptimisticMutation(
 *   initialPilots,
 *   async (update) => {
 *     const response = await fetch('/api/pilots', {
 *       method: 'POST',
 *       body: JSON.stringify(update.data)
 *     })
 *     return response.json()
 *   }
 * )
 *
 * // Create with optimistic update
 * await mutate({
 *   action: 'create',
 *   data: newPilot,
 *   tempId: 'temp-1'
 * })
 * ```
 */
export function useOptimisticMutation<T extends { id: string }>(
  initialData: T[],
  mutationFn: (update: OptimisticUpdate<T>) => Promise<T>
): OptimisticMutationResult<T> {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)
  const [optimisticData, setOptimisticData] = useOptimistic(
    initialData,
    (state: T[], update: OptimisticUpdate<T>) => {
      switch (update.action) {
        case 'create':
          // Add new item with temporary ID
          return [
            ...state,
            { ...update.data, id: update.tempId || `temp-${Date.now()}` } as T,
          ]
        case 'update':
          // Update existing item
          return state.map((item) =>
            item.id === update.data.id ? { ...item, ...update.data } : item
          )
        case 'delete':
          // Remove item
          return state.filter((item) => item.id !== update.data.id)
        default:
          return state
      }
    }
  )

  const mutate = async (
    update: OptimisticUpdate<T>,
    options?: MutationOptions<T>
  ) => {
    setError(null)

    startTransition(async () => {
      // Apply optimistic update immediately
      setOptimisticData(update)

      try {
        // Perform actual mutation
        const result = await mutationFn(update)

        // Call success callback
        if (options?.onSuccess) {
          options.onSuccess(result)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed')
        setError(error)

        // Call error callback
        if (options?.onError) {
          options.onError(error)
        }

        // Note: useOptimistic will automatically rollback the state
        // when the transition completes with an error
      }
    })
  }

  const reset = () => {
    setError(null)
  }

  return {
    data: optimisticData,
    isPending,
    error,
    mutate,
    reset,
  }
}

/**
 * Hook for optimistic updates with TanStack Query integration
 *
 * @example
 * ```tsx
 * const { mutate } = useOptimisticQuery(
 *   ['pilots'],
 *   queryClient,
 *   async (update) => {
 *     const response = await fetch('/api/pilots', {
 *       method: 'POST',
 *       body: JSON.stringify(update.data)
 *     })
 *     return response.json()
 *   }
 * )
 * ```
 */
export function useOptimisticQuery<T extends { id: string }>(
  queryKey: string[],
  queryClient: any,
  mutationFn: (update: OptimisticUpdate<T>) => Promise<T>
) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (
    update: OptimisticUpdate<T>,
    options?: MutationOptions<T>
  ) => {
    setError(null)

    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey })

    // Snapshot the previous value
    const previousData = queryClient.getQueryData(queryKey) as T[] | undefined

    startTransition(async () => {
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old: T[] = []) => {
        switch (update.action) {
          case 'create':
            return [
              ...old,
              { ...update.data, id: update.tempId || `temp-${Date.now()}` } as T,
            ]
          case 'update':
            return old.map((item) =>
              item.id === update.data.id ? { ...item, ...update.data } : item
            )
          case 'delete':
            return old.filter((item) => item.id !== update.data.id)
          default:
            return old
        }
      })

      try {
        // Perform actual mutation
        const result = await mutationFn(update)

        // Update cache with real data
        queryClient.setQueryData(queryKey, (old: T[] = []) => {
          switch (update.action) {
            case 'create':
              // Replace temp item with real item
              return old.map((item) =>
                item.id === update.tempId ? result : item
              )
            case 'update':
              return old.map((item) =>
                item.id === result.id ? result : item
              )
            default:
              return old
          }
        })

        // Call success callback
        if (options?.onSuccess) {
          options.onSuccess(result)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed')
        setError(error)

        // Rollback to previous data on error
        queryClient.setQueryData(queryKey, previousData)

        // Call error callback
        if (options?.onError) {
          options.onError(error)
        }
      }
    })
  }

  return {
    mutate,
    isPending,
    error,
  }
}
