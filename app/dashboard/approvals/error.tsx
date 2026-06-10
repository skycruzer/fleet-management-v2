'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ApprovalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Approvals hub error:', error)
  }, [error])

  return (
    <div className="w-full px-4 py-8 lg:px-6">
      <Card className="mx-auto max-w-md p-8 text-center">
        <h2 className="text-foreground text-lg font-semibold">Couldn&apos;t load the queue</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Something went wrong while loading pending approvals. Your queue is unchanged — retry to
          reload it.
        </p>
        <Button variant="primary" size="sm" className="mt-4" onClick={reset}>
          Retry
        </Button>
      </Card>
    </div>
  )
}
