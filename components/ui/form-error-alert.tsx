/**
 * Form Error Alert Component
 * Standardized error display for form validation and submission errors
 *
 * Developer: Maurice Rondeau
 * @date January 2026
 */

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FormErrorAlertProps {
  /** The error message to display */
  message: string
  /** Optional title - defaults to "Error" */
  title?: string
  /** Optional className for additional styling */
  className?: string
}

/**
 * A standardized form error alert component using the design system.
 * Provides consistent error display across all forms with proper accessibility.
 *
 * @example
 * ```tsx
 * {error && <FormErrorAlert message={error} />}
 * ```
 */
export function FormErrorAlert({ message, title = 'Error', className }: FormErrorAlertProps) {
  return (
    <Alert variant="destructive" className={className} aria-live="assertive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
