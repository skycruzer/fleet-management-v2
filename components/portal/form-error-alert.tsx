/**
 * Form Error Alert Component
 * Reusable error display for portal forms
 */

interface FormErrorAlertProps {
  error: string | null
  onDismiss?: () => void
}

export function FormErrorAlert({ error, onDismiss }: FormErrorAlertProps) {
  if (!error) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <span className="text-red-500 text-xl">⚠️</span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">Submission Failed</h4>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
