/**
 * Dashboard Content — Morning Brief layout (Option 1, 2026-06-11)
 *
 * Action-first ordering: the crew-eligibility rule leads, then what needs a
 * decision today, then deadlines, then action KPIs. Context widgets (roster
 * carousel, calendar, staffing, retirement) follow.
 *
 * Zone 1: PersonalizedGreeting + CrewEligibilityBanner
 * Zone 2: TodaysPriorities "Action required" (2/3) + DeadlineWidget (1/3)
 * Zone 3: FleetInsightsWidget (action KPIs)
 * Zone 4: CompactRosterDisplay (current period + carousel)
 * Zone 5: RosterCalendarWidget + QuickActionCards + UrgentAlertBanner
 * Zone 6: PilotRequirementsCard (2/3) + RetirementForecastCard (1/3)
 *
 * PendingApprovalsWidget was retired — it duplicated the Approvals Hub queue.
 */

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'
import { PersonalizedGreeting } from '@/components/dashboard/personalized-greeting'
import { CrewEligibilityBanner } from '@/components/dashboard/crew-eligibility-banner'
import { FleetInsightsWidget } from '@/components/dashboard/fleet-insights-widget'
import { TodaysPriorities } from '@/components/dashboard/todays-priorities'
import { QuickActionCards } from '@/components/dashboard/quick-action-cards'
import { RosterCalendarWidget } from '@/components/dashboard/roster-calendar-widget'
import { DeadlineWidgetWrapper } from '@/components/dashboard/deadline-widget-wrapper'
import { UrgentAlertBanner } from '@/components/dashboard/urgent-alert-banner'
import { CompactRosterDisplay } from '@/components/dashboard/compact-roster-display'
import { PilotRequirementsCard } from '@/components/dashboard/pilot-requirements-card'
import { RetirementForecastCard } from '@/components/dashboard/retirement-forecast-card'

export async function DashboardContent() {
  return (
    <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
      {/* Zone 1: Greeting + crew-eligibility headline */}
      <section aria-label="Greeting and crew eligibility" className="space-y-4">
        <ErrorBoundary fallback={<DashboardErrorFallback section="greeting" />}>
          <Suspense fallback={<div className="bg-muted animate-shimmer h-14 rounded-xl" />}>
            <PersonalizedGreeting />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={<DashboardErrorFallback section="crew eligibility" />}>
          <Suspense fallback={<div className="bg-muted animate-shimmer h-16 rounded-lg" />}>
            <CrewEligibilityBanner />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* Zone 2: Action required today + deadlines */}
      <section
        aria-label="Action required and deadlines"
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
          <ErrorBoundary fallback={<DashboardErrorFallback section="deadlines" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-48 rounded-xl" />}>
              <DeadlineWidgetWrapper maxPeriods={2} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      {/* Zone 3: Action KPIs */}
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

      {/* Zone 4: Roster Periods — Current period countdown + scrolling carousel */}
      <ErrorBoundary fallback={<DashboardErrorFallback section="roster periods" />}>
        <Suspense fallback={<div className="bg-muted animate-shimmer h-72 rounded-xl" />}>
          <CompactRosterDisplay />
        </Suspense>
      </ErrorBoundary>

      {/* Zone 5: Roster Calendar + Quick Actions + Alerts */}
      <section
        aria-label="Calendar, quick actions, and alerts"
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
          <QuickActionCards />
        </div>

        <div>
          <ErrorBoundary fallback={<DashboardErrorFallback section="alerts" />}>
            <Suspense fallback={<div className="bg-muted animate-shimmer h-32 rounded-xl" />}>
              <UrgentAlertBanner />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      {/* Zone 6: Staffing Requirements + Retirement Forecast */}
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
