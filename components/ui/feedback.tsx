'use client'

/**
 * Unified Feedback Component
 * Consolidates error, success, warning, and info feedback patterns
 * Supports inline, toast, and banner variants
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

const feedbackVariants = cva(
  'flex items-start gap-3 rounded-lg border p-4 transition-all duration-200',
  {
    variants: {
      type: {
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
      },
      variant: {
        inline: '',
        banner: 'rounded-none border-x-0 border-t-0',
        toast: 'shadow-lg border animate-slide-up-fade',
      },
    },
    defaultVariants: {
      type: 'info',
      variant: 'inline',
    },
  }
)

const iconMap: Record<string, LucideIcon> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
}

export interface FeedbackProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof feedbackVariants> {
  /** Feedback type determines color and icon */
  type: 'error' | 'warning' | 'success' | 'info'
  /** Display variant */
  variant?: 'inline' | 'banner' | 'toast'
  /** Optional title */
  title?: string
  /** Main message */
  message: string
  /** Show dismiss button */
  dismissible?: boolean
  /** Called when dismiss is clicked */
  onDismiss?: () => void
  /** Show retry button (typically for errors) */
  showRetry?: boolean
  /** Called when retry is clicked */
  onRetry?: () => void
  /** Custom icon override */
  icon?: LucideIcon
}

const Feedback = React.forwardRef<HTMLDivElement, FeedbackProps>(
  (
    {
      className,
      type,
      variant = 'inline',
      title,
      message,
      dismissible = false,
      onDismiss,
      showRetry = false,
      onRetry,
      icon,
      ...props
    },
    ref
  ) => {
    const Icon = icon || iconMap[type]

    return (
      <div
        ref={ref}
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        className={cn(feedbackVariants({ type, variant }), className)}
        {...props}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {title && <h4 className="mb-1 font-medium">{title}</h4>}
          <p className="text-sm">{message}</p>
          {showRetry && onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="mt-2 -ml-2 h-8 gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </Button>
          )}
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md p-1 opacity-70 transition-all hover:bg-black/5 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Feedback.displayName = 'Feedback'

/**
 * Error Feedback - Convenience wrapper for error type
 */
export function ErrorFeedback({
  title = 'Error',
  showRetry = true,
  ...props
}: Omit<FeedbackProps, 'type'>) {
  return <Feedback type="error" title={title} showRetry={showRetry} {...props} />
}

/**
 * Success Feedback - Convenience wrapper for success type
 */
export function SuccessFeedback({
  title = 'Success',
  dismissible = true,
  ...props
}: Omit<FeedbackProps, 'type'>) {
  return <Feedback type="success" title={title} dismissible={dismissible} {...props} />
}

/**
 * Warning Feedback - Convenience wrapper for warning type
 */
export function WarningFeedback({ title = 'Warning', ...props }: Omit<FeedbackProps, 'type'>) {
  return <Feedback type="warning" title={title} {...props} />
}

/**
 * Info Feedback - Convenience wrapper for info type
 */
export function InfoFeedback({ dismissible = true, ...props }: Omit<FeedbackProps, 'type'>) {
  return <Feedback type="info" dismissible={dismissible} {...props} />
}

/**
 * Form Error Feedback - Specialized for form submission errors
 */
export function FormErrorFeedback({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <Feedback
      type="error"
      variant="inline"
      message={message}
      showRetry={!!onRetry}
      onRetry={onRetry}
      className={cn('mb-4', className)}
    />
  )
}

/**
 * Inline Feedback - Minimal feedback for inline contexts
 */
export function InlineFeedback({
  type,
  message,
  className,
}: {
  type: 'error' | 'warning' | 'success' | 'info'
  message: string
  className?: string
}) {
  const Icon = iconMap[type]
  const colorMap = {
    error: 'text-red-600',
    warning: 'text-amber-600',
    success: 'text-emerald-600',
    info: 'text-blue-600',
  }

  return (
    <p
      className={cn('flex items-center gap-1.5 text-sm', colorMap[type], className)}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

export { Feedback, feedbackVariants }
