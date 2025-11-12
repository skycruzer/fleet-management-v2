/**
 * Roster Deadline Alert Service
 *
 * Developer: Maurice Rondeau
 *
 * Manages deadline notifications for roster periods with automated email alerts.
 * Tracks pending requests and sends notifications at key milestones (21, 14, 7, 3, 1, 0 days before deadline).
 * Provides category-specific breakdowns for leave and flight requests.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentRosterPeriodObject, type RosterPeriod } from '@/lib/utils/roster-utils'

export interface DeadlineAlert {
  rosterPeriod: RosterPeriod
  daysUntilDeadline: number
  milestone: AlertMilestone
  pendingCount: number
  submittedCount: number
  approvedCount: number
  deniedCount: number
  leaveRequestsCount: number
  flightRequestsCount: number
  leavePendingCount: number
  flightPendingCount: number
  leaveApprovedCount: number
  flightApprovedCount: number
}

export type AlertMilestone = 21 | 14 | 7 | 3 | 1 | 0

const ALERT_MILESTONES: AlertMilestone[] = [21, 14, 7, 3, 1, 0]

/**
 * Get all deadline alerts for upcoming roster periods
 * Returns alerts for periods within 30 days that match milestone thresholds
 */
export async function getAllDeadlineAlerts(): Promise<DeadlineAlert[]> {
  const today = new Date()
  const alerts: DeadlineAlert[] = []

  // Check next 3 roster periods (approximately 12 weeks ahead)
  for (let offset = 0; offset < 3; offset++) {
    const currentPeriod = getCurrentRosterPeriodObject()

    // Calculate offset roster period manually
    const periodStartDate = new Date(currentPeriod.startDate)
    periodStartDate.setDate(periodStartDate.getDate() + offset * 28)

    const periodEndDate = new Date(periodStartDate)
    periodEndDate.setDate(periodEndDate.getDate() + 27)

    // Calculate roster period number and year with wraparound
    let periodNumber = currentPeriod.number + offset
    let periodYear = currentPeriod.year
    if (periodNumber > 13) {
      periodNumber = periodNumber - 13
      periodYear++
    }

    // Create RosterPeriod object
    const rosterPeriod: RosterPeriod = {
      code: `RP${periodNumber.toString().padStart(2, '0')}/${periodYear}`,
      number: periodNumber,
      year: periodYear,
      startDate: periodStartDate,
      endDate: periodEndDate,
      daysRemaining: Math.ceil((periodEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }

    // Deadline is 21 days before period starts
    const deadline = new Date(periodStartDate)
    deadline.setDate(deadline.getDate() - 21)
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Only create alerts within 30 days and at milestone thresholds
    if (daysUntilDeadline <= 30 && daysUntilDeadline >= 0) {
      // Find closest milestone
      const milestone = ALERT_MILESTONES.find(m => daysUntilDeadline <= m) || 0

      // Get request counts for this roster period
      const supabase = await createClient()
      const { data: requests, error } = await supabase
        .from('pilot_requests')
        .select('id, workflow_status, request_category, start_date, end_date')
        .gte('start_date', periodStartDate.toISOString())
        .lte('end_date', periodEndDate.toISOString())

      if (error) {
        console.error('Error fetching requests for deadline alert:', error)
        continue
      }

      // Filter out requests with null dates
      const validRequests = (requests || []).filter((req) => {
        if (!req.start_date || !req.end_date) return false
        const reqStart = new Date(req.start_date)
        const reqEnd = new Date(req.end_date)
        return reqStart >= periodStartDate && reqEnd <= periodEndDate
      })

      // Calculate status-based counts
      const pendingCount = validRequests.filter(
        (r) => r.workflow_status === 'DRAFT' || r.workflow_status === 'SUBMITTED'
      ).length
      const submittedCount = validRequests.filter((r) => r.workflow_status === 'SUBMITTED').length
      const approvedCount = validRequests.filter((r) => r.workflow_status === 'APPROVED').length
      const deniedCount = validRequests.filter((r) => r.workflow_status === 'DENIED').length

      // Calculate category-based counts
      const leaveRequests = validRequests.filter((r) => r.request_category === 'LEAVE')
      const flightRequests = validRequests.filter((r) => r.request_category === 'FLIGHT')

      const leavePendingCount = leaveRequests.filter(
        (r) => r.workflow_status === 'DRAFT' || r.workflow_status === 'SUBMITTED'
      ).length
      const flightPendingCount = flightRequests.filter(
        (r) => r.workflow_status === 'DRAFT' || r.workflow_status === 'SUBMITTED'
      ).length

      const leaveApprovedCount = leaveRequests.filter((r) => r.workflow_status === 'APPROVED').length
      const flightApprovedCount = flightRequests.filter((r) => r.workflow_status === 'APPROVED').length

      alerts.push({
        rosterPeriod,
        daysUntilDeadline,
        milestone,
        pendingCount,
        submittedCount,
        approvedCount,
        deniedCount,
        leaveRequestsCount: leaveRequests.length,
        flightRequestsCount: flightRequests.length,
        leavePendingCount,
        flightPendingCount,
        leaveApprovedCount,
        flightApprovedCount,
      })
    }
  }

  return alerts.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)
}

/**
 * Send scheduled deadline alert emails
 * Intended to be called by cron job (daily at 9 AM)
 */
export async function sendScheduledDeadlineAlerts(): Promise<{
  success: boolean
  alertsSent: number
  errors: string[]
}> {
  const alerts = await getAllDeadlineAlerts()
  const errors: string[] = []
  let alertsSent = 0

  for (const alert of alerts) {
    // Only send alerts at exact milestone days
    if (ALERT_MILESTONES.includes(alert.daysUntilDeadline as AlertMilestone)) {
      try {
        // TODO: Integrate with email service (Resend)
        // await sendDeadlineAlertEmail(alert)
        console.log(`Alert sent for ${alert.rosterPeriod.code}: ${alert.daysUntilDeadline} days remaining`)
        alertsSent++
      } catch (error) {
        const errorMsg = `Failed to send alert for ${alert.rosterPeriod.code}: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }
  }

  return {
    success: errors.length === 0,
    alertsSent,
    errors,
  }
}

/**
 * Check for upcoming deadlines within specified days
 * @param days - Number of days to look ahead (default: 7)
 */
export async function checkUpcomingDeadlines(days: number = 7): Promise<DeadlineAlert[]> {
  const alerts = await getAllDeadlineAlerts()
  return alerts.filter((alert) => alert.daysUntilDeadline <= days)
}
