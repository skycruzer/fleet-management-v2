/**
 * Portal Form Wrapper Component
 * Provides consistent structure for all pilot portal forms
 * Eliminates duplication of error alerts, submit buttons, and cancel logic
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { FormErrorAlert } from '@/components/portal/form-error-alert'
import { SubmitButton } from '@/components/portal/submit-button'

export interface PortalFormWrapperProps {
  /** Form submission handler */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  /** Form fields content */
  children: ReactNode
  /** Is form submitting */
  isSubmitting: boolean
  /** Form error (if any) */
  error: string | null
  /** Reset error handler */
  resetError: () => void
  /** Submit button text */
  submitText: string
  /** Show cancel button */
  showCancel?: boolean
  /** Cancel button text */
  cancelText?: string
  /** Custom cancel handler (defaults to router.back()) */
  onCancel?: () => void
  /** Additional form className */
  className?: string
}

/**
 * Portal form wrapper that provides consistent structure
 * for all pilot portal forms (leave requests, flight requests, feedback)
 */
export function PortalFormWrapper({
  onSubmit,
  children,
  isSubmitting,
  error,
  resetError,
  submitText,
  showCancel = true,
  cancelText = 'Cancel',
  onCancel,
  className = '',
}: PortalFormWrapperProps) {
  const router = useRouter()

  const handleCancel = onCancel || (() => router.back())

  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {/* Error Alert */}
      <FormErrorAlert error={error} onDismiss={resetError} />

      {/* Form Fields */}
      {children}

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 border-t pt-6">
        {showCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            {cancelText}
          </button>
        )}
        <SubmitButton isSubmitting={isSubmitting}>{submitText}</SubmitButton>
      </div>
    </form>
  )
}
