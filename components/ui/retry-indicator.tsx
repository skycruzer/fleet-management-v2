/**
 * Retry Indicator Component
 *
 * Displays retry status and progress to users during network failures.
 * Provides visual feedback for automatic retry attempts.
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw, WifiOff } from 'lucide-react'

// ===================================
// TYPES
// ===================================

export interface RetryIndicatorProps {
  /** Whether retry is in progress */
  isRetrying: boolean
  /** Status message to display */
  statusMessage?: string
  /** Retry progress (0-100) */
  progress?: number
  /** Current attempt number */
  attempt?: number
  /** Maximum retry attempts */
  maxRetries?: number
  /** Variant style */
  variant?: 'default' | 'compact' | 'toast'
  /** Custom class name */
  className?: string
  /** Show progress bar */
  showProgress?: boolean
  /** Custom retry icon */
  icon?: React.ReactNode
}

// ===================================
// COMPONENT
// ===================================

/**
 * Retry Indicator Component
 *
 * @example
 * ```tsx
 * const { isRetrying, statusMessage, progress, retryState } = useRetryState()
 *
 * return (
 *   <div>
 *     <RetryIndicator
 *       isRetrying={isRetrying}
 *       statusMessage={statusMessage}
 *       progress={progress}
 *       attempt={retryState.attempt}
 *       maxRetries={retryState.maxRetries}
 *     />
 *     <YourContent />
 *   </div>
 * )
 * ```
 */
export function RetryIndicator({
  isRetrying,
  statusMessage,
  progress = 0,
  attempt = 0,
  maxRetries = 3,
  variant = 'default',
  className,
  showProgress = true,
  icon,
}: RetryIndicatorProps) {
  if (!isRetrying) {
    return null
  }

  const defaultIcon = <RefreshCw className="h-4 w-4 animate-spin" />
  const displayIcon = icon || defaultIcon

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-[var(--color-info-bg)] px-3 py-1 text-sm text-[var(--color-info-foreground)]',
          className
        )}
      >
        {displayIcon}
        <span className="font-medium">Retrying...</span>
      </div>
    )
  }

  if (variant === 'toast') {
    return (
      <div
        className={cn(
          'fixed right-4 bottom-4 z-50 flex min-w-[300px] items-center gap-3 rounded-lg',
          'bg-background border border-[var(--color-info-border)] p-4 shadow-lg',
          className
        )}
      >
        <div className="flex-shrink-0">{displayIcon}</div>
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">
            {statusMessage || 'Retrying request...'}
          </p>
          {showProgress && (
            <div className="mt-2">
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="h-full bg-[var(--color-info)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Attempt {attempt}/{maxRetries}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex-shrink-0 text-[var(--color-info)]">{displayIcon}</div>

      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--color-info-foreground)]">
          {statusMessage || 'Connection issue. Retrying...'}
        </p>

        {showProgress && (
          <div className="mt-2 space-y-2">
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full bg-[var(--color-info)] transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-info)]">
              Retry attempt {attempt} of {maxRetries}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===================================
// NETWORK ERROR BANNER
// ===================================

export interface NetworkErrorBannerProps {
  /** Whether to show the banner */
  show: boolean
  /** Error message */
  message?: string
  /** Retry handler */
  onRetry?: () => void
  /** Custom class name */
  className?: string
}

/**
 * Network Error Banner with retry button
 *
 * @example
 * ```tsx
 * const [showError, setShowError] = useState(false)
 *
 * return (
 *   <NetworkErrorBanner
 *     show={showError}
 *     message="Failed to load data after multiple attempts"
 *     onRetry={() => {
 *       setShowError(false)
 *       loadData()
 *     }}
 *   />
 * )
 * ```
 */
export function NetworkErrorBanner({
  show,
  message = 'Network connection error. Please check your connection and try again.',
  onRetry,
  className,
}: NetworkErrorBannerProps) {
  if (!show) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-4',
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0 text-[var(--color-status-high)]">
        <WifiOff className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--color-status-high-foreground)]">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'flex items-center gap-2 rounded-md bg-[var(--color-status-high)] px-3 py-1.5 text-sm font-medium text-white',
            'hover:opacity-90 focus:ring-2 focus:ring-[var(--color-status-high)] focus:ring-offset-2 focus:outline-none'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  )
}

// ===================================
// INLINE RETRY STATUS
// ===================================

export interface InlineRetryStatusProps {
  /** Whether retry is in progress */
  isRetrying: boolean
  /** Custom retry message */
  message?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom class name */
  className?: string
}

/**
 * Inline retry status (minimal UI)
 *
 * @example
 * ```tsx
 * <InlineRetryStatus isRetrying={isRetrying} message="Loading..." />
 * ```
 */
export function InlineRetryStatus({
  isRetrying,
  message = 'Retrying...',
  size = 'md',
  className,
}: InlineRetryStatusProps) {
  if (!isRetrying) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs gap-1.5',
    md: 'text-sm gap-2',
    lg: 'text-base gap-2.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center text-[var(--color-info)]',
        sizeClasses[size],
        className
      )}
    >
      <RefreshCw className={cn('animate-spin', iconSizes[size])} />
      <span className="font-medium">{message}</span>
    </div>
  )
}
