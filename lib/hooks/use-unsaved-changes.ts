/**
 * useUnsavedChanges Hook
 * Warns users when attempting to navigate away with unsaved form changes
 *
 * Developer: Maurice Rondeau
 * Date: November 25, 2025
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseUnsavedChangesOptions {
  /** Whether there are unsaved changes */
  hasChanges: boolean
  /** Custom warning message */
  message?: string
  /** Callback when user confirms leaving */
  onConfirmLeave?: () => void
  /** Skip warning (e.g., during form submission) */
  skipWarning?: boolean
}

/**
 * Hook to warn users about unsaved changes when navigating away
 *
 * @example
 * ```tsx
 * const { isDirty } = useForm()
 * useUnsavedChanges({
 *   hasChanges: isDirty,
 *   skipWarning: isSubmitting
 * })
 * ```
 */
export function useUnsavedChanges({
  hasChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  onConfirmLeave,
  skipWarning = false,
}: UseUnsavedChangesOptions) {
  // Handle browser back/forward and tab close
  useEffect(() => {
    if (!hasChanges || skipWarning) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers show their own message, but we set returnValue for compatibility
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges, message, skipWarning])

  // Confirm navigation helper for programmatic navigation
  const confirmNavigation = useCallback(
    (navigate: () => void) => {
      if (!hasChanges || skipWarning) {
        navigate()
        return
      }

      const confirmed = window.confirm(message)
      if (confirmed) {
        onConfirmLeave?.()
        navigate()
      }
    },
    [hasChanges, message, onConfirmLeave, skipWarning]
  )

  return { confirmNavigation }
}

/**
 * Hook for forms using react-hook-form
 * Automatically tracks form dirty state
 *
 * @example
 * ```tsx
 * const form = useForm()
 * useFormUnsavedChanges(form, { skipWarning: isSubmitting })
 * ```
 */
export function useFormUnsavedChanges(
  form: { formState: { isDirty: boolean } },
  options: Omit<UseUnsavedChangesOptions, 'hasChanges'> = {}
) {
  return useUnsavedChanges({
    hasChanges: form.formState.isDirty,
    ...options,
  })
}

/**
 * Safe navigation wrapper that respects unsaved changes
 *
 * @example
 * ```tsx
 * const { safeNavigate } = useSafeNavigation({ hasChanges: isDirty })
 * <Button onClick={() => safeNavigate('/dashboard')}>Cancel</Button>
 * ```
 */
export function useSafeNavigation(options: UseUnsavedChangesOptions) {
  const router = useRouter()
  const { confirmNavigation } = useUnsavedChanges(options)

  const safeNavigate = useCallback(
    (url: string) => {
      confirmNavigation(() => router.push(url))
    },
    [confirmNavigation, router]
  )

  const safeBack = useCallback(() => {
    confirmNavigation(() => router.back())
  }, [confirmNavigation, router])

  return { safeNavigate, safeBack }
}
