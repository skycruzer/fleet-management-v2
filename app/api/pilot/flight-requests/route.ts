import { NextRequest, NextResponse } from 'next/server'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'
import {
  submitPilotFlightRequest,
  getCurrentPilotFlightRequests,
} from '@/lib/services/pilot-flight-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/pilot/flight-requests
 *
 * Fetch all flight requests for the authenticated pilot.
 * Returns list of flight requests sorted by created_at descending.
 *
 * @spec 001-missing-core-features (US3, T057)
 */
export async function GET(_request: NextRequest) {
  try {
    const result = await getCurrentPilotFlightRequests()

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Pilot flight-requests GET error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pilot/flight-requests
 *
 * Submit a new flight request for the authenticated pilot.
 * Validates input and creates notification.
 *
 * Request body:
 * {
 *   request_type: "additional_flight" | "route_change" | "schedule_swap" | "other",
 *   route: string (e.g., "POM-LAE" or "Route description"),
 *   start_date: "YYYY-MM-DD",
 *   end_date: "YYYY-MM-DD",
 *   reason: string (min 10 chars),
 *   additional_details?: string (optional)
 * }
 *
 * @spec 001-missing-core-features (US3, T057)
 */
export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json()

    // Validate input
    const validation = FlightRequestSchema.safeParse(body)
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

    // Submit flight request
    const result = await submitPilotFlightRequest(validation.data)

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('Pilot flight-requests POST error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.message },
      { status: 500 }
    )
  }
}
