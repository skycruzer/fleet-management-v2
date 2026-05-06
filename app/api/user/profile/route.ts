/**
 * User Profile API Route
 *
 * PATCH /api/user/profile — Update the authenticated admin user's profile.
 * The dialog used to write directly to `an_users` from the client; this route
 * replaces that with the standard mutation pipeline (CSRF, auth, rate limit,
 * service layer, revalidate).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { updateAdminUserProfile } from '@/lib/services/admin-service'

const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
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
    const parsed = ProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    const data = await updateAdminUserProfile(auth.userId!, { name: parsed.data.name })

    revalidatePath('/dashboard/settings')

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const sanitized = sanitizeError(error, {
      operation: 'updateUserProfile',
      endpoint: '/api/user/profile',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
