'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

// Segment error boundary for the EBT section. Catches any error thrown during render or from a
// Server Action whose rejected transition wasn't handled in-component (components handle their own
// failures gracefully; this is the safety net so an unexpected throw degrades to a retry prompt
// instead of a blank page). Next.js sanitizes the error message in production. Styled with theme
// tokens so it reads correctly in both light and dark mode.
export default function EbtError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('EBT section error:', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-foreground text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        The page hit an unexpected error. Your saved work is not affected — try again.
      </p>
      {error.digest && (
        <p className="text-muted-foreground mt-1 text-xs">Reference: {error.digest}</p>
      )}
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  )
}
