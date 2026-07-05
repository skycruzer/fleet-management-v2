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
 * @version 3.0.0 - Connected to notification service
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '@/lib/services/notification-service'
import {
  ERROR_MESSAGES,
  formatApiError,
  ErrorCategory,
  ErrorSeverity,
} from '@/lib/utils/error-messages'
import { createPilotRoute } from '@/lib/middleware/create-api-route'

const NotificationIdSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID'),
})

/**
 * GET - Get Pilot Notifications
 *
 * Returns all notifications for the authenticated pilot,
 * with optional filter for unread only.
 */
export const GET = createPilotRoute(
  {
    operation: 'getPilotNotifications',
    endpoint: '/api/portal/notifications',
    rateLimit: false,
  },
  async ({ request, pilot }) => {
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
  }
)

/**
 * PATCH - Mark Notification as Read
 *
 * Marks a specific notification as read.
 * Body: { notificationId: string }
 */
export const PATCH = createPilotRoute(
  {
    operation: 'markNotificationAsRead',
    endpoint: '/api/portal/notifications',
    rateLimit: false,
  },
  async ({ request, pilot }) => {
    // Parse and validate request body
    const body = await request.json()
    const validation = NotificationIdSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'A valid notification ID is required',
            category: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').category,
            severity: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    const { notificationId } = validation.data

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
  }
)

/**
 * DELETE - Delete Notification
 *
 * Deletes a specific notification.
 * Body: { notificationId: string }
 */
export const DELETE = createPilotRoute(
  {
    operation: 'deleteNotification',
    endpoint: '/api/portal/notifications',
    rateLimit: false,
  },
  async ({ request, pilot }) => {
    // Parse and validate request body
    const body = await request.json()
    const validation = NotificationIdSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'A valid notification ID is required',
            category: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').category,
            severity: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('notificationId').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    const { notificationId } = validation.data

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
  }
)
