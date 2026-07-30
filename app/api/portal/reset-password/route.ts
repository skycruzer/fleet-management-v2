/**
 * Reset Password API Route
 *
 * Validates reset token and updates pilot user password.
 *
 * Developer: Maurice Rondeau
 *
 * NOTE: No CSRF protection — unauthenticated flow with no session to forge.
 *       Rate limiting (5 req/min/IP) and token-based validation prevent abuse.
 * RATE LIMITING: 5 password reset attempts per minute per IP (prevents abuse)
 * SAFE LOGGING: Uses sanitized logger to prevent credential/PII leakage
 *
 * @version 2.2.0
 * @updated 2025-10-27 - Added safe logging with sanitization
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePasswordResetToken, resetPassword } from '@/lib/services/pilot-portal-service'
import { z } from 'zod'
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
 * Partially mask an email for display.
 *
 * The reset screen shows "for <email>" so the user can confirm which account
 * they are resetting. Returning the full address meant anyone holding a reset
 * token — a forwarded link, shared browser history, a referrer leak — could
 * resolve it to the pilot's address. Masking keeps the confirmation useful to
 * the account owner while disclosing far less to anyone else.
 *
 * jdoe@airline.com -> j••e@airline.com ; al@airline.com -> a•@airline.com
 */
function maskEmail(email: string | undefined): string | undefined {
  if (!email) return undefined
  const at = email.lastIndexOf('@')
  if (at <= 0) return '•••'

  const local = email.slice(0, at)
  const domain = email.slice(at)

  if (local.length <= 2) return `${local[0]}${'•'.repeat(Math.max(local.length - 1, 1))}${domain}`
  return `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}${domain}`
}

/**
 * GET /api/portal/reset-password?token=xxx
 * Validate a password reset token
 *
 * Rate limited: this is an unauthenticated endpoint that performs a database
 * lookup per call. Only POST was limited before.
 */
export const GET = withAuthRateLimit(async (request: NextRequest) => {
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
        email: maskEmail(result.data?.email),
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
})

/**
 * POST /api/portal/reset-password
 * Reset password using valid token
 */
export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
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
