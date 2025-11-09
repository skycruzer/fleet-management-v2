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
 */

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine)

    // Handlers for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)

      // Hide the "back online" message after 5 seconds
      setTimeout(() => {
        setWasOffline(false)
      }, 5000)
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

  return (
    <AnimatePresence mode="wait">
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">You&apos;re Offline</p>
                  <p className="text-xs text-white/90">
                    Changes will be saved and synced when connection is restored
                  </p>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                aria-label="Retry connection"
              >
                <RefreshCw className="w-4 h-4" />
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
          className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white shadow-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Back Online</p>
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
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
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

  if (isOnline) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-xs font-medium"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <span>Offline</span>
    </motion.div>
  )
}
