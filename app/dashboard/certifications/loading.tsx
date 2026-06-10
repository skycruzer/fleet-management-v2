/**
 * Certifications Page Loading State
 * Mirrors the actual page layout: header with Export/Add actions,
 * 4 quick-stat cards, search/status filter bar, and the 6-column table.
 */

import { Card } from '@/components/ui/card'
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function CertificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-44 rounded-md" />
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>
      </Card>

      {/* Certifications Table Skeleton */}
      <Card className="p-4">
        <TableSkeleton rows={8} columns={6} />
      </Card>
    </div>
  )
}
