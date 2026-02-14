/**
 * Roster Deadline Alert Service
 *
 * Manages deadline notifications for roster periods. Sends automated email alerts
 * at key milestones before roster deadlines to ensure timely request submissions.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @spec UNIFIED-REQUEST-SYSTEM-IMPLEMENTATION.md (Phase 3)
 */

import { getUpcomingRosterPeriods, RosterPeriodDates } from '@/lib/services/roster-period-service'
import { getAllPilotRequests } from '@/lib/services/unified-request-service'
import { logger } from '@/lib/services/logging-service'
import { Resend } from 'resend'
import { DEFAULT_FROM_EMAIL, DEFAULT_FLEET_MANAGER_EMAIL } from '@/lib/constants/email'

// ============================================================================
// Constants
// ============================================================================

/**
 * Alert milestones (days before deadline)
 */
export const ALERT_MILESTONES = [21, 14, 7, 3, 1, 0] as const

/**
 * Email configuration
 */
let _resend: Resend | null = null
function getResendClient(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not configured')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Alert milestone type
 */
export type AlertMilestone = (typeof ALERT_MILESTONES)[number]

/**
 * Deadline alert information
 */
export interface DeadlineAlert {
  rosterPeriod: RosterPeriodDates
  daysUntilDeadline: number
  milestone: AlertMilestone
  pendingCount: number
  submittedCount: number
  approvedCount: number
  deniedCount: number

  // Category-specific breakdowns
  leaveRequestsCount: number
  flightRequestsCount: number
  leavePendingCount: number
  flightPendingCount: number
  leaveApprovedCount: number
  flightApprovedCount: number
}

/**
 * Email notification result
 */
export interface EmailNotificationResult {
  success: boolean
  recipientEmail: string
  rosterPeriodCode: string
  milestone: AlertMilestone
  messageId?: string
  error?: string
}

/**
 * Alert check result
 */
export interface AlertCheckResult {
  alertsTriggered: DeadlineAlert[]
  emailsSent: EmailNotificationResult[]
  errors: string[]
}

// ============================================================================
// Core Alert Functions
// ============================================================================

/**
 * Check for upcoming deadlines and return alerts
 *
 * Scans upcoming roster periods and identifies which ones are approaching
 * key milestone deadlines (21d, 14d, 7d, 3d, 1d, 0d before deadline).
 *
 * @param lookAheadCount - Number of roster periods to check (default: 3)
 * @returns Array of deadline alerts
 *
 * @example
 * const alerts = await checkUpcomingDeadlines()
 * // Returns alerts for periods at milestone thresholds
 */
export async function checkUpcomingDeadlines(lookAheadCount: number = 3): Promise<DeadlineAlert[]> {
  try {
    // Get upcoming roster periods
    const periods = getUpcomingRosterPeriods(lookAheadCount)
    const alerts: DeadlineAlert[] = []

    for (const period of periods) {
      // Check if this period is at a milestone
      const milestone = ALERT_MILESTONES.find((m) => m === period.daysUntilDeadline)

      if (milestone !== undefined && milestone >= 0) {
        // Get request counts for this roster period
        const result = await getAllPilotRequests({
          roster_period: period.code,
        })

        if (result.success && result.data) {
          const requests = result.data

          const pendingCount = requests.filter(
            (r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'IN_REVIEW'
          ).length

          const submittedCount = requests.filter((r) => r.workflow_status === 'SUBMITTED').length

          const approvedCount = requests.filter((r) => r.workflow_status === 'APPROVED').length

          const deniedCount = requests.filter((r) => r.workflow_status === 'DENIED').length

          // Category-specific breakdowns
          const leaveRequests = requests.filter((r) => r.request_category === 'LEAVE')
          const flightRequests = requests.filter((r) => r.request_category === 'FLIGHT')

          alerts.push({
            rosterPeriod: period,
            daysUntilDeadline: period.daysUntilDeadline,
            milestone,
            pendingCount,
            submittedCount,
            approvedCount,
            deniedCount,
            leaveRequestsCount: leaveRequests.length,
            flightRequestsCount: flightRequests.length,
            leavePendingCount: leaveRequests.filter((r) => r.workflow_status === 'SUBMITTED')
              .length,
            flightPendingCount: flightRequests.filter((r) => r.workflow_status === 'SUBMITTED')
              .length,
            leaveApprovedCount: leaveRequests.filter((r) => r.workflow_status === 'APPROVED')
              .length,
            flightApprovedCount: flightRequests.filter((r) => r.workflow_status === 'APPROVED')
              .length,
          })
        }
      }
    }

    return alerts
  } catch (error) {
    await logger.error('Failed to check upcoming deadlines', {
      source: 'roster-deadline-alert-service:checkUpcomingDeadlines',
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

/**
 * Get all deadline alerts for dashboard display
 *
 * Returns comprehensive deadline information for all upcoming roster periods,
 * including countdown timers and request statistics.
 *
 * @returns Array of deadline alerts
 */
export async function getAllDeadlineAlerts(): Promise<DeadlineAlert[]> {
  try {
    const periods = getUpcomingRosterPeriods(6)
    const alerts: DeadlineAlert[] = []

    for (const period of periods) {
      // Get ALL requests and filter by date range overlap
      // This handles requests that span multiple roster periods
      const result = await getAllPilotRequests({})

      if (result.success && result.data) {
        // Filter requests that span this roster period by date range overlap
        const periodStart = new Date(period.startDate)
        const periodEnd = new Date(period.endDate)

        const requests = result.data.filter((req) => {
          const reqStart = new Date(req.start_date)
          const reqEnd = req.end_date ? new Date(req.end_date) : reqStart

          // Request spans period if:
          // 1. Request starts before period ends AND
          // 2. Request ends after period starts
          return reqStart <= periodEnd && reqEnd >= periodStart
        })

        // Filter by category
        const leaveRequests = requests.filter((r) => r.request_category === 'LEAVE')
        const flightRequests = requests.filter((r) => r.request_category === 'FLIGHT')

        // Overall counts
        const pendingCount = requests.filter(
          (r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'IN_REVIEW'
        ).length

        const submittedCount = requests.filter((r) => r.workflow_status === 'SUBMITTED').length

        const approvedCount = requests.filter((r) => r.workflow_status === 'APPROVED').length

        const deniedCount = requests.filter((r) => r.workflow_status === 'DENIED').length

        // Category-specific counts
        const leaveRequestsCount = leaveRequests.length
        const flightRequestsCount = flightRequests.length

        const leavePendingCount = leaveRequests.filter(
          (r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'IN_REVIEW'
        ).length

        const flightPendingCount = flightRequests.filter(
          (r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'IN_REVIEW'
        ).length

        const leaveApprovedCount = leaveRequests.filter(
          (r) => r.workflow_status === 'APPROVED'
        ).length

        const flightApprovedCount = flightRequests.filter(
          (r) => r.workflow_status === 'APPROVED'
        ).length

        // Determine milestone if within alert range
        const milestone = ALERT_MILESTONES.find((m) => m === period.daysUntilDeadline)

        alerts.push({
          rosterPeriod: period,
          daysUntilDeadline: period.daysUntilDeadline,
          milestone: milestone !== undefined ? milestone : 21, // Default to 21 if not at milestone
          pendingCount,
          submittedCount,
          approvedCount,
          deniedCount,
          leaveRequestsCount,
          flightRequestsCount,
          leavePendingCount,
          flightPendingCount,
          leaveApprovedCount,
          flightApprovedCount,
        })
      }
    }

    return alerts
  } catch (error) {
    await logger.error('Failed to get all deadline alerts', {
      source: 'roster-deadline-alert-service:getAllDeadlineAlerts',
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

// ============================================================================
// Email Notification Functions
// ============================================================================

/**
 * Generate email subject line for deadline alert
 */
function generateEmailSubject(alert: DeadlineAlert): string {
  const { rosterPeriod, daysUntilDeadline, milestone } = alert

  if (milestone === 0) {
    return `🚨 URGENT: Roster ${rosterPeriod.code} Deadline TODAY`
  } else if (milestone === 1) {
    return `⚠️ REMINDER: Roster ${rosterPeriod.code} Deadline TOMORROW`
  } else {
    return `📅 Roster ${rosterPeriod.code} Deadline in ${daysUntilDeadline} Days`
  }
}

/**
 * Generate email HTML body for deadline alert
 */
function generateEmailBody(alert: DeadlineAlert, recipientName: string): string {
  const { rosterPeriod, daysUntilDeadline, milestone, pendingCount, approvedCount } = alert

  const urgencyClass = milestone === 0 ? 'urgent' : milestone <= 3 ? 'warning' : 'info'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .alert-box.urgent { border-left-color: #dc3545; }
    .alert-box.warning { border-left-color: #ffc107; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 14px; color: #6c757d; }
    .cta { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Roster Deadline Alert</h1>
      <p>Hello ${recipientName},</p>
    </div>

    <div class="content">
      <div class="alert-box ${urgencyClass}">
        <h2>Roster Period: ${rosterPeriod.code}</h2>
        <p><strong>Deadline:</strong> ${new Date(rosterPeriod.deadlineDate).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Days Remaining:</strong> ${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'}</p>
        <p><strong>Roster Starts:</strong> ${new Date(rosterPeriod.startDate).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <h3>Request Summary</h3>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${pendingCount}</div>
          <div class="stat-label">Pending Review</div>
        </div>
        <div class="stat">
          <div class="stat-value">${approvedCount}</div>
          <div class="stat-label">Approved</div>
        </div>
      </div>

      ${milestone === 0 ? '<p style="color: #dc3545; font-weight: bold;">⚠️ This is the final day to submit requests for this roster period!</p>' : ''}
      ${milestone <= 3 ? '<p style="color: #ffc107; font-weight: bold;">⏰ Time is running out! Please review and approve pending requests.</p>' : ''}

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests?roster_period=${encodeURIComponent(rosterPeriod.code)}" class="cta">
        Review Requests
      </a>

      <h3>Next Steps</h3>
      <ul>
        <li>Review all pending requests for ${rosterPeriod.code}</li>
        <li>Approve or deny requests before the deadline</li>
        <li>Ensure rostering team has final list by ${new Date(rosterPeriod.deadlineDate).toLocaleDateString('en-AU')}</li>
      </ul>
    </div>

    <div class="footer">
      <p>This is an automated notification from Fleet Management System</p>
      <p>You can manage notification settings in your dashboard</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Send deadline alert email to fleet manager
 *
 * @param alert - Deadline alert information
 * @param recipientEmail - Email address of fleet manager
 * @param recipientName - Name of fleet manager
 * @returns Email notification result
 */
export async function sendDeadlineAlertEmail(
  alert: DeadlineAlert,
  recipientEmail: string,
  recipientName: string
): Promise<EmailNotificationResult> {
  try {
    const subject = generateEmailSubject(alert)
    const html = generateEmailBody(alert, recipientName)

    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
    })

    if (error) {
      await logger.error('Failed to send deadline alert email', {
        source: 'roster-deadline-alert-service:sendDeadlineAlertEmail',
        recipientEmail,
        rosterPeriodCode: alert.rosterPeriod.code,
        error: error.message,
      })

      return {
        success: false,
        recipientEmail,
        rosterPeriodCode: alert.rosterPeriod.code,
        milestone: alert.milestone,
        error: error.message,
      }
    }

    await logger.info('Deadline alert email sent', {
      source: 'roster-deadline-alert-service:sendDeadlineAlertEmail',
      recipientEmail,
      rosterPeriodCode: alert.rosterPeriod.code,
      milestone: alert.milestone,
      messageId: data?.id,
    })

    return {
      success: true,
      recipientEmail,
      rosterPeriodCode: alert.rosterPeriod.code,
      milestone: alert.milestone,
      messageId: data?.id,
    }
  } catch (error) {
    await logger.error('Failed to send deadline alert email', {
      source: 'roster-deadline-alert-service:sendDeadlineAlertEmail',
      recipientEmail,
      rosterPeriodCode: alert.rosterPeriod.code,
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      success: false,
      recipientEmail,
      rosterPeriodCode: alert.rosterPeriod.code,
      milestone: alert.milestone,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send deadline alerts to all configured recipients
 *
 * Checks for milestone deadlines and sends email notifications to all
 * fleet managers configured in the system.
 *
 * @returns Alert check result with emails sent and errors
 */
export async function sendScheduledDeadlineAlerts(): Promise<AlertCheckResult> {
  const result: AlertCheckResult = {
    alertsTriggered: [],
    emailsSent: [],
    errors: [],
  }

  try {
    // Check for alerts at milestone thresholds
    const alerts = await checkUpcomingDeadlines(3)

    if (alerts.length === 0) {
      await logger.info('No deadline alerts triggered', {
        source: 'roster-deadline-alert-service:sendScheduledDeadlineAlerts',
      })
      return result
    }

    result.alertsTriggered = alerts

    // Get fleet manager email addresses from system settings
    // Tracked: tasks/062-tracked-infrastructure-enhancements.md #1
    // For now, use environment variable or fallback
    const recipients: { email: string; name: string }[] = [
      {
        email: process.env.FLEET_MANAGER_EMAIL || DEFAULT_FLEET_MANAGER_EMAIL,
        name: 'Fleet Manager',
      },
    ]

    // Send emails to all recipients for each alert
    for (const alert of alerts) {
      for (const recipient of recipients) {
        const emailResult = await sendDeadlineAlertEmail(alert, recipient.email, recipient.name)
        result.emailsSent.push(emailResult)

        if (!emailResult.success) {
          result.errors.push(`Failed to send alert to ${recipient.email}: ${emailResult.error}`)
        }
      }
    }

    await logger.info('Scheduled deadline alerts sent', {
      source: 'roster-deadline-alert-service:sendScheduledDeadlineAlerts',
      alertsTriggered: alerts.length,
      emailsSent: result.emailsSent.filter((e) => e.success).length,
      errors: result.errors.length,
    })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(`Unexpected error: ${errorMessage}`)

    await logger.error('Failed to send scheduled deadline alerts', {
      source: 'roster-deadline-alert-service:sendScheduledDeadlineAlerts',
      error: errorMessage,
    })

    return result
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a specific roster period is at a deadline milestone
 *
 * @param rosterPeriodCode - Roster period code (e.g., "RP01/2026")
 * @returns True if at milestone, false otherwise
 */
export function isAtDeadlineMilestone(rosterPeriodCode: string): boolean {
  const periods = getUpcomingRosterPeriods(6)
  const period = periods.find((p) => p.code === rosterPeriodCode)

  if (!period) return false

  return ALERT_MILESTONES.includes(period.daysUntilDeadline as AlertMilestone)
}

/**
 * Get urgency level for a deadline
 *
 * @param daysUntilDeadline - Days until deadline
 * @returns Urgency level: "critical" | "high" | "medium" | "low"
 */
export function getDeadlineUrgency(
  daysUntilDeadline: number
): 'critical' | 'high' | 'medium' | 'low' {
  if (daysUntilDeadline <= 0) return 'critical'
  if (daysUntilDeadline <= 3) return 'high'
  if (daysUntilDeadline <= 7) return 'medium'
  return 'low'
}
