/**
 * Pilot Portal Flight Requests API Route
 *
 * Handles pilot self-service flight request operations:
 * - POST: Submit new flight request
 * - GET: Get all flight requests for current pilot
 * - DELETE: Cancel pending flight request
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST and DELETE methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 * @spec 001-missing-core-features (US3)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  submitPilotFlightRequest,
  getCurrentPilotFlightRequests,
  cancelPilotFlightRequest,
} from '@/lib/services/pilot-flight-service'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'

/**
 * POST - Submit Flight Request
 *
 * Allows authenticated pilot to submit a new flight request.
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
    const validation = FlightRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('flight request').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('flight request').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Submit flight request
    const result = await submitPilotFlightRequest(validation.data)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to submit flight request',
            category: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.category,
            severity: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Flight request submitted successfully',
    })
  } catch (error) {
    console.error('Submit flight request API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
})

/**
 * GET - Get Flight Requests
 *
 * Retrieves all flight requests for the authenticated pilot.
 */
export async function GET(_request: NextRequest) {
  try {
    // Get flight requests
    const result = await getCurrentPilotFlightRequests()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch flight requests',
            category: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.category,
            severity: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.severity,
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
    console.error('Get flight requests API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

/**
 * DELETE - Cancel Flight Request
 *
 * Allows pilot to cancel their own pending flight request.
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

    // Cancel flight request
    const result = await cancelPilotFlightRequest(requestId)

    if (!result.success) {
      const statusCode = result.error === ERROR_MESSAGES.AUTH.FORBIDDEN.message ? 403 : 500
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to cancel flight request',
            category: ERROR_MESSAGES.FLIGHT.DELETE_FAILED.category,
            severity: ERROR_MESSAGES.FLIGHT.DELETE_FAILED.severity,
          },
          statusCode
        ),
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Flight request cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel flight request API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
})
