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
import { Calendar, Plus, FileText, BarChart3 } from 'lucide-react'
export async function DashboardContent() {
  return (
    <div className="w-full max-w-full overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* ROSTER PERIODS - Current + Next 13 - FULL WIDTH TOP */}
      <div className="mb-3">
        <ErrorBoundary>
          <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-lg" />}>
            <CompactRosterDisplay />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* 🚨 URGENT ALERT BANNER - FULL WIDTH */}
      <div className="mb-3">
        <ErrorBoundary>
          <Suspense fallback={<div className="bg-muted animate-shimmer h-16 rounded-lg" />}>
            <UrgentAlertBanner />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* TWO-COLUMN LAYOUT AT xl: */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* LEFT COLUMN - Primary operational data */}
        <div className="space-y-3 xl:col-span-7">
          {/* PILOT STAFFING REQUIREMENTS - Required vs Actual */}
          <ErrorBoundary>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-lg" />}>
              <PilotRequirementsCard />
            </Suspense>
          </ErrorBoundary>

          {/* CERTIFICATIONS EXPIRING SOON - Banner */}
          <ErrorBoundary>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-48 rounded-lg" />}>
              <ExpiringCertificationsBannerServer />
            </Suspense>
          </ErrorBoundary>

          {/* Quick Actions - Linear-inspired section header */}
          <Card className="min-w-0 overflow-hidden p-4">
            <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ActionCard
                title="Add Pilot"
                description="Add a new pilot to the fleet"
                icon={<Plus className="text-primary h-6 w-6" aria-hidden="true" />}
                href="/dashboard/pilots/new"
              />
              <ActionCard
                title="Update Certification"
                description="Record a new certification check"
                icon={<FileText className="text-primary h-6 w-6" aria-hidden="true" />}
                href="/dashboard/certifications/new"
              />
              <ActionCard
                title="View Reports"
                description="Access analytics and reports"
                icon={<BarChart3 className="text-primary h-6 w-6" aria-hidden="true" />}
                href="/dashboard/analytics"
              />
              <ActionCard
                title="Pilot Requests"
                description="Manage pilot leave and flight requests"
                icon={<Calendar className="text-primary h-6 w-6" aria-hidden="true" />}
                href="/dashboard/requests"
              />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN - Secondary data & forecasts */}
        <div className="space-y-3 xl:col-span-5">
          {/* RETIREMENT FORECAST - 2 and 5 Year Outlook */}
          <ErrorBoundary>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-lg" />}>
              <RetirementForecastCard />
            </Suspense>
          </ErrorBoundary>

          {/* UNIFIED FLEET COMPLIANCE - Single Responsive Card */}
          <ErrorBoundary>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-lg" />}>
              <UnifiedComplianceCard />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

// Memoized ActionCard component for performance (Linear-inspired: clean, minimal)
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
      className="group border-border bg-background hover:border-primary/30 hover:bg-primary/5 focus:ring-primary/20 block rounded-lg border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
      aria-label={`${title}: ${description}`}
    >
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="bg-primary/10 group-hover:bg-primary/15 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors">
          <div className="text-primary group-hover:text-primary scale-75">{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-foreground text-xs font-medium">{title}</h4>
        </div>
      </div>
    </Link>
  )
})
