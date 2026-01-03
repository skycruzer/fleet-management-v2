/**
 * Pilot Registration Approval API Route (Admin Only)
 *
 * GET /api/portal/registration-approval - Get pending registrations
 * POST /api/portal/registration-approval - Approve/deny registration
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 * @spec 001-missing-core-features (US8)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingRegistrations,
  reviewPilotRegistration,
} from '@/lib/services/pilot-portal-service'
import { RegistrationApprovalSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET - Get pending registrations (admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.FORBIDDEN, 403), { status: 403 })
    }

    // Get pending registrations
    const result = await getPendingRegistrations()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch pending registrations',
            category: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registrations').category,
            severity: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registrations').severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    console.error('Get pending registrations API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getPendingRegistrations',
      endpoint: '/api/portal/registration-approval',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * POST - Approve or deny registration (admin only)
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.FORBIDDEN, 403), { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { registrationId, ...approvalData } = body

    if (!registrationId) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('registrationId'), 400),
        { status: 400 }
      )
    }

    const validation = RegistrationApprovalSchema.safeParse(approvalData)

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

    // Review registration
    const result = await reviewPilotRegistration(registrationId, validation.data, auth.userId!)

    if (!result.success) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.APPROVAL_FAILED, 500), {
        status: 500,
      })
    }

    // Send notification to pilot (best effort, don't fail if notification fails)
    // Note: We need pilot_id from the registration to send notification
    // For now, we'll skip notification until we update the service to return pilot_id

    const message =
      validation.data.status === 'APPROVED'
        ? 'Registration approved successfully'
        : 'Registration denied'

    return NextResponse.json({
      success: true,
      data: result.data,
      message,
    })
  } catch (error: any) {
    console.error('Review registration API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'reviewRegistration',
      endpoint: '/api/portal/registration-approval',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
