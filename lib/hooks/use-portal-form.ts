import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Reusable form hook for portal forms
 * Handles common form state: loading, error, success
 * Supports optimistic UI updates for instant feedback
 *
 * @version 2.0.0 - Added optimistic update support
 * @since 2025-10-19
 */

interface UsePortalFormOptions {
  onSuccess?: (data: any) => void
  successRedirect?: string
  successMessage?: string
  enableOptimistic?: boolean // Enable optimistic updates
  optimisticFeedback?: string // Message to show during optimistic update
}

interface PortalFormState {
  isSubmitting: boolean
  error: string | null
  success: boolean
  optimisticSuccess: boolean // Optimistic success state
}

export function usePortalForm(options: UsePortalFormOptions = {}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<PortalFormState>({
    isSubmitting: false,
    error: null,
    success: false,
    optimisticSuccess: false,
  })

  const handleSubmit = async (
    submitFn: () => Promise<{ success: boolean; error?: string; message?: string }>
  ) => {
    try {
      // Show optimistic success immediately if enabled
      if (options.enableOptimistic) {
        setState({
          isSubmitting: true,
          error: null,
          success: false,
          optimisticSuccess: true,
        })
      } else {
        setState({
          isSubmitting: true,
          error: null,
          success: false,
          optimisticSuccess: false,
        })
      }

      // Use transition for optimistic updates
      if (options.enableOptimistic) {
        startTransition(async () => {
          const result = await submitFn()

          if (result.success) {
            setState({ isSubmitting: false, error: null, success: true, optimisticSuccess: false })

            // Call onSuccess callback if provided
            if (options.onSuccess) {
              options.onSuccess(result)
            }

            // Redirect if successRedirect is provided
            if (options.successRedirect) {
              const redirectUrl = options.successMessage
                ? `${options.successRedirect}?success=${encodeURIComponent(options.successMessage)}`
                : options.successRedirect

              router.push(redirectUrl)
              router.refresh()
            }
          } else {
            // Rollback optimistic state on error
            setState({
              isSubmitting: false,
              error: result.error || 'An unexpected error occurred',
              success: false,
              optimisticSuccess: false,
            })
          }
        })
      } else {
        // Standard non-optimistic flow
        const result = await submitFn()

        if (result.success) {
          setState({ isSubmitting: false, error: null, success: true, optimisticSuccess: false })

          // Call onSuccess callback if provided
          if (options.onSuccess) {
            options.onSuccess(result)
          }

          // Redirect if successRedirect is provided
          if (options.successRedirect) {
            const redirectUrl = options.successMessage
              ? `${options.successRedirect}?success=${encodeURIComponent(options.successMessage)}`
              : options.successRedirect

            router.push(redirectUrl)
            router.refresh()
          }
        } else {
          setState({
            isSubmitting: false,
            error: result.error || 'An unexpected error occurred',
            success: false,
            optimisticSuccess: false,
          })
        }
      }
    } catch (err) {
      setState({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
        success: false,
        optimisticSuccess: false,
      })
    }
  }

  const resetError = () => {
    setState((prev) => ({ ...prev, error: null }))
  }

  const resetForm = () => {
    setState({ isSubmitting: false, error: null, success: false, optimisticSuccess: false })
  }

  return {
    ...state,
    isPending, // Expose transition pending state
    handleSubmit,
    resetError,
    resetForm,
  }
}
