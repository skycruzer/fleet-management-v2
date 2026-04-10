/**
 * Certifications Page Loading State
 * Skeleton loader for certifications management page
 */

import { Card } from '@/components/ui/card'
import { MetricCardSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function CertificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted h-8 w-48 animate-pulse rounded"></div>
          <div className="bg-muted mt-2 h-4 w-80 animate-pulse rounded"></div>
        </div>
        <div className="bg-muted h-10 w-40 animate-pulse rounded-md"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <MetricCardSkeleton count={4} />

      {/* Category Summary Skeleton */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-muted h-6 w-32 animate-pulse rounded"></div>
          <div className="bg-muted h-6 w-24 animate-pulse rounded-full"></div>
        </div>
        <div className="bg-muted mt-2 h-4 w-full animate-pulse rounded"></div>
      </Card>

      {/* Certification Groups Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((group) => (
          <Card key={group} className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="bg-muted h-6 w-48 animate-pulse rounded"></div>
              <div className="bg-muted h-5 w-5 animate-pulse rounded"></div>
            </div>
            <TableSkeleton rows={3} columns={5} />
          </Card>
        ))}
      </div>
    </div>
  )
}
