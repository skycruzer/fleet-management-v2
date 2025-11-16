/**
 * Pilot Portal Login API Route
 *
 * Developer: Maurice Rondeau
 *
 * POST /api/portal/login - Authenticate pilot and create session
 *
 * RATE LIMITING: 5 login attempts per minute per IP (prevents brute force attacks)
 * NOTE: No CSRF protection on login (user has no session yet, CSRF token generated after login)
 * SAFE LOGGING: Uses sanitized logger to prevent credential/PII leakage
 *
 * @version 4.0.0 - SECURITY: Added account lockout protection (brute force prevention)
 * @updated 2025-11-04 - Integrated account lockout service
 * @updated 2025-11-04 - Implemented secure server-side session management
 * @updated 2025-10-27 - Added safe logging with sanitization
 * @spec 001-missing-core-features (US1)
 *
 * SECURITY FEATURES:
 * - Session Fixation Protection: Cryptographically secure 32-byte tokens
 * - Brute Force Protection: Account lockout after 5 failed attempts (30 min)
 * - Failed attempt tracking: 15-minute rolling window
 * - Email notifications: Lockout and unlock alerts
 * - Sessions stored server-side in pilot_sessions table
 * - HTTP-only, secure cookies
 * - Automatic expiry after 24 hours
 * - Session revocation on logout
 */

import { NextRequest, NextResponse } from 'next/server'
import { pilotLogin } from '@/lib/services/pilot-portal-service'
import { PilotLoginSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES, formatApiError, ErrorCategory, ErrorSeverity } from '@/lib/utils/error-messages'
import { withAuthRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { createSafeLogger } from '@/lib/utils/log-sanitizer'
import {
  checkAccountLockout,
  recordFailedAttempt,
  clearFailedAttempts,
} from '@/lib/services/account-lockout-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

const logger = createSafeLogger('PortalLoginAPI')

export async function GET() {
  return NextResponse.json(
    formatApiError(
      {
        message: 'Method not allowed. Use POST to login.',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.ERROR,
      },
      405
    ),
    { status: 405 }
  )
}

export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    // Check content type
    const contentType = request.headers.get('content-type')
    logger.info('Login API called', { contentType })

    // Parse and validate request body
    let body
    try {
      const text = await request.text()
      logger.info('Request body received', { hasContent: Boolean(text) })

      if (!text || text.trim() === '') {
        logger.warn('Empty request body received')
        return NextResponse.json(
          formatApiError(
            {
              message: 'Request body is empty',
              category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request').category,
              severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request').severity,
            },
            400
          ),
          { status: 400 }
        )
      }

      body = JSON.parse(text)
      logger.info('Request body parsed successfully', { hasEmail: Boolean(body.email) })
    } catch (parseError) {
      logger.error('JSON parse error', parseError)
      return NextResponse.json(
        formatApiError(
          {
            message: 'Invalid JSON in request body',
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    const validation = PilotLoginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('credentials').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('credentials').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Extract request metadata for session tracking
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const { email } = validation.data

    // SECURITY: Check if account is locked (brute force protection)
    const lockoutStatus = await checkAccountLockout(email)

    if (!lockoutStatus.success) {
      logger.error('Failed to check account lockout status', { email })
      return NextResponse.json(
        formatApiError(
          {
            message: 'Unable to verify account status. Please try again later.',
            category: ErrorCategory.NETWORK,
            severity: ErrorSeverity.ERROR,
          },
          500
        ),
        { status: 500 }
      )
    }

    if (lockoutStatus.data?.isLocked) {
      logger.warn('Login attempt on locked account', {
        email,
        remainingTime: lockoutStatus.data.remainingTime,
        lockedUntil: lockoutStatus.data.lockedUntil,
      })

      return NextResponse.json(
        formatApiError(
          {
            message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockoutStatus.data.remainingTime} minutes.`,
            category: ErrorCategory.AUTHENTICATION,
            severity: ErrorSeverity.ERROR,
          },
          423 // 423 Locked
        ),
        {
          status: 423,
          headers: {
            'Retry-After': String((lockoutStatus.data.remainingTime || 5) * 60), // Seconds
          },
        }
      )
    }

    // Authenticate pilot (creates secure session internally)
    const result = await pilotLogin(validation.data, {
      ipAddress,
      userAgent,
    })

    if (!result.success) {
      // SECURITY: Record failed login attempt
      logger.warn('Failed login attempt', { email, ipAddress })
      await recordFailedAttempt(email, ipAddress)

      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.LOGIN_FAILED, 401), {
        status: 401,
      })
    }

    // SECURITY: Clear failed attempts after successful login
    await clearFailedAttempts(email)

    // SECURITY: Session created successfully - perform server-side redirect
    // Server-side redirect ensures cookie is properly set before navigation
    // Note: pilotLogin service already creates the session in pilot_sessions table
    const redirectUrl = new URL('/portal/dashboard', request.url)
    const response = NextResponse.redirect(redirectUrl)

    logger.info('Pilot authenticated successfully - redirecting to dashboard', {
      userId: result.data?.user?.id,
      hasSecureSession: true,
    })

    return response
  } catch (error) {
    logger.error('Login API error', error)
    const sanitized = sanitizeError(error, {
      operation: 'pilotLogin',
      endpoint: '/api/portal/login'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
