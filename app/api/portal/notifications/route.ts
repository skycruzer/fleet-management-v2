/**
 * Pilot Portal Notifications API Route
 *
 * Developer: Maurice Rondeau
 *
 * GET /api/portal/notifications - Get all notifications for authenticated pilot
 * PATCH /api/portal/notifications - Mark notification as read
 * DELETE /api/portal/notifications - Delete notification
 *
 * @spec Pilot Portal Notifications
 * @version 2.0.0 - Connected to notification service
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '@/lib/services/notification-service'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import {
  ERROR_MESSAGES,
  formatApiError,
  ErrorCategory,
  ErrorSeverity,
} from '@/lib/utils/error-messages'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET - Get Pilot Notifications
 *
 * Returns all notifications for the authenticated pilot,
 * with optional filter for unread only.
 */
export async function GET(request: NextRequest) {
  try {
    // Get current authenticated pilot
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    // Fetch notifications using service layer
    const result = await getUserNotifications(pilot.id, unreadOnly)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch notifications',
            category: ErrorCategory.NETWORK,
            severity: ErrorSeverity.ERROR,
          },
          500
        ),
        { status: 500 }
      )
    }

    // Filter out admin-portal notifications (dual-role users would see /dashboard/* links
    // that redirect to login since they don't have an admin session in the pilot portal)
    const allNotifications = Array.isArray(result.data)
      ? result.data
      : result.data
        ? [result.data]
        : []
    const portalNotifications = allNotifications.filter(
      (n) => !n.link || !n.link.startsWith('/dashboard')
    )

    return NextResponse.json({
      success: true,
      data: portalNotifications,
    })
  } catch (error: any) {
    console.error('Notifications API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getPilotNotifications',
      endpoint: '/api/portal/notifications',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PATCH - Mark Notification as Read
 *
 * Marks a specific notification as read.
 * Body: { notificationId: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    // CSRF validation
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Parse request body
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'Notification ID is required',
            category: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').category,
            severity: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Mark notification as read using service layer (with ownership check)
    const result = await markNotificationAsRead(notificationId, pilot.id)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to mark notification as read',
            category: ErrorCategory.NETWORK,
            severity: ErrorSeverity.ERROR,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    })
  } catch (error: any) {
    console.error('Mark notification as read API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'markNotificationAsRead',
      endpoint: '/api/portal/notifications',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE - Delete Notification
 *
 * Deletes a specific notification.
 * Body: { notificationId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    // CSRF validation
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Parse request body
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'Notification ID is required',
            category: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').category,
            severity: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Delete notification using service layer (with ownership check)
    const result = await deleteNotification(notificationId, pilot.id)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to delete notification',
            category: ErrorCategory.NETWORK,
            severity: ErrorSeverity.ERROR,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    })
  } catch (error: any) {
    console.error('Delete notification API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'deleteNotification',
      endpoint: '/api/portal/notifications',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
