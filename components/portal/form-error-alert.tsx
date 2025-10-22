/**
 * Form Error Alert Component
 * Reusable error display for portal forms
 * @deprecated Use FormErrorAlert from @/components/ui/error-alert instead
 */

import { AlertCircle, X } from 'lucide-react'

interface FormErrorAlertProps {
  error: string | null
  onDismiss?: () => void
}

export function FormErrorAlert({ error, onDismiss }: FormErrorAlertProps) {
  if (!error) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">Submission Failed</h4>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 transition-colors hover:text-red-600"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
