/**
 * Dashboard Content — Bento Grid Layout
 * Developer: Maurice Rondeau
 * Warm rose-accented bento grid with varied card sizes
 */

import { memo, Suspense } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/error-boundary'
import { UrgentAlertBanner } from '@/components/dashboard/urgent-alert-banner'
import { UnifiedComplianceCard } from '@/components/dashboard/unified-compliance-card'
import { CompactRosterDisplay } from '@/components/dashboard/compact-roster-display'
import { ExpiringCertificationsBannerServer } from '@/components/dashboard/expiring-certifications-banner-server'
import { PilotRequirementsCard } from '@/components/dashboard/pilot-requirements-card'
import { RetirementForecastCard } from '@/components/dashboard/retirement-forecast-card'
import { Calendar, Plus, FileText } from 'lucide-react'

function DashboardErrorFallback({ section }: { section: string }) {
  return (
    <div className="border-destructive/20 bg-destructive/5 flex items-center gap-2 rounded-xl border p-4">
      <span className="text-destructive text-sm">Failed to load {section}.</span>
      <button
        onClick={() => window.location.reload()}
        className="text-primary text-xs underline hover:no-underline"
      >
        Reload
      </button>
    </div>
  )
}

export async function DashboardContent() {
  return (
    <div className="w-full max-w-full overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {/* Alert Banner — Full Width */}
        <div className="col-span-full">
          <ErrorBoundary fallback={<DashboardErrorFallback section="alerts" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-16 rounded-xl" />}>
              <UrgentAlertBanner />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Roster Periods — Span 2 cols */}
        <div className="lg:col-span-2">
          <ErrorBoundary fallback={<DashboardErrorFallback section="roster periods" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-xl" />}>
              <CompactRosterDisplay />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Quick Actions — 1 col */}
        <div>
          <Card className="border-border h-full min-w-0 overflow-hidden rounded-xl border p-4">
            <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ActionCard
                title="Add Pilot"
                description="Add a new pilot to the fleet"
                icon={<Plus className="text-primary h-5 w-5" aria-hidden="true" />}
                href="/dashboard/pilots/new"
              />
              <ActionCard
                title="Update Cert"
                description="Record a new certification check"
                icon={<FileText className="text-primary h-5 w-5" aria-hidden="true" />}
                href="/dashboard/certifications/new"
              />
              <ActionCard
                title="Reports"
                description="Create and export reports"
                icon={<FileText className="text-primary h-5 w-5" aria-hidden="true" />}
                href="/dashboard/reports"
              />
              <ActionCard
                title="Requests"
                description="Manage pilot leave and flight requests"
                icon={<Calendar className="text-primary h-5 w-5" aria-hidden="true" />}
                href="/dashboard/requests"
              />
            </div>
          </Card>
        </div>

        {/* Staffing Requirements — Span 2 cols */}
        <div className="lg:col-span-2">
          <ErrorBoundary fallback={<DashboardErrorFallback section="staffing requirements" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-xl" />}>
              <PilotRequirementsCard />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Retirement Forecast — 1 col, span 2 rows on xl */}
        <div className="xl:row-span-2">
          <ErrorBoundary fallback={<DashboardErrorFallback section="retirement forecast" />}>
            <Suspense
              fallback={<div className="bg-muted animate-shimmer h-full min-h-64 rounded-xl" />}
            >
              <RetirementForecastCard />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Expiring Certifications — 1 col */}
        <div>
          <ErrorBoundary fallback={<DashboardErrorFallback section="certifications" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-48 rounded-xl" />}>
              <ExpiringCertificationsBannerServer />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Fleet Compliance — 1 col */}
        <div>
          <ErrorBoundary fallback={<DashboardErrorFallback section="fleet compliance" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-48 rounded-xl" />}>
              <UnifiedComplianceCard />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

// Memoized ActionCard — 2x2 grid icon buttons with rose hover glow
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
      className="group border-border bg-card focus:ring-primary/20 block rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-accent)] focus:ring-2 focus:ring-offset-2 focus:outline-none"
      aria-label={`${title}: ${description}`}
    >
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="bg-primary/10 group-hover:bg-primary/15 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-foreground text-xs font-medium">{title}</h4>
        </div>
      </div>
    </Link>
  )
})
