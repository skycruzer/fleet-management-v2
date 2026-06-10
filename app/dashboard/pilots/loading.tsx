/**
 * Pilots Page Loading State
 * Mirrors the actual page layout: header, stats bar, filter bar,
 * view toggle, and the default cards-grid view.
 */

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function PilotsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-full rounded-md sm:w-32" />
      </div>

      {/* Stats Bar Skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border-border rounded-xl border p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* View Toggle Skeleton */}
      <Skeleton className="h-10 w-full rounded-lg sm:w-72" />

      {/* Pilot Cards Grid Skeleton (default view) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    </div>
  )
}
