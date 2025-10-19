'use client'

/**
 * Portal Error Boundary
 * Catches and displays errors in the pilot portal
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log error to console for debugging
    console.error('Portal error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Something went wrong
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            {error.message || 'An unexpected error occurred while loading the portal.'}
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 font-mono">
                Error ID: {error.digest}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/portal')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-gray-600">
          If this problem persists, please contact{' '}
          <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
            support@example.com
          </a>
        </p>
      </div>
    </div>
  )
}
