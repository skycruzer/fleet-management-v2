/**
 * Pilots Page Loading State
 * Displays skeleton for pilots list with filters
 */

import { Card } from '@/components/ui/card'
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function PilotsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Filter Card Skeleton */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Pilots Table Skeleton */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <TableSkeleton rows={8} columns={6} />
        </div>
      </Card>

      {/* Summary Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  )
}
