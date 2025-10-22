/**
 * Standardized Error Alert Component
 * Displays error messages consistently across the application
 * Integrates with the centralized error messages utility
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
 * Get icon based on error severity
 */
function getErrorIcon(severity: ErrorSeverity) {
  switch (severity) {
    case 'info':
      return Info
    case 'warning':
      return AlertTriangle
    case 'error':
      return AlertCircle
    case 'critical':
      return XCircle
    default:
      return AlertCircle
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

  const Icon = getErrorIcon(errorMessage.severity)
  const variant = getAlertVariant(errorMessage.severity)
  const title = getErrorTitle(errorMessage.severity)

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{errorMessage.message}</AlertDescription>
        {errorMessage.action && (
          <p className="mt-1 text-xs text-muted-foreground">{errorMessage.action}</p>
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
export function SuccessAlert({
  message,
  onDismiss,
}: {
  message: string
  onDismiss?: () => void
}) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <AlertCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
      <div className="flex flex-1 items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </div>
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
