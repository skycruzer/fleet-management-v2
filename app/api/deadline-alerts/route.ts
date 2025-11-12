/**
 * Deadline Alerts API Route
 *
 * Developer: Maurice Rondeau
 *
 * GET: Retrieve all deadline alerts for upcoming roster periods
 * POST: Manually trigger deadline alert email notifications
 */

import { NextResponse } from 'next/server'
import { getAllDeadlineAlerts, sendScheduledDeadlineAlerts } from '@/lib/services/roster-deadline-alert-service'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/deadline-alerts
 * Returns all deadline alerts for roster periods within 30 days
 */
export async function GET() {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const alerts = await getAllDeadlineAlerts()

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    })
  } catch (error) {
    console.error('Error fetching deadline alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deadline alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/deadline-alerts
 * Manually trigger deadline alert email notifications
 * Intended for testing or manual execution outside cron schedule
 */
export async function POST() {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check when user roles are implemented
    // For now, any authenticated user can trigger deadline alerts

    const result = await sendScheduledDeadlineAlerts()

    return NextResponse.json({
      success: result.success,
      data: {
        alertsSent: result.alertsSent,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('Error sending deadline alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send deadline alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
