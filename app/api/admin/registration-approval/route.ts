/**
 * Pilot Registration Approval API Route (Admin Only)
 *
 * GET /api/admin/registration-approval - Get pending registrations
 * POST /api/admin/registration-approval - Approve/deny registration
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 3.1.0
 * @updated 2026-07-25 - Moved out of /api/portal/* so admins can actually reach it
 * @spec 001-missing-core-features (US8)
 *
 * NOTE ON THE PATH: this route previously lived at /api/portal/registration-approval.
 * `proxy.ts` gates every /api/portal/* path on the caller existing in `pilot_users`,
 * so a pure admin was rejected with 403 before the handler ever ran — the route
 * used `createAdminRoute`, which no admin could satisfy. That is the root cause
 * behind tasks/061-tracked-admin-auth-registration-approval.md, which recorded the
 * symptom ("admin auth isn't passed through") but not the reason. Under /api/admin/*
 * the proxy's admin branch applies and the factory's own auth is authoritative.
 */

import { NextResponse } from 'next/server'
import {
  getPendingRegistrations,
  reviewPilotRegistration,
} from '@/lib/services/pilot-portal-service'
import { RegistrationApprovalSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { createAdminRoute } from '@/lib/middleware/create-api-route'

/**
 * GET - Get pending registrations (admin only)
 */
export const GET = createAdminRoute(
  {
    operation: 'getPendingRegistrations',
    endpoint: '/api/admin/registration-approval',
    rateLimit: false,
  },
  async () => {
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
  }
)

/**
 * POST - Approve or deny registration (admin only)
 */
export const POST = createAdminRoute(
  {
    operation: 'reviewRegistration',
    endpoint: '/api/admin/registration-approval',
  },
  async ({ request, admin }) => {
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
    const result = await reviewPilotRegistration(registrationId, validation.data, admin.userId)

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
  }
)
