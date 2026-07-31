/**
 * Admin Change Password API Route
 *
 * POST /api/user/change-password — Change the authenticated admin user's password.
 * Verifies the current password against an_users.password_hash (bcrypt) and writes
 * the new hash to the same credential store adminLogin checks. Replaces the old
 * client-side supabase.auth.updateUser() call, which always failed because admin
 * sessions are Redis-backed (admin-session cookie), not Supabase Auth sessions.
 */

import { NextResponse } from 'next/server'
import { authRateLimit } from '@/lib/rate-limit'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { changeAdminPassword } from '@/lib/services/admin-auth-service'
import { ChangeAdminPasswordSchema } from '@/lib/validations/change-password-schema'

export const POST = createAdminRoute(
  {
    operation: 'changeAdminPassword',
    endpoint: '/api/user/change-password',
    schema: ChangeAdminPasswordSchema,
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ body, admin }) => {
    const result = await changeAdminPassword(admin.userId, body.currentPassword, body.newPassword)

    if (!result.success) {
      const status =
        result.errorCode === 'INVALID_CURRENT_PASSWORD' ||
        result.errorCode === 'ACCOUNT_NOT_CONFIGURED'
          ? 400
          : result.errorCode === 'NOT_FOUND'
            ? 404
            : 500
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    return NextResponse.json({
      success: true,
      redirect: '/auth/login?passwordChanged=1',
    })
  }
)
