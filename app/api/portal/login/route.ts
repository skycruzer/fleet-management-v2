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
 * @version 2.1.0
 * @updated 2025-10-27 - Added safe logging with sanitization
 * @spec 001-missing-core-features (US1)
 */

import { NextRequest, NextResponse } from 'next/server'
import { pilotLogin } from '@/lib/services/pilot-portal-service'
import { PilotLoginSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES, formatApiError, ErrorCategory, ErrorSeverity } from '@/lib/utils/error-messages'
import { createPilotSession } from '@/lib/auth/pilot-session'
import { withAuthRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { createSafeLogger } from '@/lib/utils/log-sanitizer'

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

    // Authenticate pilot
    const result = await pilotLogin(validation.data)

    if (!result.success) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.LOGIN_FAILED, 401), {
        status: 401,
      })
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: result.data?.user,
        // Session is managed via httpOnly cookies
      },
    })

    // Set session cookie for bcrypt-authenticated pilots
    const pilotUser = result.data?.user
    if (pilotUser?.id && pilotUser?.email) {
      const sessionToken = await createPilotSession(pilotUser.id, pilotUser.email, response)
      logger.info('Session cookie created', {
        userId: pilotUser.id,
        email: pilotUser.email,
        hasToken: Boolean(sessionToken)
      })
    }

    return response
  } catch (error) {
    logger.error('Login API error', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
})
