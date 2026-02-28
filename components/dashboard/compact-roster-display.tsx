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

import { Calendar, Clock, ChevronRight, CalendarDays, Users, ClipboardCheck } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/server'

// Get leave request counts for a roster period with type breakdown
async function getLeaveRequestCounts(rosterPeriod: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pilot_requests')
    .select('workflow_status, request_type')
    .eq('roster_period', rosterPeriod)
    .eq('request_category', 'LEAVE')

  if (error) {
    console.error(`Error fetching leave requests for ${rosterPeriod}:`, error)
    return { pending: 0, approved: 0, total: 0, byType: {} }
  }

  if (!data || data.length === 0) {
    return { pending: 0, approved: 0, total: 0, byType: {} }
  }

  const pending = data.filter((r) => r.workflow_status === 'SUBMITTED').length
  const approved = data.filter((r) => r.workflow_status === 'APPROVED').length

  // Count by request type
  const byType: Record<string, number> = {}
  data.forEach((r) => {
    const type = r.request_type || 'UNKNOWN'
    byType[type] = (byType[type] || 0) + 1
  })

  return { pending, approved, total: data.length, byType }
}

// Get certification check counts for a roster period
async function getCertificationCheckCounts(rosterPeriod: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .select('id')
    .eq('planned_roster_period', rosterPeriod)

  if (error || !data) {
    return 0
  }

  return data.length
}

// Extended RosterPeriod with leave request and certification check data
type RosterPeriodWithLeave = RosterPeriod & {
  leaveRequests?: {
    pending: number
    approved: number
    total: number
    byType: Record<string, number>
  }
  certChecks?: number
}

export async function CompactRosterDisplay() {
  const currentPeriod = getCurrentRosterPeriodObject()
  const nextPeriod = getNextRosterPeriodObject(currentPeriod) // Get the actual next period
  const allUpcomingPeriods = getFutureRosterPeriods(13).slice(1) // Get 13 periods ahead, excluding current

  // Get leave requests and cert checks for next period
  const nextPeriodLeave = nextPeriod
    ? await getLeaveRequestCounts(nextPeriod.code)
    : { pending: 0, approved: 0, total: 0, byType: {} }
  const nextPeriodCertChecks = nextPeriod ? await getCertificationCheckCounts(nextPeriod.code) : 0

  // Get leave requests and cert checks for all upcoming periods
  const periodsWithLeave: RosterPeriodWithLeave[] = await Promise.all(
    allUpcomingPeriods.map(async (period) => ({
      ...period,
      leaveRequests: await getLeaveRequestCounts(period.code),
      certChecks: await getCertificationCheckCounts(period.code),
    }))
  )

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
      {/* Header with Primary Background */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 flex h-10 w-10 items-center justify-center rounded-lg backdrop-blur-sm">
              <CalendarDays className="text-primary-foreground h-5 w-5" />
            </div>
            <div>
              <h3 className="text-primary-foreground text-sm font-semibold">
                Current Roster Period
              </h3>
              <p className="text-primary-foreground/70 text-xs">28-day operational cycle</p>
            </div>
          </div>
          <Badge className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold shadow-md backdrop-blur-sm">
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
                <span className="text-primary text-sm font-semibold">{currentPeriod.year}</span>
              </div>
              <p className="text-muted-foreground text-xs font-medium">
                {new Date(currentPeriod.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {new Date(currentPeriod.endDate).toLocaleDateString('en-US', {
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
                      : 'text-primary h-3.5 w-3.5'
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
                  <p className="text-primary text-4xl font-black">{daysRemaining}</p>
                  <span className="text-muted-foreground text-sm font-bold">/ {totalDays}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full shadow-sm transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next Period - Right Side with Dual Links */}
          {nextPeriod && (
            <div className="border-primary/30 bg-primary/5 self-start rounded-xl border-2 shadow-sm">
              {/* Header - Non-clickable */}
              <div className="p-5 pb-3">
                <Badge className="border-primary bg-primary/10 text-primary mb-2 text-xs font-bold">
                  NEXT UP
                </Badge>
                <div className="mb-1 flex items-baseline gap-2">
                  <h4 className="text-foreground text-3xl font-black tracking-tight">
                    {nextPeriod.code}
                  </h4>
                  <span className="text-primary text-sm font-semibold">{nextPeriod.year}</span>
                </div>
                <p className="text-muted-foreground text-xs font-medium">
                  {new Date(nextPeriod.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  -{' '}
                  {new Date(nextPeriod.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Dual-Link Sections */}
              <div className="border-primary/20 flex flex-col border-t-2">
                {/* Leave Requests Link */}
                {nextPeriodLeave.total > 0 && (
                  <Link
                    href={`/dashboard/leave?period=${nextPeriod.code}`}
                    className="group border-primary/10 hover:bg-primary/10 flex flex-col gap-1 border-b px-5 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="text-primary h-4 w-4" />
                      <span className="text-foreground flex-1 text-xs font-semibold">
                        {nextPeriodLeave.total} leave request
                        {nextPeriodLeave.total !== 1 ? 's' : ''}
                        {nextPeriodLeave.pending > 0 && (
                          <span className="text-warning ml-1">
                            ({nextPeriodLeave.pending} pending)
                          </span>
                        )}
                      </span>
                      <ChevronRight className="text-primary h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </div>
                    {/* Request Type Breakdown */}
                    {nextPeriodLeave.byType && Object.keys(nextPeriodLeave.byType).length > 0 && (
                      <div className="ml-6 flex flex-wrap gap-1.5">
                        {Object.entries(nextPeriodLeave.byType)
                          .sort((a, b) => b[1] - a[1]) // Sort by count descending
                          .map(([type, count]) => (
                            <span
                              key={type}
                              className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium"
                            >
                              {type}: {count}
                            </span>
                          ))}
                      </div>
                    )}
                  </Link>
                )}

                {/* Certification Checks Link */}
                {nextPeriodCertChecks > 0 && (
                  <Link
                    href={`/dashboard/renewal-planning/roster-period/${nextPeriod.code}`}
                    className="group hover:bg-primary/10 flex items-center gap-2 px-5 py-3 transition-colors"
                  >
                    <ClipboardCheck className="text-primary h-4 w-4" />
                    <span className="text-foreground flex-1 text-xs font-semibold">
                      {nextPeriodCertChecks} cert check{nextPeriodCertChecks !== 1 ? 's' : ''}{' '}
                      planned
                    </span>
                    <ChevronRight className="text-primary h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                )}

                {/* Fallback link if no data */}
                {nextPeriodLeave.total === 0 && nextPeriodCertChecks === 0 && (
                  <Link
                    href={`/dashboard/renewal-planning/roster-period/${nextPeriod.code}`}
                    className="group hover:bg-primary/10 flex items-center gap-2 px-5 py-3 transition-colors"
                  >
                    <span className="text-muted-foreground flex-1 text-xs font-semibold">
                      View Details
                    </span>
                    <ChevronRight className="text-primary h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
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
