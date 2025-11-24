import { memo, Suspense } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getDashboardMetrics, type DashboardMetrics } from '@/lib/services/dashboard-service'
import { ErrorBoundary } from '@/components/error-boundary'
import { UrgentAlertBanner } from '@/components/dashboard/urgent-alert-banner'
import { UnifiedComplianceCard } from '@/components/dashboard/unified-compliance-card'
import { CompactRosterDisplay } from '@/components/dashboard/compact-roster-display'
import { ExpiringCertificationsBannerServer } from '@/components/dashboard/expiring-certifications-banner-server'
import { PilotRequirementsCard } from '@/components/dashboard/pilot-requirements-card'
import { RetirementForecastCard } from '@/components/dashboard/retirement-forecast-card'
import { Star, User, Calendar, Plus, FileText, BarChart3 } from 'lucide-react'
import { unifiedCacheService } from '@/lib/services/unified-cache-service'

// Cached data fetching function
async function getCachedDashboardData(): Promise<DashboardMetrics> {
  const cacheKey = 'dashboard:metrics'

  return unifiedCacheService.getOrSet(
    cacheKey,
    async () => await getDashboardMetrics(),
    60 * 1000 // 60 seconds in milliseconds
  )
}

export async function DashboardContent() {
  // Fetch dashboard data with caching
  const metrics = await getCachedDashboardData()

  return (
    <div className="w-full max-w-full space-y-3 overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* ROSTER PERIODS - Current + Next 13 - TOP OF PAGE */}
      <ErrorBoundary>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
          <CompactRosterDisplay />
        </Suspense>
      </ErrorBoundary>

      {/* PILOT STAFFING REQUIREMENTS - Required vs Actual */}
      <ErrorBoundary>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
          <PilotRequirementsCard />
        </Suspense>
      </ErrorBoundary>

      {/* RETIREMENT FORECAST - 2 and 5 Year Outlook */}
      <ErrorBoundary>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
          <RetirementForecastCard />
        </Suspense>
      </ErrorBoundary>

      {/* CERTIFICATIONS EXPIRING SOON - Banner */}
      <ErrorBoundary>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
          <ExpiringCertificationsBannerServer />
        </Suspense>
      </ErrorBoundary>

      {/* 🚨 URGENT ALERT BANNER */}
      <ErrorBoundary>
        <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
          <UrgentAlertBanner />
        </Suspense>
      </ErrorBoundary>

      {/* UNIFIED FLEET COMPLIANCE - Single Responsive Card */}
      <ErrorBoundary>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
          <UnifiedComplianceCard />
        </Suspense>
      </ErrorBoundary>

      {/* Quick Actions */}
      <Card className="p-4 min-w-0 overflow-hidden">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ActionCard
            title="Add Pilot"
            description="Add a new pilot to the fleet"
            icon={<Plus className="h-6 w-6 text-primary" aria-hidden="true" />}
            href="/dashboard/pilots/new"
          />
          <ActionCard
            title="Update Certification"
            description="Record a new certification check"
            icon={<FileText className="h-6 w-6 text-primary" aria-hidden="true" />}
            href="/dashboard/certifications/new"
          />
          <ActionCard
            title="View Reports"
            description="Access analytics and reports"
            icon={<BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />}
            href="/dashboard/analytics"
          />
          <ActionCard
            title="Leave Requests"
            description="Manage pilot leave requests"
            icon={<Calendar className="h-6 w-6 text-primary" aria-hidden="true" />}
            href="/dashboard/leave"
          />
        </div>
      </Card>
    </div>
  )
}

// Memoized ActionCard component for performance (compact version)
const ActionCard = memo(function ActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border p-3 transition-all hover:border-primary-300 hover:bg-accent/50 hover:shadow-sm"
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <div className="scale-75">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        </div>
      </div>
    </Link>
  )
})
