/**
 * User Profile API Route
 *
 * PATCH /api/user/profile — Update the authenticated admin user's profile.
 * The dialog used to write directly to `an_users` from the client; this route
 * replaces that with the standard mutation pipeline (CSRF, auth, rate limit,
 * service layer, revalidate).
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authRateLimit } from '@/lib/rate-limit'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { updateAdminUserProfile } from '@/lib/services/admin-service'

const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
})

export const PATCH = createAdminRoute(
  {
    operation: 'updateUserProfile',
    endpoint: '/api/user/profile',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, admin }) => {
    const body = await request.json().catch(() => null)
    const parsed = ProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    const data = await updateAdminUserProfile(admin.userId, { name: parsed.data.name })

    revalidatePath('/dashboard/settings')

    return NextResponse.json({ success: true, data })
  }
)
