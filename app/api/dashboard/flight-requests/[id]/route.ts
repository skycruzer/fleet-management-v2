import { NextRequest, NextResponse } from 'next/server'
import { getFlightRequestById, reviewFlightRequest } from '@/lib/services/flight-request-service'
import { FlightRequestReviewSchema } from '@/lib/validations/flight-request-schema'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/dashboard/flight-requests/[id]
 *
 * Fetch a single flight request by ID for admin review.
 *
 * @spec 001-missing-core-features (US3, T059)
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    // Fetch flight request
    const result = await getFlightRequestById(requestId)

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized')
        ? 401
        : result.error?.includes('not found')
          ? 404
          : 500

      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Admin flight-requests GET [id] error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/dashboard/flight-requests/[id]
 *
 * Review (approve/deny) a flight request.
 * Creates audit log and sends notification to pilot.
 *
 * Request body:
 * {
 *   status: "UNDER_REVIEW" | "APPROVED" | "DENIED",
 *   admin_comments?: string (required for DENIED)
 * }
 *
 * @spec 001-missing-core-features (US3, T059)
 */
export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    const body = await _request.json()

    // Validate input
    const validation = FlightRequestReviewSchema.safeParse(body)
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

    // Review flight request
    const result = await reviewFlightRequest(requestId, validation.data)

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized')
        ? 401
        : result.error?.includes('not found')
          ? 404
          : 500

      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Admin flight-requests PATCH [id] error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.FLIGHT.UPDATE_FAILED.message },
      { status: 500 }
    )
  }
}
