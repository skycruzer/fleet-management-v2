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
import { z } from 'zod'
import { authRateLimit } from '@/lib/rate-limit'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { getUserNotifications, markNotificationAsRead } from '@/lib/services/notification-service'
import { invalidateNotificationCaches } from '@/lib/services/cache-invalidation-helper'

const MarkReadSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID'),
})

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
      const validation = MarkReadSchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'Notification ID required' },
          { status: 400 }
        )
      }

      const { notificationId } = validation.data

      const result = await markNotificationAsRead(notificationId, admin.userId)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      await invalidateNotificationCaches().catch((error) =>
        console.error('Cache invalidation failed (non-blocking):', error)
      )

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Mark notification as read error:', error)
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)
