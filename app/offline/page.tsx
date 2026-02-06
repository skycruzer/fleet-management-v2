'use client'

import { useEffect } from 'react'
import { WifiOff, RefreshCw, Home, Signal } from 'lucide-react'

/**
 * Offline Fallback Page
 *
 * Displays when the user is offline and attempts to navigate.
 * Service worker (app/sw.ts) redirects document requests to this page when offline.
 *
 * Features:
 * - Auto-reload when connection restored
 * - Clear troubleshooting steps
 * - Brand-consistent design
 * - Accessible (ARIA labels, keyboard navigation)
 */
export default function Offline() {
  // Auto-reload when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return (
    <div className="from-background to-muted/30 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="bg-card w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl">
        {/* Header */}
        <div className="bg-[var(--color-primary-500)] p-8">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-white/10 p-4 backdrop-blur-sm">
              <WifiOff className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-4xl font-bold text-white">No Internet Connection</h1>
          <p className="text-center text-white/90">
            You&apos;re currently offline. Please check your connection.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 p-8">
          {/* Connection Status */}
          <div className="rounded-r border-l-4 border-[var(--color-warning-400)] bg-[var(--color-warning-muted)] p-5">
            <div className="flex items-start">
              <Signal className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-[var(--color-warning-400)]" />
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold text-[var(--color-warning-400)]">
                  Connection Status
                </h3>
                <p className="text-sm text-[var(--color-warning-400)]">
                  The Fleet Management System requires an active internet connection to function
                  properly.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div className="bg-muted/30 rounded-lg p-5">
            <h3 className="text-foreground mb-3 flex items-center text-base font-semibold">
              <WifiOff className="mr-2 h-5 w-5 text-[var(--color-primary-500)]" />
              Troubleshooting Steps:
            </h3>
            <ul className="text-foreground/80 space-y-3 text-sm">
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <p className="text-foreground mb-1 font-semibold">
                    Check your Wi-Fi or network connection
                  </p>
                  <p className="text-muted-foreground">
                    Make sure you&apos;re connected to a network and the signal is strong
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <p className="text-foreground mb-1 font-semibold">Check your router and modem</p>
                  <p className="text-muted-foreground">
                    Restart your router if necessary and wait for it to reconnect
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <p className="text-foreground mb-1 font-semibold">
                    Try another website or application
                  </p>
                  <p className="text-muted-foreground">
                    Verify if the issue is system-wide or specific to this application
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">
                  4
                </span>
                <div>
                  <p className="text-foreground mb-1 font-semibold">
                    Contact your network administrator
                  </p>
                  <p className="text-muted-foreground">
                    If you&apos;re on a corporate network, IT may need to assist
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Network Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-card border-border rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-[var(--color-destructive-muted)] p-2">
                  <WifiOff className="h-5 w-5 text-[var(--color-danger-600)]" />
                </div>
                <h4 className="text-foreground font-semibold">Connection</h4>
              </div>
              <p className="text-sm font-medium text-[var(--color-danger-600)]">Offline</p>
            </div>

            <div className="bg-card border-border rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="bg-muted/60 rounded-lg p-2">
                  <Signal className="text-muted-foreground h-5 w-5" />
                </div>
                <h4 className="text-foreground font-semibold">Status</h4>
              </div>
              <p className="text-muted-foreground text-sm font-medium">No internet access</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-500)] px-6 py-3.5 font-semibold text-white shadow-md transition-all duration-200 hover:bg-[var(--color-primary-600)] hover:shadow-lg active:scale-95"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="bg-muted flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-semibold text-white shadow-md transition-all duration-200 hover:bg-black hover:shadow-lg active:scale-95"
            >
              <Home className="h-5 w-5" />
              Go to Dashboard
            </button>
          </div>

          {/* Auto-Retry Notice */}
          <div className="rounded-lg border border-[var(--color-primary-500)]/20 bg-gradient-to-r from-[var(--color-primary-500)]/10 to-[var(--color-primary-500)]/5 p-4">
            <p className="text-center text-xs text-[var(--color-info)]">
              The application will automatically retry connecting once your internet is restored
            </p>
          </div>

          {/* Support Contact */}
          <div className="border-border rounded-lg border bg-gradient-to-r from-white/[0.06] to-white/[0.03] p-4">
            <p className="text-muted-foreground text-center text-xs">
              Still having connection issues?{' '}
              <a
                href="mailto:support@example.com"
                className="font-semibold text-[var(--color-primary-500)] hover:underline"
              >
                Contact IT Support
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-border border-t bg-gradient-to-r from-white/[0.06] to-white/[0.03] px-8 py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-xs sm:flex-row">
            <p className="text-muted-foreground">
              Fleet Management V2 - B767 Pilot Management System
            </p>
            <p className="font-bold text-[var(--color-primary-500)]">Powered by Serwist PWA</p>
          </div>
        </div>
      </div>
    </div>
  )
}
