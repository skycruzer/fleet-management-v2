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
 * SECURITY: Uses service role client to bypass RLS
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 * @spec 001-missing-core-features (US2)
 */

import { NextResponse } from 'next/server'
import {
  submitPilotLeaveRequest,
  getCurrentPilotLeaveRequests,
  updatePilotLeaveRequest,
  cancelPilotLeaveRequest,
} from '@/lib/services/pilot-leave-service'
import {
  PilotLeaveRequestSchema,
  PilotLeaveCancelSchema,
} from '@/lib/validations/pilot-leave-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { createPilotRoute } from '@/lib/middleware/create-api-route'
import { statusFromErrorCode } from '@/lib/utils/api-response-helper'
import { invalidateRequestCaches } from '@/lib/services/cache-invalidation-helper'

/**
 * POST - Submit Leave Request
 *
 * Allows authenticated pilot to submit a new leave request.
 */
export const POST = createPilotRoute(
  {
    operation: 'submitLeaveRequest',
    endpoint: '/api/portal/leave-requests',
  },
  async ({ request }) => {
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
      const status = statusFromErrorCode((result as { errorCode?: string }).errorCode, 500)
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to submit leave request',
            category: ERROR_MESSAGES.LEAVE.CREATE_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.CREATE_FAILED.severity,
          },
          status
        ),
        { status }
      )
    }

    // Revalidate cache for all affected paths
    await invalidateRequestCaches().catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave request submitted successfully',
    })
  }
)

/**
 * GET - Get Leave Requests
 *
 * Retrieves all leave requests for the authenticated pilot.
 */
export const GET = createPilotRoute(
  {
    operation: 'getLeaveRequests',
    endpoint: '/api/portal/leave-requests',
    rateLimit: false,
  },
  async () => {
    // Get leave requests
    const result = await getCurrentPilotLeaveRequests()

    if (!result.success) {
      const status = statusFromErrorCode((result as { errorCode?: string }).errorCode, 500)
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch leave requests',
            category: ERROR_MESSAGES.LEAVE.FETCH_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.FETCH_FAILED.severity,
          },
          status
        ),
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  }
)

/**
 * PUT - Update Leave Request
 *
 * Allows pilot to update their own SUBMITTED or IN_REVIEW leave request.
 * Query params: ?id=<request_id>
 */
export const PUT = createPilotRoute(
  {
    operation: 'updateLeaveRequest',
    endpoint: '/api/portal/leave-requests',
  },
  async ({ request }) => {
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

    // Update leave request
    const result = await updatePilotLeaveRequest(requestId, validation.data)

    if (!result.success) {
      const statusCode = result.error === ERROR_MESSAGES.AUTH.FORBIDDEN.message ? 403 : 500
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to update leave request',
            category: ERROR_MESSAGES.LEAVE.UPDATE_FAILED?.category || 'database',
            severity: ERROR_MESSAGES.LEAVE.UPDATE_FAILED?.severity || 'error',
          },
          statusCode
        ),
        { status: statusCode }
      )
    }

    // Revalidate cache for all affected paths
    await invalidateRequestCaches().catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave request updated successfully',
    })
  }
)

/**
 * DELETE - Cancel Leave Request
 *
 * Allows pilot to cancel their own pending leave request.
 * Query params: ?id=<request_id>
 */
export const DELETE = createPilotRoute(
  {
    operation: 'cancelLeaveRequest',
    endpoint: '/api/portal/leave-requests',
  },
  async ({ request }) => {
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
      const statusCode = result.error === ERROR_MESSAGES.AUTH.FORBIDDEN.message ? 403 : 500
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to cancel leave request',
            category: ERROR_MESSAGES.LEAVE.DELETE_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.DELETE_FAILED.severity,
          },
          statusCode
        ),
        { status: statusCode }
      )
    }

    // Revalidate cache for all affected paths
    await invalidateRequestCaches().catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({
      success: true,
      message: 'Leave request cancelled successfully',
    })
  }
)
