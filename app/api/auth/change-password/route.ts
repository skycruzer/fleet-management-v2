/**
 * Change Password API Route
 * Developer: Maurice Rondeau
 *
 * POST /api/auth/change-password — Change user password
 * Used for first-login mandatory change and voluntary changes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateSession, changePassword } from '@/lib/services/auth-service'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/middleware/rate-limit-middleware'

const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })

export async function POST(request: NextRequest) {
  try {
    // CSRF validation
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const session = await validateSession()
    if (!session.isValid || !session.user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(session.user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validation = ChangePasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || 'Validation failed',
        },
        { status: 400 }
      )
    }

    const { oldPassword, newPassword } = validation.data

    const result = await changePassword(session.user.id, oldPassword, newPassword)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Determine redirect after password change
    const redirectUrl = session.user.role === 'pilot' ? '/portal/dashboard' : '/dashboard'

    return NextResponse.json({
      success: true,
      redirectUrl,
    })
  } catch (error) {
    console.error('Change password API error:', error)
    return NextResponse.json({ success: false, error: 'An error occurred' }, { status: 500 })
  }
}
