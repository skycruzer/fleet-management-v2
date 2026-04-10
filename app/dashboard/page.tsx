/**
 * Dashboard Page
 * Developer: Maurice Rondeau
 * Main dashboard showing fleet metrics and status
 * Individual widgets wrapped with ErrorBoundary for resilience
 * Optimized with caching and memoization for fast load times
 */

import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { dashboardMetadata } from '@/lib/utils/metadata'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

// Metadata for SEO
export const metadata = dashboardMetadata.home

export default function DashboardPage() {
  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Dashboard Content with Skeleton Loading */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
