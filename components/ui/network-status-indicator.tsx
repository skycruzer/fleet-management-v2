/**
 * Network Status Indicator Component
 *
 * Displays the current network connectivity status to users.
 * Shows banners, badges, or inline indicators for offline/online state.
 *
 * Features:
 * - Multiple display variants (banner, badge, inline)
 * - Auto-hide when online (configurable)
 * - Reconnection button support
 * - Accessible ARIA attributes
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { WifiOff, Wifi, AlertCircle, RefreshCw } from 'lucide-react'

// ===================================
// TYPES
// ===================================

export interface NetworkStatusIndicatorProps {
  /** Whether the network is online */
  isOnline: boolean
  /** Variant style */
  variant?: 'banner' | 'badge' | 'inline' | 'floating'
  /** Show only when offline (auto-hide when online) */
  showOnlyWhenOffline?: boolean
  /** Custom offline message */
  offlineMessage?: string
  /** Custom online message */
  onlineMessage?: string
  /** Show reconnect button */
  showReconnectButton?: boolean
  /** Reconnect handler */
  onReconnect?: () => void
  /** Whether reconnection is in progress */
  isReconnecting?: boolean
  /** Custom class name */
  className?: string
  /** Position for floating variant */
  position?: 'top' | 'bottom'
}

// ===================================
// COMPONENT
// ===================================

/**
 * Network Status Indicator
 *
 * @example
 * ```tsx
 * import { useOnlineStatus } from '@/lib/hooks/use-online-status'
 * import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator'
 *
 * function MyPage() {
 *   const { isOnline } = useOnlineStatus()
 *
 *   return (
 *     <div>
 *       <NetworkStatusIndicator
 *         isOnline={isOnline}
 *         variant="banner"
 *         showOnlyWhenOffline={true}
 *       />
 *       <YourContent />
 *     </div>
 *   )
 * }
 * ```
 */
export function NetworkStatusIndicator({
  isOnline,
  variant = 'banner',
  showOnlyWhenOffline = true,
  offlineMessage = 'You are currently offline. Some features may be unavailable.',
  onlineMessage = 'Connected',
  showReconnectButton = false,
  onReconnect,
  isReconnecting = false,
  className,
  position = 'top',
}: NetworkStatusIndicatorProps) {
  // Hide when online if showOnlyWhenOffline is true
  if (showOnlyWhenOffline && isOnline) {
    return null
  }

  const Icon = isOnline ? Wifi : WifiOff
  const message = isOnline ? onlineMessage : offlineMessage

  // Banner variant (full-width alert)
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-between gap-4 px-4 py-3',
          isOnline
            ? 'border-b border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]'
            : 'border-b border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              'h-5 w-5',
              isOnline ? 'text-[var(--color-status-low)]' : 'text-[var(--color-status-high)]'
            )}
          />
          <p
            className={cn(
              'text-sm font-medium',
              isOnline
                ? 'text-[var(--color-status-low-foreground)]'
                : 'text-[var(--color-status-high-foreground)]'
            )}
          >
            {message}
          </p>
        </div>

        {showReconnectButton && !isOnline && onReconnect && (
          <button
            onClick={onReconnect}
            disabled={isReconnecting}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
              'bg-[var(--color-status-high)] text-white hover:opacity-90',
              'focus:ring-2 focus:ring-[var(--color-status-high)] focus:ring-offset-2 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <RefreshCw className={cn('h-4 w-4', isReconnecting && 'animate-spin')} />
            {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
          </button>
        )}
      </div>
    )
  }

  // Badge variant (compact pill)
  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
          isOnline
            ? 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low-foreground)]'
            : 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high-foreground)]',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Icon className="h-3 w-3" />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    )
  }

  // Inline variant (minimal text)
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 text-sm',
          isOnline ? 'text-[var(--color-status-low)]' : 'text-[var(--color-status-high)]',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Icon className="h-4 w-4" />
        <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    )
  }

  // Floating variant (toast-like)
  if (variant === 'floating') {
    return (
      <div
        className={cn(
          'fixed left-1/2 z-50 flex min-w-[300px] -translate-x-1/2 items-center gap-3',
          'rounded-lg border shadow-lg',
          position === 'top' ? 'top-4' : 'bottom-4',
          isOnline
            ? 'border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]'
            : 'border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div
          className={cn(
            'flex items-center gap-3 p-4',
            showReconnectButton && !isOnline ? 'flex-1' : 'w-full'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              isOnline ? 'text-[var(--color-status-low)]' : 'text-[var(--color-status-high)]'
            )}
          />
          <p
            className={cn(
              'text-sm font-medium',
              isOnline
                ? 'text-[var(--color-status-low-foreground)]'
                : 'text-[var(--color-status-high-foreground)]'
            )}
          >
            {message}
          </p>
        </div>

        {showReconnectButton && !isOnline && onReconnect && (
          <div className="border-l border-[var(--color-status-high-border)] p-4">
            <button
              onClick={onReconnect}
              disabled={isReconnecting}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
                'bg-[var(--color-status-high)] text-white hover:opacity-90',
                'focus:ring-2 focus:ring-[var(--color-status-high)] focus:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isReconnecting && 'animate-spin')} />
              {isReconnecting ? 'Reconnecting...' : 'Retry'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ===================================
// OFFLINE WARNING COMPONENT
// ===================================

export interface OfflineWarningProps {
  /** Whether to show the warning */
  show?: boolean
  /** Custom message */
  message?: string
  /** Show icon */
  showIcon?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Simple offline warning (yellow alert)
 *
 * @example
 * ```tsx
 * const { isOffline } = useOnlineStatus()
 *
 * return (
 *   <div>
 *     <OfflineWarning show={isOffline} />
 *     <YourForm />
 *   </div>
 * )
 * ```
 */
export function OfflineWarning({
  show = true,
  message = 'You are offline. Changes may not be saved.',
  showIcon = true,
  className,
}: OfflineWarningProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-4',
        className
      )}
      role="alert"
    >
      {showIcon && (
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--color-status-medium)]" />
      )}
      <p className="text-sm font-medium text-[var(--color-status-medium-foreground)]">{message}</p>
    </div>
  )
}

// ===================================
// NETWORK STATUS BADGE
// ===================================

export interface NetworkStatusBadgeProps {
  /** Whether the network is online */
  isOnline: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show text label */
  showLabel?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Compact network status badge with dot indicator
 *
 * @example
 * ```tsx
 * const { isOnline } = useOnlineStatus()
 *
 * return (
 *   <div className="flex items-center gap-2">
 *     <h1>Dashboard</h1>
 *     <NetworkStatusBadge isOnline={isOnline} size="sm" />
 *   </div>
 * )
 * ```
 */
export function NetworkStatusBadge({
  isOnline,
  size = 'md',
  showLabel = false,
  className,
}: NetworkStatusBadgeProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)} role="status">
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          isOnline ? 'bg-[var(--color-status-low)]' : 'animate-pulse bg-[var(--color-status-high)]'
        )}
        aria-label={isOnline ? 'Online' : 'Offline'}
      />
      {showLabel && (
        <span
          className={cn(
            'font-medium',
            textSizeClasses[size],
            isOnline ? 'text-[var(--color-status-low)]' : 'text-[var(--color-status-high)]'
          )}
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  )
}
