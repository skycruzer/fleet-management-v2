/**
 * Dashboard Page
 * Developer: Maurice Rondeau
 * Main dashboard showing fleet metrics and status
 * Individual widgets wrapped with ErrorBoundary for resilience
 * Optimized with caching and memoization for fast load times
 */

import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/skeletons'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { dashboardMetadata } from '@/lib/utils/metadata'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

// Metadata for SEO
export const metadata = dashboardMetadata.home

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  return (
    <div className="w-full max-w-full space-y-8 overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Page Header — Time-of-day greeting */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          {getGreeting()}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Here&apos;s your fleet overview</p>
      </div>

      {/* Dashboard Content with Skeleton Loading */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
