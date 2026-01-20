/**
 * Form Error Alert Component
 * Reusable error display for portal forms
 * @deprecated Use FormErrorAlert from @/components/ui/feedback instead
 * Example: import { FormErrorAlert } from '@/components/ui/feedback'
 */

import { AlertCircle, X } from 'lucide-react'

interface FormErrorAlertProps {
  error: string | null
  onDismiss?: () => void
}

export function FormErrorAlert({ error, onDismiss }: FormErrorAlertProps) {
  if (!error) return null

  return (
    <div className="rounded-lg border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-[var(--color-status-high)]" aria-hidden="true" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-[var(--color-status-high)]">Submission Failed</h4>
          <p className="mt-1 text-sm text-[var(--color-status-high)]">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[var(--color-status-high)]/70 transition-colors hover:text-[var(--color-status-high)]"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
