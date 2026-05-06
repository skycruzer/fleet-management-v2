/**
 * User Notification Settings API Route
 *
 * PATCH /api/user/notification-settings — Update the authenticated admin
 * user's notification preferences. Replaces a direct an_users write that the
 * settings dialog used to perform from the client.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { updateAdminUserNotificationSettings } from '@/lib/services/admin-service'

const NotificationSettingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_alerts: z.boolean().optional(),
  certification_reminders: z.boolean().optional(),
  leave_request_updates: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = NotificationSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    await updateAdminUserNotificationSettings(auth.userId!, parsed.data)

    revalidatePath('/dashboard/settings')

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const sanitized = sanitizeError(error, {
      operation: 'updateNotificationSettings',
      endpoint: '/api/user/notification-settings',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
