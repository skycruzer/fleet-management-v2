/**
 * Pilot Portal Login API Route
 *
 * Developer: Maurice Rondeau
 *
 * POST /api/portal/login - Authenticate pilot and create session
 *
 * RATE LIMITING: 5 login attempts per minute per staff ID (prevents per-account
 *                rapid-fire brute force). Per-account lockout (5 failed attempts
 *                → 30 min) provides the stronger brute force defense. Keyed by
 *                staffId instead of IP to avoid locking out every pilot on a
 *                shared office network.
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
import {
  ERROR_MESSAGES,
  formatApiError,
  ErrorCategory,
  ErrorSeverity,
} from '@/lib/utils/error-messages'
import { authRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { validateContentType } from '@/lib/middleware/content-type-middleware'
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

export async function POST(request: NextRequest) {
  try {
    // Content-Type validation
    const contentTypeError = validateContentType(request)
    if (contentTypeError) {
      return contentTypeError
    }

    // Log request info
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
      logger.info('Request body parsed successfully', { hasStaffId: Boolean(body.staffId) })
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
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const { staffId, rememberMe } = validation.data

    // SECURITY: Rate-limit by staff ID (not IP).
    //
    // Previously this route was wrapped in withAuthRateLimit, which keyed the
    // 5/min auth bucket by IP and — worse — shared Upstash's default prefix
    // with the read/mutation limiters, so normal portal traffic consumed the
    // login bucket and locked out every pilot on the same office IP.
    //
    // Keying by staffId isolates each pilot's attempts. Per-account brute
    // force protection is provided by account-lockout-service (5 failed
    // attempts → 30 min lockout), which is stronger than an IP rate limit.
    const rateLimitId = `login:${staffId.trim().toLowerCase()}`
    const rateLimit = await authRateLimit.limit(rateLimitId)
    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))
      logger.warn('Login rate limit exceeded', { staffId, retryAfterSeconds })
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: 'Too many login attempts. Please try again in a minute.',
          code: 429,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
          },
        }
      )
    }

    // SECURITY: Check if account is locked (brute force protection)
    // Soft-fail: if lockout service is unavailable (e.g. missing tables), log and continue
    const lockoutStatus = await checkAccountLockout(staffId)

    if (!lockoutStatus.success) {
      logger.error('Account lockout check failed — proceeding with login', { staffId })
    }

    if (lockoutStatus.success && lockoutStatus.data?.isLocked) {
      logger.warn('Login attempt on locked account', {
        staffId,
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
      rememberMe,
    })

    if (!result.success) {
      // SECURITY: Record failed login attempt (pass staffId as identifier for tracking)
      logger.warn('Failed login attempt', { staffId, ipAddress })
      try {
        await recordFailedAttempt(staffId, ipAddress)
      } catch (err) {
        logger.error('Failed to record failed attempt', { staffId, error: err })
      }

      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.LOGIN_FAILED, 401), {
        status: 401,
      })
    }

    // SECURITY: Clear failed attempts after successful login
    // Clear by both staffId and email to handle any prior mismatch
    try {
      await clearFailedAttempts(staffId)
      const pilotEmail = result.data?.user?.email
      if (pilotEmail && pilotEmail !== staffId) {
        await clearFailedAttempts(pilotEmail)
      }
    } catch (err) {
      logger.error('Failed to clear failed attempts', { staffId, error: err })
    }

    // SECURITY: Session created successfully - return success response
    // Client will handle redirect to dashboard
    // Note: pilotLogin service already creates the session and sets the cookie
    logger.info('Pilot authenticated successfully', {
      userId: result.data?.user?.id,
      hasSecureSession: true,
    })

    // Determine redirect: force password change if needed
    const redirect = result.data?.mustChangePassword
      ? '/portal/change-password'
      : '/portal/dashboard'

    return NextResponse.json({
      success: true,
      data: result.data,
      redirect,
    })
  } catch (error) {
    logger.error('Login API error', error)
    const sanitized = sanitizeError(error, {
      operation: 'pilotLogin',
      endpoint: '/api/portal/login',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
