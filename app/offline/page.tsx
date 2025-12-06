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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-sky-500 p-8">
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
          <div className="rounded-r border-l-4 border-amber-400 bg-amber-50 p-5">
            <div className="flex items-start">
              <Signal className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold text-amber-800">Connection Status</h3>
                <p className="text-sm text-amber-700">
                  The Fleet Management System requires an active internet connection to function
                  properly.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div className="rounded-lg bg-neutral-50 p-5">
            <h3 className="mb-3 flex items-center text-base font-semibold text-neutral-900">
              <WifiOff className="mr-2 h-5 w-5 text-sky-500" />
              Troubleshooting Steps:
            </h3>
            <ul className="space-y-3 text-sm text-neutral-700">
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <p className="mb-1 font-semibold text-neutral-900">
                    Check your Wi-Fi or network connection
                  </p>
                  <p className="text-neutral-600">
                    Make sure you&apos;re connected to a network and the signal is strong
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <p className="mb-1 font-semibold text-neutral-900">Check your router and modem</p>
                  <p className="text-neutral-600">
                    Restart your router if necessary and wait for it to reconnect
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <p className="mb-1 font-semibold text-neutral-900">
                    Try another website or application
                  </p>
                  <p className="text-neutral-600">
                    Verify if the issue is system-wide or specific to this application
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-3 flex inline-block h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  4
                </span>
                <div>
                  <p className="mb-1 font-semibold text-neutral-900">
                    Contact your network administrator
                  </p>
                  <p className="text-neutral-600">
                    If you&apos;re on a corporate network, IT may need to assist
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Network Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2">
                  <WifiOff className="h-5 w-5 text-red-600" />
                </div>
                <h4 className="font-semibold text-neutral-900">Connection</h4>
              </div>
              <p className="text-sm font-medium text-red-600">Offline</p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-neutral-100 p-2">
                  <Signal className="h-5 w-5 text-neutral-600" />
                </div>
                <h4 className="font-semibold text-neutral-900">Status</h4>
              </div>
              <p className="text-sm font-medium text-neutral-600">No internet access</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3.5 font-semibold text-white shadow-md transition-all duration-200 hover:bg-sky-600 hover:shadow-lg active:scale-95"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-800 px-6 py-3.5 font-semibold text-white shadow-md transition-all duration-200 hover:bg-black hover:shadow-lg active:scale-95"
            >
              <Home className="h-5 w-5" />
              Go to Dashboard
            </button>
          </div>

          {/* Auto-Retry Notice */}
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4">
            <p className="text-center text-xs text-blue-800">
              The application will automatically retry connecting once your internet is restored
            </p>
          </div>

          {/* Support Contact */}
          <div className="rounded-lg border border-neutral-200 bg-gradient-to-r from-neutral-100 to-neutral-50 p-4">
            <p className="text-center text-xs text-neutral-600">
              Still having connection issues?{' '}
              <a
                href="mailto:support@example.com"
                className="font-semibold text-sky-500 hover:underline"
              >
                Contact IT Support
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 bg-gradient-to-r from-neutral-100 to-neutral-50 px-8 py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-xs sm:flex-row">
            <p className="text-neutral-600">Fleet Management V2 - B767 Pilot Management System</p>
            <p className="font-bold text-sky-500">Powered by Serwist PWA</p>
          </div>
        </div>
      </div>
    </div>
  )
}
