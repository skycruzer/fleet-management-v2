'use client'

/**
 * Dashboard Error Boundary
 * Developer: Maurice Rondeau
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-[var(--color-destructive-muted)] p-4">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            The dashboard encountered an error. Try refreshing, or return to the home page.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground font-mono text-xs break-all">{error.message}</p>
            {error.digest && (
              <p className="text-muted-foreground mt-1 font-mono text-xs">ID: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={reset} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
