/**
 * React Hook for Deduplicated Form Submissions
 *
 * Provides form submission deduplication to prevent duplicate API calls
 * when users rapidly click submit buttons or submit forms multiple times.
 *
 * Features:
 * - Prevents duplicate submissions while request is in-flight
 * - Tracks submission state (isSubmitting)
 * - Automatic cleanup on component unmount
 * - Works with any form submission logic
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createDeduplicatedSubmitHandler } from '@/lib/request-deduplication'

/**
 * Options for the deduplicated submit hook
 */
export interface UseDeduplicatedSubmitOptions {
  /**
   * Unique key to identify this form submission
   * Used to prevent duplicate submissions across component instances
   */
  key: string

  /**
   * Optional callback when submission succeeds
   */
  onSuccess?: () => void

  /**
   * Optional callback when submission fails
   */
  onError?: (error: Error) => void
}

/**
 * Return type for the deduplicated submit hook
 */
export interface UseDeduplicatedSubmitReturn<T> {
  /**
   * Wrapped submit handler that prevents duplicates
   */
  handleSubmit: (data: T) => Promise<void>

  /**
   * Whether a submission is currently in progress
   */
  isSubmitting: boolean

  /**
   * Error from the last submission (if any)
   */
  error: Error | null

  /**
   * Reset the submission state
   */
  reset: () => void
}

/**
 * Hook for form submission deduplication
 *
 * Wraps a form submission function to prevent duplicate submissions
 * when users rapidly click submit or when multiple components trigger
 * the same submission.
 *
 * @param submitFn - The original submit function
 * @param options - Configuration options
 * @returns Object with wrapped submit handler and state
 *
 * @example
 * ```typescript
 * function PilotForm() {
 *   const { handleSubmit, isSubmitting } = useDeduplicatedSubmit(
 *     async (data) => {
 *       await fetch('/api/pilots', {
 *         method: 'POST',
 *         body: JSON.stringify(data)
 *       })
 *     },
 *     { key: 'pilot-form' }
 *   )
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(handleSubmit)}>
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Creating...' : 'Create Pilot'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useDeduplicatedSubmit<T>(
  submitFn: (data: T) => Promise<void>,
  options: UseDeduplicatedSubmitOptions
): UseDeduplicatedSubmitReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Create the deduplicated submit handler
  const handleSubmit = useCallback(
    async (data: T) => {
      // Prevent submission if already submitting
      if (isSubmitting) {
        return
      }

      try {
        setIsSubmitting(true)
        setError(null)

        // Use the deduplication utility
        const deduplicatedSubmit = createDeduplicatedSubmitHandler(submitFn, options.key)

        await deduplicatedSubmit(data)

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          options.onSuccess?.()
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Submission failed')

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(error)
          options.onError?.(error)
        }

        // Re-throw error so it can be handled by the caller
        throw error
      } finally {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setIsSubmitting(false)
        }
      }
    },
    [submitFn, options, isSubmitting]
  )

  // Reset function to clear error state
  const reset = useCallback(() => {
    setError(null)
  }, [])

  return {
    handleSubmit,
    isSubmitting,
    error,
    reset,
  }
}

/**
 * Hook for preventing double-clicks on action buttons
 *
 * Similar to useDeduplicatedSubmit but for button click handlers.
 * Useful for preventing duplicate API calls from rapid button clicks.
 *
 * @param actionFn - The action to execute
 * @param options - Configuration options
 * @returns Object with wrapped action handler and state
 *
 * @example
 * ```typescript
 * function DeleteButton({ pilotId }) {
 *   const { handleAction, isProcessing } = useDeduplicatedAction(
 *     async () => {
 *       await fetch(`/api/pilots/${pilotId}`, { method: 'DELETE' })
 *     },
 *     { key: `delete-pilot-${pilotId}` }
 *   )
 *
 *   return (
 *     <button onClick={handleAction} disabled={isProcessing}>
 *       {isProcessing ? 'Deleting...' : 'Delete'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useDeduplicatedAction(
  actionFn: () => Promise<void>,
  options: UseDeduplicatedSubmitOptions
) {
  const { handleSubmit, isSubmitting, error, reset } = useDeduplicatedSubmit<void>(
    actionFn,
    options
  )

  // Wrap handleSubmit to not require data parameter
  const handleAction = useCallback(async () => {
    await handleSubmit(undefined as void)
  }, [handleSubmit])

  return {
    handleAction,
    isProcessing: isSubmitting,
    error,
    reset,
  }
}
