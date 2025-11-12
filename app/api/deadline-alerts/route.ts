/**
 * Deadline Alerts API Route
 *
 * Fetches deadline alerts for upcoming roster periods showing
 * request statistics and urgency indicators.
 *
 * Author: Maurice Rondeau
 * Date: November 13, 2025
 */

import { NextResponse } from 'next/server'
import { getDeadlineAlerts } from '@/lib/services/roster-deadline-alert-service'
import { logger } from '@/lib/services/logging-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/deadline-alerts
 *
 * Returns deadline alerts for upcoming roster periods
 */
export async function GET() {
  try {
    const alerts = await getDeadlineAlerts()

    return NextResponse.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch deadline alerts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deadline alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
