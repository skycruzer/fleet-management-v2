/**
 * Application Error Page
 * @author Maurice Rondeau
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="max-w-lg space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="bg-destructive/20 rounded-full p-6">
            <AlertTriangle className="text-destructive h-16 w-16" />
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-foreground text-3xl font-bold">Something went wrong</h2>

        {/* Error Message */}
        <p className="text-muted-foreground">
          {process.env.NODE_ENV === 'development'
            ? error.message || 'An unexpected error occurred'
            : 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Error ID */}
        {error.digest && (
          <p className="text-muted-foreground font-mono text-sm">Error ID: {error.digest}</p>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
      </div>
    </div>
  )
}
