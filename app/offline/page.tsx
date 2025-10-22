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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-sky-500 p-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <WifiOff className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            No Internet Connection
          </h1>
          <p className="text-white/90 text-center">
            You&apos;re currently offline. Please check your connection.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Connection Status */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r">
            <div className="flex items-start">
              <Signal className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800 mb-1">
                  Connection Status
                </h3>
                <p className="text-sm text-amber-700">
                  The Fleet Management System requires an active internet
                  connection to function properly.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div className="bg-neutral-50 rounded-lg p-5">
            <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center">
              <WifiOff className="w-5 h-5 mr-2 text-sky-500" />
              Troubleshooting Steps:
            </h3>
            <ul className="space-y-3 text-sm text-neutral-700">
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-neutral-900 mb-1">
                    Check your Wi-Fi or network connection
                  </p>
                  <p className="text-neutral-600">
                    Make sure you&apos;re connected to a network and the signal
                    is strong
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-neutral-900 mb-1">
                    Check your router and modem
                  </p>
                  <p className="text-neutral-600">
                    Restart your router if necessary and wait for it to
                    reconnect
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-neutral-900 mb-1">
                    Try another website or application
                  </p>
                  <p className="text-neutral-600">
                    Verify if the issue is system-wide or specific to this
                    application
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-semibold text-neutral-900 mb-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 p-2 rounded-lg">
                  <WifiOff className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="font-semibold text-neutral-900">Connection</h4>
              </div>
              <p className="text-sm text-red-600 font-medium">Offline</p>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <Signal className="w-5 h-5 text-neutral-600" />
                </div>
                <h4 className="font-semibold text-neutral-900">Status</h4>
              </div>
              <p className="text-sm text-neutral-600 font-medium">
                No internet access
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-black text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>
          </div>

          {/* Auto-Retry Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-800 text-center">
              The application will automatically retry connecting once your
              internet is restored
            </p>
          </div>

          {/* Support Contact */}
          <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-lg p-4 border border-neutral-200">
            <p className="text-xs text-neutral-600 text-center">
              Still having connection issues?{' '}
              <a
                href="mailto:support@example.com"
                className="text-sky-500 hover:underline font-semibold"
              >
                Contact IT Support
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 px-8 py-4 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p className="text-neutral-600">
              Fleet Management V2 - B767 Pilot Management System
            </p>
            <p className="text-sky-500 font-bold">Powered by Serwist PWA</p>
          </div>
        </div>
      </div>
    </div>
  )
}
