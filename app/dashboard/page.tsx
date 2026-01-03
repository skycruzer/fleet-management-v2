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
import { Breadcrumb } from '@/components/navigation/breadcrumb'

// Metadata for SEO
export const metadata = dashboardMetadata.home

export default function DashboardPage() {
  return (
    <div className="w-full max-w-full space-y-8 overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Page Header - Linear-inspired: compact, clean */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Fleet overview and key metrics</p>
      </div>

      {/* Dashboard Content with Skeleton Loading */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
