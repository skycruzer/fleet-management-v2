/**
 * React Hook for Online/Offline Status Detection
 *
 * Provides real-time network connectivity status monitoring.
 * Detects when the user goes offline or comes back online.
 *
 * Features:
 * - Automatic online/offline detection via Navigator.onLine
 * - Event listeners for online/offline events
 * - Optional callback hooks for status changes
 * - SSR-safe (returns true on server)
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ===================================
// TYPES
// ===================================

export interface UseOnlineStatusOptions {
  /** Callback when going online */
  onOnline?: () => void
  /** Callback when going offline */
  onOffline?: () => void
  /** Debounce delay in ms (default: 0) */
  debounceDelay?: number
}

export interface UseOnlineStatusReturn {
  /** Whether the browser is online */
  isOnline: boolean
  /** Whether the browser is offline */
  isOffline: boolean
  /** Time of last status change (ISO string) */
  lastChanged: string | null
  /** Manual status check (returns current navigator.onLine value) */
  checkStatus: () => boolean
}

// ===================================
// HOOK
// ===================================

/**
 * Hook for monitoring online/offline status
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, isOffline, lastChanged } = useOnlineStatus({
 *     onOffline: () => {
 *       console.log('Connection lost!')
 *       toast.error('You are offline')
 *     },
 *     onOnline: () => {
 *       console.log('Connection restored!')
 *       toast.success('Back online')
 *     },
 *   })
 *
 *   return (
 *     <div>
 *       {isOffline && (
 *         <NetworkStatusBanner
 *           isOnline={isOnline}
 *           message="You are currently offline"
 *         />
 *       )}
 *       <YourContent />
 *     </div>
 *   )
 * }
 * ```
 */
export function useOnlineStatus(options: UseOnlineStatusOptions = {}): UseOnlineStatusReturn {
  const { onOnline, onOffline, debounceDelay = 0 } = options

  // Initialize with navigator.onLine (SSR-safe)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return true // Assume online on server
  })

  const [lastChanged, setLastChanged] = useState<string | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbacksRef = useRef({ onOnline, onOffline })

  // Keep callbacks ref up to date
  useEffect(() => {
    callbacksRef.current = { onOnline, onOffline }
  }, [onOnline, onOffline])

  /**
   * Update online status with debouncing
   */
  const updateStatus = useCallback(
    (online: boolean) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      const applyUpdate = () => {
        setIsOnline(online)
        setLastChanged(new Date().toISOString())

        // Trigger callbacks
        if (online) {
          callbacksRef.current.onOnline?.()
        } else {
          callbacksRef.current.onOffline?.()
        }
      }

      if (debounceDelay > 0) {
        debounceTimeoutRef.current = setTimeout(applyUpdate, debounceDelay)
      } else {
        applyUpdate()
      }
    },
    [debounceDelay]
  )

  /**
   * Manual status check
   */
  const checkStatus = useCallback((): boolean => {
    if (typeof window === 'undefined') return true
    return navigator.onLine
  }, [])

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => updateStatus(true)
    const handleOffline = () => updateStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      // Clear any pending debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [updateStatus])

  return {
    isOnline,
    isOffline: !isOnline,
    lastChanged,
    checkStatus,
  }
}

// ===================================
// HELPER HOOKS
// ===================================

/**
 * Hook that returns true when offline (shorthand)
 *
 * @example
 * ```tsx
 * const isOffline = useIsOffline()
 *
 * if (isOffline) {
 *   return <OfflineMessage />
 * }
 * ```
 */
export function useIsOffline(): boolean {
  const { isOffline } = useOnlineStatus()
  return isOffline
}

/**
 * Hook that returns true when online (shorthand)
 *
 * @example
 * ```tsx
 * const isOnline = useIsOnline()
 *
 * return (
 *   <button disabled={!isOnline}>
 *     Submit
 *   </button>
 * )
 * ```
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus()
  return isOnline
}

/**
 * Hook with automatic reconnection handler
 *
 * @example
 * ```tsx
 * const { isOnline, reconnect } = useOnlineStatusWithReconnect({
 *   onReconnect: async () => {
 *     // Refresh data when connection restored
 *     await refetchData()
 *   },
 * })
 * ```
 */
export function useOnlineStatusWithReconnect(options: {
  /** Function to call when reconnecting */
  onReconnect?: () => void | Promise<void>
  /** Auto-reconnect when coming back online */
  autoReconnect?: boolean
}) {
  const { onReconnect, autoReconnect = true } = options
  const [isReconnecting, setIsReconnecting] = useState(false)
  const reconnectRef = useRef(onReconnect)

  // Keep reconnect ref up to date
  useEffect(() => {
    reconnectRef.current = onReconnect
  }, [onReconnect])

  const { isOnline, isOffline, lastChanged } = useOnlineStatus({
    onOnline: () => {
      if (autoReconnect && reconnectRef.current) {
        handleReconnect()
      }
    },
  })

  const handleReconnect = useCallback(async () => {
    if (!reconnectRef.current) return

    setIsReconnecting(true)
    try {
      await reconnectRef.current()
    } finally {
      setIsReconnecting(false)
    }
  }, [])

  return {
    isOnline,
    isOffline,
    lastChanged,
    isReconnecting,
    reconnect: handleReconnect,
  }
}
