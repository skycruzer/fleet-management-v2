/**
 * Notifications API
 * Author: Maurice Rondeau
 * Endpoints for fetching and managing user notifications
 *
 * @version 2.1.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { authRateLimit } from '@/lib/rate-limit'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { getUserNotifications, markNotificationAsRead } from '@/lib/services/notification-service'

export const GET = createAdminRoute(
  {
    operation: 'getNotifications',
    endpoint: '/api/notifications',
    rateLimit: false,
  },
  async ({ admin }) => {
    try {
      // Fetch unread notifications only for header dropdown
      const result = await getUserNotifications(admin.userId, true)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    } catch (error) {
      console.error('Notifications API error:', error)
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)

export const PATCH = createAdminRoute(
  {
    operation: 'markNotificationAsRead',
    endpoint: '/api/notifications',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, admin }) => {
    try {
      const body = await request.json()
      const { notificationId } = body

      if (!notificationId) {
        return NextResponse.json(
          { success: false, error: 'Notification ID required' },
          { status: 400 }
        )
      }

      const result = await markNotificationAsRead(notificationId, admin.userId)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Mark notification as read error:', error)
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)
