/**
 * Deadline Alerts API Route
 *
 * Fetches deadline alerts for upcoming roster periods showing
 * request statistics and urgency indicators.
 *
 * Author: Maurice Rondeau
 * Date: November 13, 2025
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { getAllDeadlineAlerts } from '@/lib/services/roster-deadline-alert-service'
import { logger } from '@/lib/services/logging-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/deadline-alerts
 *
 * Returns deadline alerts for upcoming roster periods
 */
export const GET = createAdminRoute(
  {
    operation: 'getDeadlineAlerts',
    endpoint: '/api/deadline-alerts',
    rateLimit: false,
  },
  async () => {
    try {
      const alerts = await getAllDeadlineAlerts()

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

      const s = sanitizeError(error, {
        operation: 'getDeadlineAlerts',
        endpoint: '/api/deadline-alerts',
      })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
