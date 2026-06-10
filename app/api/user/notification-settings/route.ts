/**
 * User Notification Settings API Route
 *
 * PATCH /api/user/notification-settings — Update the authenticated admin
 * user's notification preferences. Replaces a direct an_users write that the
 * settings dialog used to perform from the client.
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authRateLimit } from '@/lib/rate-limit'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { updateAdminUserNotificationSettings } from '@/lib/services/admin-service'

const NotificationSettingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_alerts: z.boolean().optional(),
  certification_reminders: z.boolean().optional(),
  leave_request_updates: z.boolean().optional(),
})

export const PATCH = createAdminRoute(
  {
    operation: 'updateNotificationSettings',
    endpoint: '/api/user/notification-settings',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, admin }) => {
    const body = await request.json().catch(() => null)
    const parsed = NotificationSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    await updateAdminUserNotificationSettings(admin.userId, parsed.data)

    revalidatePath('/dashboard/settings')

    return NextResponse.json({ success: true })
  }
)
