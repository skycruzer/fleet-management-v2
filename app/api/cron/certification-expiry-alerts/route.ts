/**
 * Certification Expiry Alerts Cron Job
 * Developer: Maurice Rondeau
 *
 * Runs daily at 6:00 AM to check for expiring certifications
 * and send email notifications to pilots.
 *
 * Enhanced with:
 * - Per-check-type reminder day configuration
 * - Deduplication via certification_email_log
 * - notification_level-based tracking (90/60/30/14/7 days + EXPIRED)
 * - User notification preference respect
 *
 * Schedule: Daily at 6:00 AM (configured in vercel.json)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCertificationExpiryAlert } from '@/lib/services/pilot-email-service'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

type NotificationLevel =
  | '90_DAYS'
  | '60_DAYS'
  | '30_DAYS'
  | '14_DAYS'
  | '7_DAYS'
  | 'EXPIRED'
  | 'CRITICAL'

/**
 * Map days-until-expiry to the notification_level enum value.
 * Returns null if no matching level (e.g., 45 days doesn't match any standard level).
 */
function determineNotificationLevel(daysUntilExpiry: number): NotificationLevel | null {
  if (daysUntilExpiry < 0) return 'EXPIRED'
  if (daysUntilExpiry <= 7) return '7_DAYS'
  if (daysUntilExpiry <= 14) return '14_DAYS'
  if (daysUntilExpiry <= 30) return '30_DAYS'
  if (daysUntilExpiry <= 60) return '60_DAYS'
  if (daysUntilExpiry <= 90) return '90_DAYS'
  return null
}

/**
 * Check if a notification should be sent based on the check type's configured reminder days.
 * For expired certs (days < 0), always return true if expiry notifications are enabled.
 */
function shouldSendForReminderDays(
  daysUntilExpiry: number,
  reminderDays: number[] | null
): boolean {
  const defaultReminderDays = [90, 60, 30, 14, 7]
  const activeDays = reminderDays && reminderDays.length > 0 ? reminderDays : defaultReminderDays

  // Always notify for expired certifications
  if (daysUntilExpiry < 0) return true

  // Check if days_until_expiry falls within any reminder threshold
  return activeDays.some((threshold) => daysUntilExpiry <= threshold)
}

export async function GET(request: Request) {
  try {
    // Verify this is a cron job request (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get all expiring certifications using enhanced database function
    // Now includes per-check-type reminder config and pilot_check_id for dedup
    const { data: expiringChecks, error } = await supabase.rpc(
      'get_expiring_certifications_with_email',
      { days_threshold: 90 }
    )

    if (error) {
      console.error('Error fetching expiring certifications:', error)
      return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 })
    }

    if (!expiringChecks || expiringChecks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expiring certifications',
        count: 0,
      })
    }

    // Filter checks that should send notifications based on their reminder_days config
    const checksToNotify = expiringChecks.filter((check) =>
      shouldSendForReminderDays(check.days_until_expiry, check.reminder_days)
    )

    if (checksToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No certifications matching reminder thresholds',
        count: 0,
      })
    }

    // Fetch existing notification logs to deduplicate
    const pilotCheckIds = checksToNotify.map((c) => c.pilot_check_id)
    const { data: existingLogs } = await supabase
      .from('certification_email_log')
      .select('pilot_check_id, notification_level')
      .in('pilot_check_id', pilotCheckIds)
      .eq('notification_status', 'SENT')

    // Build dedup set: "pilotCheckId:level"
    const sentSet = new Set(
      (existingLogs || []).map((log) => `${log.pilot_check_id}:${log.notification_level}`)
    )

    // Filter out already-sent notifications at the same level
    const newChecksToNotify = checksToNotify.filter((check) => {
      const level = determineNotificationLevel(check.days_until_expiry)
      if (!level) return false
      return !sentSet.has(`${check.pilot_check_id}:${level}`)
    })

    if (newChecksToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All matching notifications already sent',
        count: 0,
        skipped: checksToNotify.length,
      })
    }

    // Group by pilot for batch email sending
    const certsByPilot = newChecksToNotify.reduce(
      (
        acc: Record<
          string,
          {
            pilot: {
              first_name: string
              last_name: string
              rank: string
              employee_id: string
              email: string
            }
            certifications: Array<{
              pilotCheckId: string
              checkTypeId: string
              checkCode: string
              checkDescription: string
              expiryDate: string
              daysUntilExpiry: number
              level: NotificationLevel
            }>
          }
        >,
        check
      ) => {
        const pilotId = check.pilot_id
        const level = determineNotificationLevel(check.days_until_expiry)
        if (!level) return acc

        if (!acc[pilotId]) {
          acc[pilotId] = {
            pilot: {
              first_name: check.first_name,
              last_name: check.last_name,
              rank: check.rank,
              employee_id: check.employee_id,
              email: check.email,
            },
            certifications: [],
          }
        }
        acc[pilotId].certifications.push({
          pilotCheckId: check.pilot_check_id,
          checkTypeId: check.check_type_id,
          checkCode: check.check_code || 'Unknown',
          checkDescription: check.check_description || 'Unknown certification',
          expiryDate: format(new Date(check.expiry_date), 'MMM dd, yyyy'),
          daysUntilExpiry: check.days_until_expiry,
          level,
        })
        return acc
      },
      {}
    )

    // Send email alerts and log results
    const emailResults = []
    for (const pilotId in certsByPilot) {
      const { pilot, certifications } = certsByPilot[pilotId]

      if (!pilot.email) {
        console.warn(`Skipping pilot ${pilotId} - no email address`)
        continue
      }

      // Determine overall urgency level based on most critical certification
      const mostCritical = Math.min(...certifications.map((c) => c.daysUntilExpiry))
      let urgencyLevel: 'critical' | 'warning' | 'notice'
      if (mostCritical < 0) {
        urgencyLevel = 'critical'
      } else if (mostCritical <= 30) {
        urgencyLevel = 'warning'
      } else {
        urgencyLevel = 'notice'
      }

      // Send consolidated email for this pilot
      const emailResult = await sendCertificationExpiryAlert({
        firstName: pilot.first_name,
        lastName: pilot.last_name,
        email: pilot.email,
        rank: pilot.rank,
        certifications: certifications.map((c) => ({
          checkCode: c.checkCode,
          checkDescription: c.checkDescription,
          expiryDate: c.expiryDate,
          daysUntilExpiry: c.daysUntilExpiry,
        })),
        urgencyLevel,
      })

      // Log each certification notification to dedup table
      for (const cert of certifications) {
        await supabase.from('certification_email_log').insert({
          pilot_id: pilotId,
          pilot_check_id: cert.pilotCheckId,
          check_type_id: cert.checkTypeId,
          notification_level: cert.level,
          notification_status: emailResult.success ? 'SENT' : 'FAILED',
          email_address: pilot.email,
          error_message: emailResult.success ? null : emailResult.error || 'Unknown error',
        })
      }

      emailResults.push({
        pilotId,
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        email: pilot.email,
        certificationsCount: certifications.length,
        urgencyLevel,
        success: emailResult.success,
        error: emailResult.error,
      })

      if (!emailResult.success) {
        console.error(`Failed to send alert to ${pilot.email}:`, emailResult.error)
      }
    }

    // Summary
    const successCount = emailResults.filter((r) => r.success).length
    const failureCount = emailResults.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: 'Certification expiry alerts processed',
      summary: {
        totalPilots: emailResults.length,
        successful: successCount,
        failed: failureCount,
        totalCertsChecked: expiringChecks.length,
        matchedThresholds: checksToNotify.length,
        newNotifications: newChecksToNotify.length,
        deduplicatedSkipped: checksToNotify.length - newChecksToNotify.length,
      },
      results: emailResults,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
