/**
 * Reset Password API Route
 *
 * Validates reset token and updates pilot user password.
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 5 password reset attempts per minute per IP (prevents abuse)
 * SAFE LOGGING: Uses sanitized logger to prevent credential/PII leakage
 *
 * @version 2.2.0
 * @updated 2025-10-27 - Added safe logging with sanitization
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePasswordResetToken, resetPassword } from '@/lib/services/pilot-portal-service'
import { z } from 'zod'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withAuthRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { createSafeLogger } from '@/lib/utils/log-sanitizer'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

const logger = createSafeLogger('ResetPasswordAPI')

export const dynamic = 'force-dynamic'

// Validation schema for password reset
const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

// Validation schema for token check
const TokenValidationSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
})

/**
 * GET /api/portal/reset-password?token=xxx
 * Validate a password reset token
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reset token is required',
        },
        { status: 400 }
      )
    }

    // Validate token
    const result = await validatePasswordResetToken(token)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Invalid or expired reset link',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        email: result.data?.email,
      },
    })
  } catch (error: any) {
    logger.error('Token validation API error', error)
    const sanitized = sanitizeError(error, {
      operation: 'validateResetToken',
      endpoint: '/api/portal/reset-password',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * POST /api/portal/reset-password
 * Reset password using valid token
 */
export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const body = await request.json()

    // Validate input
    const validation = ResetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || 'Invalid input',
        },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    // Reset password
    const result = await resetPassword(token, password)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to reset password',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.data?.message || 'Password reset successfully',
    })
  } catch (error: any) {
    logger.error('Reset password API error', error)
    const sanitized = sanitizeError(error, {
      operation: 'resetPassword',
      endpoint: '/api/portal/reset-password',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
