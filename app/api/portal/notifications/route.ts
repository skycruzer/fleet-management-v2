/**
 * Pilot Portal Notifications API Route
 *
 * GET /api/portal/notifications - Get all notifications for authenticated pilot
 *
 * @spec Pilot Portal Notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated pilot
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401),
        { status: 401 }
      )
    }

    // TODO: Implement notifications table with proper schema
    // For now, return empty array as notifications feature is not yet implemented
    return NextResponse.json({
      success: true,
      data: [],
    })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500),
      { status: 500 }
    )
  }
}
