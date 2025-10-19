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
            ? 'border-b border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
            : 'border-b border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              'h-5 w-5',
              isOnline
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          />
          <p
            className={cn(
              'text-sm font-medium',
              isOnline
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
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
              'bg-red-600 text-white hover:bg-red-700',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-red-500 dark:hover:bg-red-600'
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
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
          isOnline
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400',
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
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
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
              isOnline
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          />
          <p
            className={cn(
              'text-sm font-medium',
              isOnline
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            )}
          >
            {message}
          </p>
        </div>

        {showReconnectButton && !isOnline && onReconnect && (
          <div className="border-l border-red-200 p-4 dark:border-red-800">
            <button
              onClick={onReconnect}
              disabled={isReconnecting}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
                'bg-red-600 text-white hover:bg-red-700',
                'focus:outline-none focus:ring-2 focus:ring-red-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'dark:bg-red-500 dark:hover:bg-red-600'
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
        'flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4',
        'dark:border-yellow-800 dark:bg-yellow-950',
        className
      )}
      role="alert"
    >
      {showIcon && (
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
      )}
      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">{message}</p>
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
          isOnline
            ? 'bg-green-500 dark:bg-green-400'
            : 'bg-red-500 dark:bg-red-400 animate-pulse'
        )}
        aria-label={isOnline ? 'Online' : 'Offline'}
      />
      {showLabel && (
        <span
          className={cn(
            'font-medium',
            textSizeClasses[size],
            isOnline ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          )}
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  )
}
