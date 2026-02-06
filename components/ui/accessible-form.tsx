/**
 * Accessible Form Component
 *
 * Form wrapper with built-in focus management and accessibility features
 * Complies with WCAG 2.4.3 Focus Order (Level A)
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useFormFocusManagement } from '@/lib/hooks/use-focus-management'

interface AccessibleFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /**
   * Form title (announced to screen readers)
   */
  title?: string

  /**
   * Form description (announced to screen readers)
   */
  description?: string

  /**
   * Callback when form is successfully submitted
   * Used to trigger focus on success message
   */
  onSuccess?: () => void

  /**
   * Callback when form submission fails
   * Used to trigger focus on error message
   */
  onError?: () => void

  /**
   * Children components
   */
  children: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Form component with automatic focus management
 */
export const AccessibleForm = React.forwardRef<HTMLFormElement, AccessibleFormProps>(
  ({ title, description, onSuccess, onError, children, className, ...props }, ref) => {
    const { focusFirstField } = useFormFocusManagement()
    const formId = React.useId()

    // Focus first field on mount
    React.useEffect(() => {
      focusFirstField()
    }, [focusFirstField])

    return (
      <form
        ref={ref}
        aria-labelledby={title ? `${formId}-title` : undefined}
        aria-describedby={description ? `${formId}-description` : undefined}
        className={cn('space-y-6', className)}
        {...props}
      >
        {/* Visually hidden title for screen readers */}
        {title && (
          <h2 id={`${formId}-title`} className="sr-only">
            {title}
          </h2>
        )}

        {/* Visually hidden description for screen readers */}
        {description && (
          <p id={`${formId}-description`} className="sr-only">
            {description}
          </p>
        )}

        {/* Render children */}
        {children}
      </form>
    )
  }
)

AccessibleForm.displayName = 'AccessibleForm'

/**
 * Success message component with automatic focus
 */
interface SuccessMessageProps {
  children: React.ReactNode
  className?: string
  autoFocus?: boolean
}

export const SuccessMessage = React.forwardRef<HTMLDivElement, SuccessMessageProps>(
  ({ children, className, autoFocus = true }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    const messageRef = (ref as React.RefObject<HTMLDivElement>) || localRef

    React.useEffect(() => {
      if (autoFocus && messageRef.current) {
        // Set tabindex to make it focusable
        messageRef.current.setAttribute('tabindex', '-1')
        messageRef.current.focus()

        // Remove tabindex after focus
        messageRef.current.addEventListener(
          'blur',
          () => {
            messageRef.current?.removeAttribute('tabindex')
          },
          { once: true }
        )
      }
    }, [autoFocus, messageRef])

    return (
      <div
        ref={messageRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'rounded-lg border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-4',
          'focus:ring-2 focus:ring-[var(--color-status-low)] focus:ring-offset-2 focus:outline-none',
          className
        )}
      >
        {children}
      </div>
    )
  }
)

SuccessMessage.displayName = 'SuccessMessage'

/**
 * Error message component with automatic focus
 */
interface ErrorMessageProps {
  children: React.ReactNode
  className?: string
  autoFocus?: boolean
}

export const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ children, className, autoFocus = true }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    const messageRef = (ref as React.RefObject<HTMLDivElement>) || localRef

    React.useEffect(() => {
      if (autoFocus && messageRef.current) {
        // Set tabindex to make it focusable
        messageRef.current.setAttribute('tabindex', '-1')
        messageRef.current.focus()

        // Remove tabindex after focus
        messageRef.current.addEventListener(
          'blur',
          () => {
            messageRef.current?.removeAttribute('tabindex')
          },
          { once: true }
        )
      }
    }, [autoFocus, messageRef])

    return (
      <div
        ref={messageRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={cn(
          'rounded-lg border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-4',
          'focus:ring-2 focus:ring-[var(--color-status-high)] focus:ring-offset-2 focus:outline-none',
          className
        )}
      >
        {children}
      </div>
    )
  }
)

ErrorMessage.displayName = 'ErrorMessage'

/**
 * Form field wrapper with automatic first field detection
 */
interface FormFieldProps {
  children: React.ReactNode
  isFirst?: boolean
  className?: string
}

export const AccessibleFormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, isFirst = false, className }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    const fieldRef = (ref as React.RefObject<HTMLDivElement>) || localRef

    React.useEffect(() => {
      if (isFirst && fieldRef.current) {
        // Find the first input/select/textarea in this field
        const firstInput = fieldRef.current.querySelector<HTMLElement>(
          'input, select, textarea, button'
        )
        if (firstInput) {
          firstInput.focus()
        }
      }
    }, [isFirst, fieldRef])

    return (
      <div ref={fieldRef} className={cn('space-y-2', className)}>
        {children}
      </div>
    )
  }
)

AccessibleFormField.displayName = 'AccessibleFormField'
