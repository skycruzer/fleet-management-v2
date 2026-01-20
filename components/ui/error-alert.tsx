/**
 * Standardized Error Alert Component
 * @deprecated Use components from @/components/ui/feedback instead:
 * - ErrorAlert -> ErrorFeedback
 * - FormErrorAlert -> FormErrorAlert (from feedback.tsx)
 * - SuccessAlert -> SuccessFeedback
 *
 * The feedback.tsx component provides a unified API with better
 * accessibility, variant support, and consistent styling.
 */

import { AlertCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { ErrorMessage } from '@/lib/utils/error-messages'
import { getErrorTitle, ErrorCategory, ErrorSeverity } from '@/lib/utils/error-messages'

interface ErrorAlertProps {
  error: ErrorMessage | string
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

/**
 * Icon component based on error severity
 */
function ErrorIcon({ severity }: { severity: ErrorSeverity }) {
  const iconProps = { className: 'h-4 w-4', 'aria-hidden': true as const }
  switch (severity) {
    case 'info':
      return <Info {...iconProps} />
    case 'warning':
      return <AlertTriangle {...iconProps} />
    case 'error':
      return <AlertCircle {...iconProps} />
    case 'critical':
      return <XCircle {...iconProps} />
    default:
      return <AlertCircle {...iconProps} />
  }
}

/**
 * Get alert variant based on severity
 */
function getAlertVariant(severity: ErrorSeverity): 'default' | 'destructive' {
  return severity === 'error' || severity === 'critical' ? 'destructive' : 'default'
}

/**
 * Standardized error alert component
 *
 * @example
 * ```tsx
 * // With ErrorMessage object
 * <ErrorAlert error={ERROR_MESSAGES.PILOT.FETCH_FAILED} />
 *
 * // With custom error string
 * <ErrorAlert error="Something went wrong" />
 *
 * // With dismissal
 * <ErrorAlert error={error} onDismiss={() => setError(null)} />
 *
 * // With retry action
 * <ErrorAlert error={error} onRetry={handleRetry} />
 * ```
 */
export function ErrorAlert({ error, onDismiss, onRetry, className }: ErrorAlertProps) {
  // Handle string errors
  const errorMessage: ErrorMessage =
    typeof error === 'string'
      ? {
          message: error,
          category: ErrorCategory.CLIENT,
          severity: ErrorSeverity.ERROR,
        }
      : error

  const variant = getAlertVariant(errorMessage.severity)
  const title = getErrorTitle(errorMessage.severity)

  return (
    <Alert variant={variant} className={className}>
      <ErrorIcon severity={errorMessage.severity} />
      <div className="flex flex-1 flex-col gap-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{errorMessage.message}</AlertDescription>
        {errorMessage.action && (
          <p className="text-muted-foreground mt-1 text-xs">{errorMessage.action}</p>
        )}
        {(onRetry || onDismiss) && (
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="ml-auto"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Alert>
  )
}

/**
 * Simplified error alert for forms
 * Automatically uses destructive variant
 */
export function FormErrorAlert({
  error,
  onDismiss,
}: {
  error: string | null
  onDismiss?: () => void
}) {
  if (!error) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <div className="flex flex-1 items-start justify-between">
        <div className="flex-1">
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </div>
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

/**
 * Success alert variant
 */
export function SuccessAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <Alert className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]">
      <AlertCircle className="h-4 w-4 text-[var(--color-status-low)]" aria-hidden="true" />
      <div className="flex flex-1 items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="text-[var(--color-status-low-foreground)]">Success</AlertTitle>
          <AlertDescription className="text-[var(--color-status-low)]">{message}</AlertDescription>
        </div>
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-[var(--color-status-low)] hover:text-[var(--color-status-low-foreground)]"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
