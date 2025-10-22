/**
 * Pilot Portal Notifications API Route
 *
 * GET /api/portal/notifications - Get pilot notifications
 * PATCH /api/portal/notifications - Mark notification(s) as read
 * DELETE /api/portal/notifications - Delete notification
 *
 * @spec 001-missing-core-features (US1)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPilotNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} from '@/lib/services/pilot-notification-service'
import { getCurrentPilot } from '@/lib/services/pilot-portal-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

/**
 * GET - Get pilot notifications or unread count
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

    const { searchParams } = new URL(_request.url)
    const countOnly = searchParams.get('countOnly') === 'true'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Return unread count only
    if (countOnly) {
      const countResult = await getUnreadCount(pilotId)

      if (!countResult.success) {
        return NextResponse.json(
          formatApiError(ERROR_MESSAGES.DATABASE.FETCH_FAILED('unread count'), 500),
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: countResult.data,
      })
    }

    // Get notifications list
    const result = await getPilotNotifications(pilotId, limit, unreadOnly)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.DATABASE.FETCH_FAILED('notifications'), 500),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get notifications API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

/**
 * PATCH - Mark notification(s) as read
 */
export async function PATCH(_request: NextRequest) {
  try {
    // Get current pilot
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    const pilotId = pilotResult.data.id

    // Parse request body
    const body = await _request.json()
    const { notificationId, markAll } = body

    // Mark all notifications as read
    if (markAll === true) {
      const result = await markAllNotificationsAsRead(pilotId)

      if (!result.success) {
        return NextResponse.json(
          formatApiError(ERROR_MESSAGES.PORTAL.NOTIFICATION_UPDATE_FAILED, 500),
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: `Marked ${result.data?.count || 0} notifications as read`,
      })
    }

    // Mark single notification as read
    if (!notificationId) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId'), 400),
        { status: 400 }
      )
    }

    const result = await markNotificationAsRead(notificationId, pilotId)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.PORTAL.NOTIFICATION_UPDATE_FAILED, 500),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Notification marked as read',
    })
  } catch (error) {
    console.error('Update notification API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

/**
 * DELETE - Delete notification
 */
export async function DELETE(_request: NextRequest) {
  try {
    // Get current pilot
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    const pilotId = pilotResult.data.id

    const { searchParams } = new URL(_request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notification ID'), 400),
        { status: 400 }
      )
    }

    const result = await deleteNotification(notificationId, pilotId)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.DATABASE.DELETE_FAILED('notification'), 500),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    console.error('Delete notification API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
