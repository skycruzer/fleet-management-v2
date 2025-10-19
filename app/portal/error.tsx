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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-lg">
        {/* Error Card */}
        <div className="border-destructive/20 rounded-lg border p-8 shadow-lg">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <svg
                className="h-12 w-12 text-red-600"
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
          <h1 className="text-foreground mb-2 text-center text-2xl font-bold">
            Something went wrong
          </h1>

          {/* Message */}
          <p className="text-muted-foreground mb-6 text-center">
            {error.message || 'An unexpected error occurred while loading the portal.'}
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div className="bg-muted/50 border-border mb-6 rounded-lg border p-4">
              <p className="text-muted-foreground font-mono text-xs">Error ID: {error.digest}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={reset}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/portal')}
              className="border-border text-card-foreground hover:bg-muted/50 flex-1 rounded-lg border px-6 py-3 font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-muted-foreground mt-6 text-center text-sm">
          If this problem persists, please contact{' '}
          <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
            support@example.com
          </a>
        </p>
      </div>
    </div>
  )
}
