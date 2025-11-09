/**
 * Pilot Portal Leave Requests API Route
 *
 * Handles pilot self-service leave request operations:
 * - POST: Submit new leave request
 * - GET: Get all leave requests for current pilot
 * - DELETE: Cancel pending leave request
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST and DELETE methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 * @spec 001-missing-core-features (US2)
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  submitPilotLeaveRequest,
  getCurrentPilotLeaveRequests,
  cancelPilotLeaveRequest,
} from '@/lib/services/pilot-leave-service'
import {
  PilotLeaveRequestSchema,
  PilotLeaveCancelSchema,
} from '@/lib/validations/pilot-leave-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * POST - Submit Leave Request
 *
 * Allows authenticated pilot to submit a new leave request.
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const body = await request.json()

    // Validate request data
    const validation = PilotLeaveRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('leave request').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('leave request').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Submit leave request
    const result = await submitPilotLeaveRequest(validation.data)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to submit leave request',
            category: ERROR_MESSAGES.LEAVE.CREATE_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.CREATE_FAILED.severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    // Revalidate portal pages to clear Next.js cache
    revalidatePath('/portal/leave-requests')
    revalidatePath('/portal/dashboard')
    revalidatePath('/api/portal/leave-requests')
    // Also revalidate admin dashboard
    revalidatePath('/dashboard/leave-requests')

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave request submitted successfully',
    })
  } catch (error: any) {
    console.error('Submit leave request API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'submitLeaveRequest',
      endpoint: '/api/portal/leave-requests'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})

/**
 * GET - Get Leave Requests
 *
 * Retrieves all leave requests for the authenticated pilot.
 */
export async function GET(_request: NextRequest) {
  try {
    // Get leave requests
    const result = await getCurrentPilotLeaveRequests()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch leave requests',
            category: ERROR_MESSAGES.LEAVE.FETCH_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.FETCH_FAILED.severity,
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
    console.error('Get leave requests API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getLeaveRequests',
      endpoint: '/api/portal/leave-requests'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE - Cancel Leave Request
 *
 * Allows pilot to cancel their own pending leave request.
 * Query params: ?id=<request_id>
 */
export const DELETE = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'Request ID is required',
            category: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('id').category,
            severity: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('id').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Validate request ID
    const validation = PilotLeaveCancelSchema.safeParse({ request_id: requestId })

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request ID').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request ID').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Cancel leave request
    const result = await cancelPilotLeaveRequest(requestId)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to cancel leave request',
            category: ERROR_MESSAGES.LEAVE.DELETE_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.DELETE_FAILED.severity,
          },
          result.error === ERROR_MESSAGES.AUTH.FORBIDDEN.message ? 403 : 500
        ),
        { status: result.error === ERROR_MESSAGES.AUTH.FORBIDDEN.message ? 403 : 500 }
      )
    }

    // Revalidate portal pages to clear Next.js cache
    revalidatePath('/portal/leave-requests')
    revalidatePath('/portal/dashboard')
    revalidatePath('/api/portal/leave-requests')
    // Also revalidate admin dashboard
    revalidatePath('/dashboard/leave-requests')

    return NextResponse.json({
      success: true,
      message: 'Leave request cancelled successfully',
    })
  } catch (error: any) {
    console.error('Cancel leave request API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'cancelLeaveRequest',
      endpoint: '/api/portal/leave-requests'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
