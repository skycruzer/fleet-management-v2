/**
 * Pilot Portal Stats API Route
 *
 * GET /api/portal/stats - Get dashboard statistics for authenticated pilot
 *
 * @spec 001-missing-core-features (US1)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPilot, getPilotPortalStats } from '@/lib/services/pilot-portal-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

/**
 * GET - Get portal dashboard statistics
 */
export async function GET(_request: NextRequest) {
  try {
    // Get current pilot
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    const pilotId = pilotResult.data.id

    // Get portal stats
    const statsResult = await getPilotPortalStats(pilotId)

    if (!statsResult.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: statsResult.error || 'Failed to fetch portal statistics',
            category: ERROR_MESSAGES.DATABASE.FETCH_FAILED('statistics').category,
            severity: ERROR_MESSAGES.DATABASE.FETCH_FAILED('statistics').severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: statsResult.data,
    })
  } catch (error) {
    console.error('Get portal stats API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
