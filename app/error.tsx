'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/services/logging-service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

/**
 * Global Error Boundary
 * Catches unhandled errors in the React component tree
 * Logs errors to Better Stack and displays user-friendly error message
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Better Stack
    logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
      component: 'GlobalErrorBoundary',
    })
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Error Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
            <p className="text-gray-600">
              We've been notified and are working on a fix. Please try again.
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="w-full rounded-lg bg-gray-100 p-4 text-left">
              <p className="font-mono text-sm break-words text-gray-700">{error.message}</p>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-500">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex w-full gap-3">
            <Button onClick={reset} className="flex-1" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
