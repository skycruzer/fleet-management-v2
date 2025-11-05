/**
 * Global Error Handler
 * Root error boundary for the entire application
 * @author Maurice Rondeau
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error)
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="text-center space-y-6 max-w-lg">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/20 p-6">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-4xl font-bold text-foreground">
              Application Error
            </h1>

            {/* Error Message */}
            <p className="text-muted-foreground text-lg">
              {process.env.NODE_ENV === 'development'
                ? error.message || 'An unexpected error occurred'
                : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>

            {/* Error ID (Production) */}
            {error.digest && (
              <p className="text-sm text-muted-foreground font-mono">
                Error ID: {error.digest}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button onClick={() => reset()} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => (window.location.href = '/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Support Information */}
            <p className="text-sm text-muted-foreground mt-6">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
