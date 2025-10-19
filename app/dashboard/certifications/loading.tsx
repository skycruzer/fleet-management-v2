/**
 * Certifications Page Loading State
 * Displays skeleton for certifications list with stats
 */

import { Card } from '@/components/ui/card'
import { Skeleton, MetricCardSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function CertificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-44 rounded-md" />
      </div>

      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </Card>
      </div>

      {/* Certifications Table Skeleton */}
      <Card className="p-6 bg-white">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="overflow-x-auto">
          <TableSkeleton rows={10} columns={7} />
        </div>
      </Card>
    </div>
  )
}
