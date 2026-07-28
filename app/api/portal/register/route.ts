/**
 * Pilot Portal Registration API Route
 *
 * POST /api/portal/register - Submit pilot registration for approval
 * GET /api/portal/register?email=... - Check registration status
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 5 registration attempts per minute per IP (prevents signup abuse)
 * SAFE LOGGING: Uses sanitized logger to prevent credential/PII leakage
 *
 * @version 3.0.0 - SECURITY: Added password complexity validation
 * @updated 2025-11-04 - Integrated password validation service
 * @updated 2025-10-27 - Added safe logging with sanitization
 * @spec 001-missing-core-features (US1, US8)
 *
 * SECURITY FEATURES:
 * - Password strength validation (min 12 chars, complexity requirements)
 * - Common password blocking (100+ entries)
 * - Keyboard pattern detection
 * - Sequential pattern detection
 * - Real-time strength scoring (0-4 scale)
 * - Email-in-password detection
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitPilotRegistration } from '@/lib/services/pilot-portal-service'
import { PilotRegistrationSchema } from '@/lib/validations/pilot-portal-schema'
import {
  ERROR_MESSAGES,
  formatApiError,
  ErrorCategory,
  ErrorSeverity,
} from '@/lib/utils/error-messages'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withAuthRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { createSafeLogger } from '@/lib/utils/log-sanitizer'
import { validatePassword } from '@/lib/services/password-validation-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

const logger = createSafeLogger('PortalRegistrationAPI')

/**
 * POST - Submit new pilot registration
 */
export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Parse and validate request body
    const body = await request.json()

    // Preprocess: Convert empty strings to undefined for optional fields
    // This ensures Zod's .optional() validation works correctly
    const preprocessedBody = {
      ...body,
      date_of_birth: body.date_of_birth === '' ? undefined : body.date_of_birth,
      phone_number: body.phone_number === '' ? undefined : body.phone_number,
      address: body.address === '' ? undefined : body.address,
      employee_id: body.employee_id === '' ? undefined : body.employee_id,
    }

    const validation = PilotRegistrationSchema.safeParse(preprocessedBody)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        formatApiError(
          {
            message: firstError.message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT(firstError.path[0] as string)
              .category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT(firstError.path[0] as string)
              .severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // SECURITY: Validate password strength
    const passwordValidation = await validatePassword(
      validation.data.password,
      validation.data.email
    )

    if (!passwordValidation.isValid) {
      logger.warn('Registration rejected: weak password', {
        email: validation.data.email,
        score: passwordValidation.score,
        errors: passwordValidation.errors,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Password does not meet security requirements',
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.ERROR,
          details: {
            errors: passwordValidation.errors,
            suggestions: passwordValidation.suggestions,
            score: passwordValidation.score,
            requirements: {
              minLength: 12,
              requireUppercase: true,
              requireLowercase: true,
              requireNumber: true,
              requireSpecial: true,
              notCommon: true,
            },
          },
          statusCode: 400,
        },
        { status: 400 }
      )
    }

    logger.info('Password validation passed', {
      email: validation.data.email,
      score: passwordValidation.score,
    })

    // Submit registration
    const result = await submitPilotRegistration(validation.data)

    if (!result.success) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED, 400), {
        status: 400,
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Registration submitted successfully. Awaiting admin approval.',
    })
  } catch (error) {
    logger.error('Registration API error', error)
    const sanitized = sanitizeError(error, {
      operation: 'submitPilotRegistration',
      endpoint: '/api/portal/register',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})

// NOTE: there is deliberately no GET handler here.
//
// `proxy.ts` allowlists this path for *all* methods so that anonymous visitors can submit a
// registration. A status-by-email GET therefore ran unauthenticated, and it returned whatever
// `getRegistrationStatus()` selected — which was the whole `pilot_users` row, `password_hash`
// included. Its `.ilike()` filter also accepted `%` from the query string, so a single request
// could match every account. Nothing in the app ever called it. If a status lookup is needed
// again, it must prove ownership of the address (emailed link or signed token) rather than
// trusting an email in the query string.
