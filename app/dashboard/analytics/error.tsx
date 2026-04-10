'use client'

/**
 * Analytics Error Boundary
 * Developer: Maurice Rondeau
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Analytics page error:', error)
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
          <h2 className="text-2xl font-semibold tracking-tight">Failed to load analytics</h2>
          <p className="text-muted-foreground text-sm">
            There was a problem loading analytics data. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground font-mono text-xs break-all">{error.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={reset} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
