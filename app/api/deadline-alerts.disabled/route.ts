/**
 * Deadline Alerts API Route
 * Get deadline alerts and trigger notifications
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/deadline-alerts - Get all deadline alerts for dashboard
 * POST /api/deadline-alerts/send - Manually trigger deadline notifications
 *
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllDeadlineAlerts,
  sendScheduledDeadlineAlerts,
} from '@/lib/services/roster-deadline-alert-service'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { authRateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/deadline-alerts
 * Get all deadline alerts for dashboard display
 *
 * Returns comprehensive deadline information for all upcoming roster periods,
 * including countdown timers and request statistics.
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIp(request)
    const { success } = await authRateLimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Get all deadline alerts
    const alerts = await getAllDeadlineAlerts()

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    })
  } catch (error) {
    console.error('GET /api/deadline-alerts error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getAllDeadlineAlerts',
      endpoint: '/api/deadline-alerts',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * POST /api/deadline-alerts/send
 * Manually trigger deadline alert notifications
 *
 * Checks for milestone deadlines and sends email notifications to all
 * configured fleet managers. This can be called manually or via cron job.
 *
 * Request Body (optional):
 * {
 *   test: boolean - If true, only log alerts without sending emails
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for POST)
    const identifier = getClientIp(request)
    const { success } = await authRateLimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      )
    }

    // Parse request body for test mode
    const body = await request.json().catch(() => ({}))
    const testMode = body.test === true

    if (testMode) {
      // Test mode: Check alerts without sending emails
      const { checkUpcomingDeadlines } = await import(
        '@/lib/services/roster-deadline-alert-service'
      )
      const alerts = await checkUpcomingDeadlines(3)

      return NextResponse.json({
        success: true,
        testMode: true,
        message: 'Test mode: Alerts checked but emails not sent',
        alertsTriggered: alerts,
        emailsSent: [],
      })
    }

    // Production mode: Send actual emails
    const result = await sendScheduledDeadlineAlerts()

    return NextResponse.json({
      success: true,
      testMode: false,
      message: `Sent ${result.emailsSent.filter((e) => e.success).length} deadline alert emails`,
      alertsTriggered: result.alertsTriggered,
      emailsSent: result.emailsSent,
      errors: result.errors,
    })
  } catch (error) {
    console.error('POST /api/deadline-alerts/send error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'sendScheduledDeadlineAlerts',
      endpoint: '/api/deadline-alerts/send',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
