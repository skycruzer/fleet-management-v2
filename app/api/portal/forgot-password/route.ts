/**
 * Forgot Password API Route
 *
 * Handles password reset requests for pilot portal users.
 * Generates secure token and sends password reset email.
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 5 password reset requests per minute per IP (prevents email flooding)
 * SAFE LOGGING: Uses sanitized logger to prevent credential/PII leakage
 *
 * @version 2.2.0
 * @updated 2025-10-27 - Added safe logging with sanitization
 */

import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/services/pilot-portal-service'
import { z } from 'zod'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withAuthRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { createSafeLogger } from '@/lib/utils/log-sanitizer'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

const logger = createSafeLogger('ForgotPasswordAPI')

export const dynamic = 'force-dynamic'

// Validation schema
const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const body = await request.json()

    // Validate input
    const validation = ForgotPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || 'Invalid email address',
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Request password reset
    const result = await requestPasswordReset(email)

    // Always return 200 to prevent email enumeration
    // Even if email doesn't exist, we say "email sent"
    return NextResponse.json(
      {
        success: true,
        message:
          result.data?.message ||
          'If an account exists with this email, a password reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error('Forgot password API error', error)
    const sanitized = sanitizeError(error, {
      operation: 'forgotPassword',
      endpoint: '/api/portal/forgot-password',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
