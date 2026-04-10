/**
 * Leave Requests Page Loading State
 * Displays skeleton for leave requests list with stats
 */

import { Card } from '@/components/ui/card'
import { Skeleton, MetricCardSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function LeaveLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>

      {/* Quick Stats Skeleton */}
      <MetricCardSkeleton count={4} />

      {/* Filter Card Skeleton */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Leave Requests Table Skeleton */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <TableSkeleton rows={8} columns={7} />
        </div>
      </Card>
    </div>
  )
}
