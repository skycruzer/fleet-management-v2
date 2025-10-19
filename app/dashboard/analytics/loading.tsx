/**
 * Analytics Page Loading State
 * Displays skeleton for analytics dashboard with charts
 */

import { Card } from '@/components/ui/card'
import { Skeleton, MetricCardSkeleton, ChartSkeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      {/* Quick Metrics Skeleton */}
      <MetricCardSkeleton count={4} />

      {/* Charts Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton height={320} />
        <ChartSkeleton height={320} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton height={280} />
        <ChartSkeleton height={280} />
      </div>

      {/* Additional Info Card Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </Card>
    </div>
  )
}
