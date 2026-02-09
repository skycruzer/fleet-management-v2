/**
 * Dashboard Content — 3-Zone Layout
 * Developer: Maurice Rondeau
 *
 * Video Buddy-inspired dashboard with personalized greeting,
 * fleet insights, today's priorities, quick actions, roster calendar,
 * pending approvals, alert banner, staffing requirements, and retirement forecast.
 *
 * Zone 1: PersonalizedGreeting + FleetInsightsWidget
 * Zone 2: CompactRosterDisplay (full-width — current period + scrolling carousel)
 * Zone 3: TodaysPriorities (2/3) + QuickActionCards (1/3)
 * Zone 4: RosterCalendarWidget + PendingApprovalsWidget + UrgentAlertBanner
 * Zone 5: PilotRequirementsCard (2/3) + RetirementForecastCard (1/3)
 */

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'
import { PersonalizedGreeting } from '@/components/dashboard/personalized-greeting'
import { FleetInsightsWidget } from '@/components/dashboard/fleet-insights-widget'
import { TodaysPriorities } from '@/components/dashboard/todays-priorities'
import { QuickActionCards } from '@/components/dashboard/quick-action-cards'
import { RosterCalendarWidget } from '@/components/dashboard/roster-calendar-widget'
import { PendingApprovalsWidget } from '@/components/dashboard/pending-approvals-widget'
import { UrgentAlertBanner } from '@/components/dashboard/urgent-alert-banner'
import { CompactRosterDisplay } from '@/components/dashboard/compact-roster-display'
import { PilotRequirementsCard } from '@/components/dashboard/pilot-requirements-card'
import { RetirementForecastCard } from '@/components/dashboard/retirement-forecast-card'

export async function DashboardContent() {
  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden" style={{ minWidth: 0 }}>
      {/* Zone 1: Personalized Greeting + Fleet Insights */}
      <section aria-label="Greeting and fleet overview" className="space-y-4">
        <ErrorBoundary fallback={<DashboardErrorFallback section="greeting" />}>
          <Suspense fallback={<div className="bg-muted animate-shimmer h-14 rounded-xl" />}>
            <PersonalizedGreeting />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={<DashboardErrorFallback section="fleet insights" />}>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-muted animate-shimmer h-24 rounded-xl" />
                ))}
              </div>
            }
          >
            <FleetInsightsWidget />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* Zone 2: Roster Periods — Current period countdown + scrolling carousel */}
      <ErrorBoundary fallback={<DashboardErrorFallback section="roster periods" />}>
        <Suspense fallback={<div className="bg-muted animate-shimmer h-72 rounded-xl" />}>
          <CompactRosterDisplay />
        </Suspense>
      </ErrorBoundary>

      {/* Zone 3: Today's Priorities + Quick Actions */}
      <section
        aria-label="Priorities and quick actions"
        className="grid grid-cols-1 gap-3 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <ErrorBoundary fallback={<DashboardErrorFallback section="priorities" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-48 rounded-xl" />}>
              <TodaysPriorities />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div>
          <QuickActionCards />
        </div>
      </section>

      {/* Zone 4: Roster Calendar + Pending Approvals + Alerts */}
      <section
        aria-label="Calendar, approvals, and alerts"
        className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <ErrorBoundary fallback={<DashboardErrorFallback section="roster calendar" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-xl" />}>
              <RosterCalendarWidget />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div>
          <ErrorBoundary fallback={<DashboardErrorFallback section="approvals" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-xl" />}>
              <PendingApprovalsWidget />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div>
          <ErrorBoundary fallback={<DashboardErrorFallback section="alerts" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-16 rounded-xl" />}>
              <UrgentAlertBanner />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      {/* Zone 5: Staffing Requirements + Retirement Forecast */}
      <section
        aria-label="Staffing and retirement planning"
        className="grid grid-cols-1 gap-3 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <ErrorBoundary fallback={<DashboardErrorFallback section="staffing requirements" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-xl" />}>
              <PilotRequirementsCard />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div>
          <ErrorBoundary fallback={<DashboardErrorFallback section="retirement forecast" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-64 rounded-xl" />}>
              <RetirementForecastCard />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>
    </div>
  )
}
