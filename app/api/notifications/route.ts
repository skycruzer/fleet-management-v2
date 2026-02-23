/**
 * Notifications API
 * Author: Maurice Rondeau
 * Endpoints for fetching and managing user notifications
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { getUserNotifications, markNotificationAsRead } from '@/lib/services/notification-service'

export async function GET() {
  try {
    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()

    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch unread notifications only for header dropdown
    const result = await getUserNotifications(auth.userId!, true)

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

export async function PATCH(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()

    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID required' },
        { status: 400 }
      )
    }

    const result = await markNotificationAsRead(notificationId, auth.userId!)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
