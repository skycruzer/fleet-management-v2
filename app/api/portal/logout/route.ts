/**
 * Pilot Portal Logout API Route
 *
 * POST /api/portal/logout - Sign out pilot and clear session
 *
 * @spec 001-missing-core-features (US1)
 */

import { NextRequest, NextResponse } from 'next/server'
import { pilotLogout } from '@/lib/services/pilot-portal-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

export async function POST(_request: NextRequest) {
  try {
    // Logout pilot
    const result = await pilotLogout()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Logout failed',
            category: ERROR_MESSAGES.AUTH.SESSION_EXPIRED.category,
            severity: ERROR_MESSAGES.AUTH.SESSION_EXPIRED.severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
