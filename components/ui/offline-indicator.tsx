'use client'

/**
 * OfflineIndicator Component
 *
 * Shows a persistent banner when the user is offline.
 * Auto-hides when connection is restored with a brief "Back Online" confirmation.
 *
 * Features:
 * - Real-time online/offline detection
 * - Smooth framer-motion animations
 * - Accessibility compliant (ARIA labels, role="alert")
 * - Auto-hide "Back Online" message after 5 seconds
 * - Non-intrusive top banner design
 * - Hydration-safe (renders after mount to prevent SSR mismatch)
 */

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  // Start with null to prevent hydration mismatch - we don't know online status until client mount
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Set mounted and actual online status after hydration
    setMounted(true)
    setIsOnline(navigator.onLine)

    // Handlers for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)

      // Hide the "back online" message after 5 seconds
      const timeoutId = setTimeout(() => {
        setWasOffline(false)
      }, 5000)

      return () => clearTimeout(timeoutId)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't render anything until after hydration to prevent mismatch
  if (!mounted) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 left-0 z-50 bg-[var(--color-status-high)] text-white shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">You&apos;re Offline</p>
                  <p className="text-xs text-white/90">
                    Changes will be saved and synced when connection is restored
                  </p>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="bg-muted/50 hover:bg-muted/80 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                aria-label="Retry connection"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Back Online Banner */}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 left-0 z-50 bg-[var(--color-status-low)] text-white shadow-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Back Online</p>
                <p className="text-xs text-white/90">
                  Connection restored. Syncing pending changes...
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Compact Offline Badge
 *
 * Shows a small badge in the navigation bar.
 * Alternative to the full banner for compact spaces.
 */
export function OfflineBadge() {
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't render until after hydration or when online
  if (!mounted || isOnline) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className="flex items-center gap-2 rounded-full bg-[var(--color-status-high-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-status-high)]"
    >
      <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-status-high)]" />
      <span>Offline</span>
    </motion.div>
  )
}
