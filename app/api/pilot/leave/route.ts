import { NextRequest, NextResponse } from 'next/server'
import { PilotLeaveRequestSchema } from '@/lib/validations/pilot-leave-schema'
import {
  submitPilotLeaveRequest,
  getCurrentPilotLeaveRequests,
} from '@/lib/services/pilot-leave-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/pilot/leave
 *
 * Fetch all leave requests for the authenticated pilot.
 * Returns list of leave requests sorted by request_date descending.
 *
 * @spec 001-missing-core-features (US2, T047)
 */
export async function GET(_request: NextRequest) {
  try {
    const result = await getCurrentPilotLeaveRequests()

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Pilot leave GET error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.LEAVE.FETCH_FAILED.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pilot/leave
 *
 * Submit a new leave request for the authenticated pilot.
 * Validates input, checks eligibility, and creates notification.
 *
 * Request body:
 * {
 *   request_type: "RDO" | "SDO" | "ANNUAL" | "SICK" | "LSL" | "LWOP" | "MATERNITY" | "COMPASSIONATE",
 *   start_date: "YYYY-MM-DD",
 *   end_date: "YYYY-MM-DD",
 *   reason?: string (optional)
 * }
 *
 * @spec 001-missing-core-features (US2, T047)
 */
export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json()

    // Validate input
    const validation = PilotLeaveRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input. Please check your request.',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Submit leave request
    const result = await submitPilotLeaveRequest(validation.data)

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('Pilot leave POST error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.LEAVE.CREATE_FAILED.message },
      { status: 500 }
    )
  }
}
