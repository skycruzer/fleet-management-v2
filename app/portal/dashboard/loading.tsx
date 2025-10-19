/**
 * Portal Dashboard Loading State
 * Displays skeleton for pilot portal dashboard
 */

import { Card } from '@/components/ui/card'
import { Skeleton, MetricCardSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function PortalDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Skeleton */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome Card Skeleton */}
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 bg-white/20" />
              <Skeleton className="h-4 w-48 bg-white/20" />
            </div>
          </Card>

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          </div>

          {/* Stats Grid Skeleton */}
          <MetricCardSkeleton count={4} />

          {/* Recent Activity Skeleton */}
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
