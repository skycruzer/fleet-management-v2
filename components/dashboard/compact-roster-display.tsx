/**
 * Compact Roster Display Component
 *
 * Replaces the large horizontal carousel with a compact single-card design.
 * Shows current roster period prominently with auto-scrolling upcoming periods.
 *
 * Features:
 * - Current period with countdown timer
 * - Auto-scrolling carousel of next 13 periods (right to left)
 * - Color-coded periods (current = green, next = blue, upcoming = default)
 * - Link to full calendar view
 * - Responsive and space-efficient
 *
 * Architecture: Server Component wrapper with Client Component for animation
 */

import { Clock, ChevronRight, CalendarDays, Users, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getCurrentRosterPeriodObject,
  getFutureRosterPeriods,
  getNextRosterPeriodObject,
  type RosterPeriod,
} from '@/lib/utils/roster-utils'
import { RosterCarousel } from './roster-carousel'
import { RosterPeriodRefresher } from './roster-period-refresher'
import { createClient } from '@/lib/supabase/server'
import {
  buildRosterPeriodStats,
  emptyRosterPeriodStats,
  type RosterPeriodStats,
} from '@/lib/utils/roster-period-stats'

// Extended RosterPeriod with leave request and certification check data
type RosterPeriodWithLeave = RosterPeriod & {
  leaveRequests?: RosterPeriodStats['leaveRequests']
  certChecks?: number
}

async function getRosterPeriodStats(rosterPeriods: string[]) {
  if (rosterPeriods.length === 0) return {}

  const supabase = await createClient()

  const [leaveResult, certificationResult] = await Promise.all([
    supabase
      .from('pilot_requests')
      .select('roster_period, workflow_status, request_type')
      .in('roster_period', rosterPeriods)
      .eq('request_category', 'LEAVE'),
    supabase
      .from('certification_renewal_plans')
      .select('planned_roster_period')
      .in('planned_roster_period', rosterPeriods),
  ])

  if (leaveResult.error) {
    console.error('Error fetching roster leave request counts:', leaveResult.error)
  }

  if (certificationResult.error) {
    console.error('Error fetching roster certification counts:', certificationResult.error)
  }

  return buildRosterPeriodStats(
    rosterPeriods,
    leaveResult.data || [],
    certificationResult.data || []
  )
}

export async function CompactRosterDisplay() {
  const currentPeriod = getCurrentRosterPeriodObject()
  const nextPeriod = getNextRosterPeriodObject(currentPeriod) // Get the actual next period
  const allUpcomingPeriods = getFutureRosterPeriods(13).slice(2) // Skip current + next (next is rendered in dedicated card)
  const rosterPeriodsToLoad = [
    ...(nextPeriod ? [nextPeriod.code] : []),
    ...allUpcomingPeriods.map((period) => period.code),
  ]
  const rosterStats = await getRosterPeriodStats(rosterPeriodsToLoad)

  const fallbackStats = emptyRosterPeriodStats()
  const nextPeriodStats = nextPeriod ? rosterStats[nextPeriod.code] || fallbackStats : fallbackStats

  const periodsWithLeave: RosterPeriodWithLeave[] = allUpcomingPeriods.map((period) => {
    const stats = rosterStats[period.code] || fallbackStats
    return {
      ...period,
      leaveRequests: stats.leaveRequests,
      certChecks: stats.certChecks,
    }
  })

  // Calculate days remaining for current period
  // Each roster period is EXACTLY 28 days (business rule)
  const today = new Date()
  const endDate = new Date(currentPeriod.endDate)
  const rawDaysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, rawDaysRemaining)
  const isPeriodComplete = rawDaysRemaining <= 0

  // Get progress percentage
  // Total days is ALWAYS 28 (fixed roster period length)
  const totalDays = 28
  const elapsedDays = totalDays - rawDaysRemaining
  const progressPercentage = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100))

  return (
    <Card className="border-border bg-card overflow-hidden border shadow-sm">
      {/* Auto-refresh when roster period boundary is crossed */}
      <RosterPeriodRefresher periodEndDate={currentPeriod.endDate.toISOString()} />
      {/* Header with Primary Background */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <CalendarDays className="text-primary-foreground h-5 w-5" />
            </div>
            <div>
              <h3 className="text-primary-foreground text-sm font-semibold">
                Current Roster Period
              </h3>
              <p className="text-primary-foreground/70 text-xs">28-day operational cycle</p>
            </div>
          </div>
          <Badge className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
            {isPeriodComplete ? 'COMPLETE' : 'ACTIVE'}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Current and Next Period Side by Side */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Current Period - Left Side */}
          <div className="bg-muted/50 rounded-xl p-5">
            <div className="mb-4">
              <Badge
                className={
                  isPeriodComplete
                    ? 'bg-muted-foreground text-muted mb-2 text-xs font-bold'
                    : 'bg-primary text-primary-foreground mb-2 text-xs font-bold'
                }
              >
                {isPeriodComplete ? 'COMPLETE' : 'ACTIVE'}
              </Badge>
              <div className="mb-1 flex items-baseline gap-2">
                <h4 className="text-foreground text-3xl font-black tracking-tight">
                  {currentPeriod.code}
                </h4>
                <span className="text-sm font-semibold text-[var(--color-info)]">
                  {currentPeriod.year}
                </span>
              </div>
              <p className="text-muted-foreground text-xs font-medium">
                {new Date(currentPeriod.startDate).toLocaleDateString('en-AU', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {new Date(currentPeriod.endDate).toLocaleDateString('en-AU', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Days Remaining */}
            <div className="mb-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Clock
                  className={
                    isPeriodComplete
                      ? 'text-muted-foreground h-3.5 w-3.5'
                      : 'h-3.5 w-3.5 text-[var(--color-info)]'
                  }
                />
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {isPeriodComplete ? 'Status' : 'Days Left'}
                </span>
              </div>
              {isPeriodComplete ? (
                <p className="text-muted-foreground text-lg font-bold">Period Complete</p>
              ) : (
                <div className="flex items-baseline gap-1">
                  <p className="text-foreground text-4xl font-black">{daysRemaining}</p>
                  <span className="text-muted-foreground text-sm font-bold">/ {totalDays}</span>
                </div>
              )}
            </div>

            {/* Semi-Circular Arc Gauge */}
            {(() => {
              const arcRadius = 54
              const arcStroke = 8
              const svgWidth = 140
              const svgHeight = 80
              const centerX = svgWidth / 2
              const centerY = 68
              const circumference = Math.PI * arcRadius
              const filledLength = (progressPercentage / 100) * circumference
              const dashOffset = circumference - filledLength
              // Calculate tick position angle (0% = left, 100% = right)
              const tickAngle = Math.PI - (progressPercentage / 100) * Math.PI
              const tickX = centerX + arcRadius * Math.cos(tickAngle)
              const tickY = centerY - arcRadius * Math.sin(tickAngle)

              return (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <svg
                      width={svgWidth}
                      height={svgHeight}
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="overflow-visible"
                    >
                      {/* Track arc — themed via currentColor so it respects
                          light/dark mode (was hardcoded oklch baked into JSX). */}
                      <path
                        d={`M ${centerX - arcRadius} ${centerY} A ${arcRadius} ${arcRadius} 0 0 1 ${centerX + arcRadius} ${centerY}`}
                        fill="none"
                        stroke="currentColor"
                        className="text-muted"
                        strokeWidth={arcStroke}
                        strokeLinecap="round"
                      />
                      {/* Filled arc */}
                      <path
                        d={`M ${centerX - arcRadius} ${centerY} A ${arcRadius} ${arcRadius} 0 0 1 ${centerX + arcRadius} ${centerY}`}
                        fill="none"
                        stroke="var(--color-info)"
                        strokeWidth={arcStroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                      />
                      {/* Tick dot at current position. Pulse animation removed
                          for prefers-reduced-motion compliance — the position
                          alone communicates "current" without needing motion. */}
                      {!isPeriodComplete && progressPercentage > 0 && (
                        <circle
                          cx={tickX}
                          cy={tickY}
                          r={5}
                          fill="var(--color-info)"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="text-background"
                        />
                      )}
                    </svg>
                    {/* Center text overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                      <span
                        className={`text-2xl leading-none font-black ${isPeriodComplete ? 'text-muted-foreground' : 'text-foreground'}`}
                      >
                        {isPeriodComplete ? '0' : daysRemaining}
                      </span>
                      <span className="text-muted-foreground mt-0.5 text-[10px] font-semibold tracking-wider uppercase">
                        days left
                      </span>
                    </div>
                  </div>
                  <span className="text-muted-foreground mt-1 text-xs font-medium">
                    {Math.round(progressPercentage)}% complete
                  </span>
                </div>
              )
            })()}
          </div>

          {/* Next Period - Right Side with Dual Links */}
          {nextPeriod && (
            <div className="self-start rounded-xl border-2 border-[var(--color-info-border)] bg-[var(--color-info-bg)] shadow-sm">
              {/* Header - Non-clickable */}
              <div className="p-5 pb-3">
                <Badge className="mb-2 border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-xs font-bold text-[var(--color-info)]">
                  NEXT UP
                </Badge>
                <div className="mb-1 flex items-baseline gap-2">
                  <h4 className="text-foreground text-3xl font-black tracking-tight">
                    {nextPeriod.code}
                  </h4>
                  <span className="text-sm font-semibold text-[var(--color-info)]">
                    {nextPeriod.year}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs font-medium">
                  {new Date(nextPeriod.startDate).toLocaleDateString('en-AU', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  -{' '}
                  {new Date(nextPeriod.endDate).toLocaleDateString('en-AU', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Dual-Link Sections */}
              <div className="flex flex-col border-t-2 border-[var(--color-info-border)]">
                {/* Leave Requests Link */}
                {nextPeriodStats.leaveRequests.total > 0 && (
                  <Link
                    href={`/dashboard/leave?period=${nextPeriod.code}`}
                    className="group flex flex-col gap-1 border-b border-[var(--color-info-border)] px-5 py-3 transition-colors hover:bg-[var(--color-info)]/10"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[var(--color-info)]" />
                      <span className="text-foreground flex-1 text-xs font-semibold">
                        {nextPeriodStats.leaveRequests.total} leave request
                        {nextPeriodStats.leaveRequests.total !== 1 ? 's' : ''}
                        {nextPeriodStats.leaveRequests.pending > 0 && (
                          <span className="text-warning ml-1">
                            ({nextPeriodStats.leaveRequests.pending} pending)
                          </span>
                        )}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[var(--color-info)] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </div>
                    {/* Request Type Breakdown */}
                    {nextPeriodStats.leaveRequests.byType &&
                      Object.keys(nextPeriodStats.leaveRequests.byType).length > 0 && (
                        <div className="ml-6 flex flex-wrap gap-1.5">
                          {Object.entries(nextPeriodStats.leaveRequests.byType)
                            .sort((a, b) => b[1] - a[1]) // Sort by count descending
                            .map(([type, count]) => (
                              <span
                                key={type}
                                className="rounded bg-[var(--color-info-bg)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-info)]"
                              >
                                {type}: {count}
                              </span>
                            ))}
                        </div>
                      )}
                  </Link>
                )}

                {/* Certification Checks Link */}
                {nextPeriodStats.certChecks > 0 && (
                  <Link
                    href={`/dashboard/renewal-planning/roster-period/${nextPeriod.code}`}
                    className="group flex items-center gap-2 px-5 py-3 transition-colors hover:bg-[var(--color-info)]/10"
                  >
                    <ClipboardCheck className="h-4 w-4 text-[var(--color-info)]" />
                    <span className="text-foreground flex-1 text-xs font-semibold">
                      {nextPeriodStats.certChecks} cert check
                      {nextPeriodStats.certChecks !== 1 ? 's' : ''} planned
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-info)] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                )}

                {/* Fallback link if no data */}
                {nextPeriodStats.leaveRequests.total === 0 && nextPeriodStats.certChecks === 0 && (
                  <Link
                    href={`/dashboard/renewal-planning/roster-period/${nextPeriod.code}`}
                    className="group flex items-center gap-2 px-5 py-3 transition-colors hover:bg-[var(--color-info)]/10"
                  >
                    <span className="text-muted-foreground flex-1 text-xs font-semibold">
                      View Details
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-info)] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Auto-Scrolling Carousel - Next 13 Periods */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-foreground text-sm font-bold">Upcoming Roster Periods</h5>
            <span className="text-muted-foreground text-xs font-medium">
              {allUpcomingPeriods.length} periods
            </span>
          </div>

          <RosterCarousel periods={periodsWithLeave} />
        </div>
      </div>

      {/* Footer Link - Enhanced */}
      <div className="border-border bg-muted/50 border-t px-6 py-4">
        <Link
          href="/dashboard/renewal-planning"
          className="group hover:bg-card flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all hover:shadow-sm"
        >
          <span className="text-foreground">View Full Renewal Calendar</span>
          <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Card>
  )
}
