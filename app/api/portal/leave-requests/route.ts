/**
 * Pilot Portal Leave Requests API Route
 *
 * Handles pilot self-service leave request operations:
 * - POST: Submit new leave request
 * - GET: Get all leave requests for current pilot
 * - DELETE: Cancel pending leave request
 *
 * @spec 001-missing-core-features (US2)
 */

import { NextRequest, NextResponse } from 'next/server'
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

/**
 * POST - Submit Leave Request
 *
 * Allows authenticated pilot to submit a new leave request.
 */
export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json()

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

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave request submitted successfully',
    })
  } catch (error) {
    console.error('Submit leave request API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

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
  } catch (error) {
    console.error('Get leave requests API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

/**
 * DELETE - Cancel Leave Request
 *
 * Allows pilot to cancel their own pending leave request.
 * Query params: ?id=<request_id>
 */
export async function DELETE(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url)
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

    return NextResponse.json({
      success: true,
      message: 'Leave request cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel leave request API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
