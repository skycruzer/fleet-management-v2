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
    .from('leave_requests')
    .select('status, request_type')
    .eq('roster_period', rosterPeriod)

  if (error) {
    console.error(`Error fetching leave requests for ${rosterPeriod}:`, error)
    return { pending: 0, approved: 0, total: 0, byType: {} }
  }

  if (!data || data.length === 0) {
    console.log(`No leave requests found for ${rosterPeriod}`)
    return { pending: 0, approved: 0, total: 0, byType: {} }
  }

  const pending = data.filter((r) => r.status === 'PENDING').length
  const approved = data.filter((r) => r.status === 'APPROVED').length

  // Count by request type
  const byType: Record<string, number> = {}
  data.forEach((r) => {
    const type = r.request_type || 'UNKNOWN'
    byType[type] = (byType[type] || 0) + 1
  })

  console.log(`Leave requests for ${rosterPeriod}:`, { total: data.length, pending, approved, byType })
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
  const nextPeriodLeave = nextPeriod ? await getLeaveRequestCounts(nextPeriod.code) : { pending: 0, approved: 0, total: 0, byType: {} }
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
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Get progress percentage
  // Total days is ALWAYS 28 (fixed roster period length)
  const totalDays = 28
  const elapsedDays = totalDays - daysRemaining
  const progressPercentage = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100))

  return (
    <Card className="overflow-hidden border-2 border-primary-200 bg-gradient-to-br from-white to-slate-50 shadow-lg dark:border-primary-800 dark:from-slate-800 dark:to-slate-900">
      {/* Header with Gradient Background */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 dark:from-primary-700 dark:to-primary-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Current Roster Period</h3>
              <p className="text-xs text-white/70">28-day operational cycle</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-xs font-bold text-white shadow-md backdrop-blur-sm">
            ACTIVE
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Current and Next Period Side by Side */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Current Period - Left Side */}
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 p-5 shadow-inner dark:from-primary-950/50 dark:to-blue-950/50">
            <div className="mb-4">
              <Badge className="mb-2 bg-primary-600 text-xs font-bold text-white">ACTIVE</Badge>
              <div className="mb-1 flex items-baseline gap-2">
                <h4 className="text-3xl font-black tracking-tight text-primary-900 dark:text-primary-100">
                  {currentPeriod.code}
                </h4>
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {currentPeriod.year}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
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
                <Clock className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Days Left
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-black text-primary-600 dark:text-primary-400">
                  {daysRemaining}
                </p>
                <span className="text-sm font-bold text-slate-500">/ {totalDays}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next Period - Right Side with Dual Links */}
          {nextPeriod && (
            <div className="h-full rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:border-blue-700 dark:from-blue-950/50 dark:to-indigo-950/50">
              {/* Header - Non-clickable */}
              <div className="p-5 pb-3">
                <Badge className="mb-2 border-blue-600 bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  NEXT UP
                </Badge>
                <div className="mb-1 flex items-baseline gap-2">
                  <h4 className="text-3xl font-black tracking-tight text-blue-900 dark:text-blue-100">
                    {nextPeriod.code}
                  </h4>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {nextPeriod.year}
                  </span>
                </div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
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
              <div className="flex flex-col border-t-2 border-blue-200 dark:border-blue-800">
                {/* Leave Requests Link */}
                {nextPeriodLeave.total > 0 && (
                  <Link
                    href={`/dashboard/leave?period=${nextPeriod.code}`}
                    className="group flex flex-col gap-1 border-b border-blue-100 px-5 py-3 transition-colors hover:bg-blue-100/50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="flex-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                        {nextPeriodLeave.total} leave request{nextPeriodLeave.total !== 1 ? 's' : ''}
                        {nextPeriodLeave.pending > 0 && (
                          <span className="ml-1 text-orange-600 dark:text-orange-400">
                            ({nextPeriodLeave.pending} pending)
                          </span>
                        )}
                      </span>
                      <ChevronRight className="h-4 w-4 text-blue-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 dark:text-blue-400" />
                    </div>
                    {/* Request Type Breakdown */}
                    {nextPeriodLeave.byType && Object.keys(nextPeriodLeave.byType).length > 0 && (
                      <div className="ml-6 flex flex-wrap gap-1.5">
                        {Object.entries(nextPeriodLeave.byType)
                          .sort((a, b) => b[1] - a[1]) // Sort by count descending
                          .map(([type, count]) => (
                            <span
                              key={type}
                              className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
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
                    className="group flex items-center gap-2 px-5 py-3 transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
                  >
                    <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="flex-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {nextPeriodCertChecks} cert check{nextPeriodCertChecks !== 1 ? 's' : ''} planned
                    </span>
                    <ChevronRight className="h-4 w-4 text-blue-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 dark:text-blue-400" />
                  </Link>
                )}

                {/* Fallback link if no data */}
                {nextPeriodLeave.total === 0 && nextPeriodCertChecks === 0 && (
                  <Link
                    href={`/dashboard/renewal-planning/roster-period/${nextPeriod.code}`}
                    className="group flex items-center gap-2 px-5 py-3 transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
                  >
                    <span className="flex-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                      View Details
                    </span>
                    <ChevronRight className="h-4 w-4 text-blue-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 dark:text-blue-400" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Auto-Scrolling Carousel - Next 13 Periods */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-bold text-slate-900 dark:text-white">
              Upcoming Roster Periods
            </h5>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {allUpcomingPeriods.length} periods
            </span>
          </div>

          <RosterCarousel periods={periodsWithLeave} />
        </div>
      </div>

      {/* Footer Link - Enhanced */}
      <div className="border-t-2 border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
        <Link
          href="/dashboard/renewal-planning"
          className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all hover:bg-white hover:shadow-sm dark:hover:bg-slate-700"
        >
          <span className="text-slate-700 dark:text-slate-300">
            View Full Renewal Calendar
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Card>
  )
}
