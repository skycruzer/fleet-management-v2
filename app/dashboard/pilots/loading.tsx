/**
 * Pilots Page Loading State
 * Skeleton loader for pilots management page
 */

import { Card } from '@/components/ui/card'
import { MetricCardSkeleton, PilotListSkeleton } from '@/components/ui/skeleton'

export default function PilotsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted h-8 w-32 animate-pulse rounded"></div>
          <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded"></div>
        </div>
        <div className="bg-muted h-10 w-32 animate-pulse rounded-md"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <MetricCardSkeleton count={4} />

      {/* Group Summary Skeleton */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-muted h-6 w-48 animate-pulse rounded"></div>
          <div className="bg-muted h-5 w-32 animate-pulse rounded"></div>
        </div>
        <div className="bg-muted mt-2 h-4 w-full animate-pulse rounded"></div>
      </Card>

      {/* Pilots List Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((group) => (
          <Card key={group} className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="bg-muted h-6 w-48 animate-pulse rounded"></div>
              <div className="bg-muted h-5 w-24 animate-pulse rounded"></div>
            </div>
            <PilotListSkeleton count={3} />
          </Card>
        ))}
      </div>
    </div>
  )
}
