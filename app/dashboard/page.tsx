/**
 * Dashboard Page
 * Main dashboard showing fleet metrics and status
 * Individual widgets wrapped with ErrorBoundary for resilience
 * Optimized with caching and memoization for fast load times
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/skeletons'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { dashboardMetadata } from '@/lib/utils/metadata'

// Metadata for SEO
export const metadata = dashboardMetadata.home

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-foreground text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground mt-2 text-base">Fleet overview and key metrics</p>
      </div>

      {/* Dashboard Content with Skeleton Loading */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
