/**
 * Pilot Notification Mark as Read API Route
 * PATCH /api/pilot/notifications/[id]
 *
 * Marks a specific notification as read for the authenticated pilot.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markNotificationAsRead } from '@/lib/services/pilot-notification-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * PATCH /api/pilot/notifications/[id]
 * Mark notification as read
 *
 * @param id - Notification ID (from URL)
 * @returns 200 with success message or 401/404/500 with error
 */
export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
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

    const notificationId = params.id

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification ID is required',
        },
        { status: 400 }
      )
    }

    // Mark notification as read
    const result = await markNotificationAsRead(notificationId, user.id)

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 500
      return NextResponse.json(
        {
          success: false,
          error: result.error || ERROR_MESSAGES.DATABASE.UPDATE_FAILED('notification').message,
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Notification marked as read',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      },
      { status: 500 }
    )
  }
}
