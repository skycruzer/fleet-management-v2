/**
 * Pilot Notifications API Route
 * GET /api/pilot/notifications
 *
 * Fetches notifications for the authenticated pilot user.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPilotNotifications } from '@/lib/services/pilot-notification-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/pilot/notifications
 * Fetch pilot notifications
 *
 * @query unread_only - Optional boolean to fetch only unread notifications
 * @returns 200 with notifications array or 401/500 with error
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
        },
        { status: 401 }
      )
    }

    // Check query parameters
    const searchParams = _request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread_only') === 'true'

    // Fetch notifications
    const result = await getPilotNotifications(user.id, 50, unreadOnly)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || ERROR_MESSAGES.DATABASE.FETCH_FAILED('notifications').message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        count: result.data?.length || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      },
      { status: 500 }
    )
  }
}
