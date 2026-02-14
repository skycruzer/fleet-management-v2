/**
 * Pilot Portal RDO/SDO Requests API Route
 *
 * Handles pilot self-service RDO/SDO request operations:
 * - POST: Submit new RDO/SDO request
 * - GET: Get all RDO/SDO requests for current pilot
 * - DELETE: Cancel pending RDO/SDO request
 *
 * Developer: Maurice Rondeau
 *
 * SECURITY: Uses service role client to bypass RLS
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.2.0
 * @updated 2025-11-20 - Updated to RDO/SDO only with date ranges
 * @spec 001-missing-core-features (US3)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  submitPilotFlightRequest,
  getCurrentPilotFlightRequests,
  updatePilotFlightRequest,
  cancelPilotFlightRequest,
} from '@/lib/services/pilot-flight-service'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'

/**
 * POST - Submit RDO/SDO Request
 *
 * Allows authenticated pilot to submit a new RDO/SDO request.
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const body = await request.json()

    // Validate request data
    const validation = FlightRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('RDO/SDO request').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('RDO/SDO request').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Submit RDO/SDO request
    const result = await submitPilotFlightRequest(validation.data)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to submit RDO/SDO request',
            category: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.category,
            severity: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    // Revalidate cache for all affected paths
    revalidatePath('/portal/flight-requests')
    revalidatePath('/portal/dashboard')
    revalidatePath('/dashboard/requests')

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'RDO/SDO request submitted successfully',
    })
  } catch (error: unknown) {
    console.error('Submit flight request API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'submitFlightRequest',
      endpoint: '/api/portal/flight-requests',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})

/**
 * GET - Get RDO/SDO Requests
 *
 * Retrieves all RDO/SDO requests for the authenticated pilot.
 */
export async function GET(_request: NextRequest) {
  try {
    // Get RDO/SDO requests
    const result = await getCurrentPilotFlightRequests()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch RDO/SDO requests',
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
  } catch (error: unknown) {
    console.error('Get flight requests API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getFlightRequests',
      endpoint: '/api/portal/flight-requests',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PUT - Update RDO/SDO Request
 *
 * Allows pilot to update their own SUBMITTED RDO/SDO request.
 * Query params: ?id=<request_id>
 */
export const PUT = withRateLimit(async (request: NextRequest) => {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

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
    const validation = FlightRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('RDO/SDO request').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('RDO/SDO request').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Update RDO/SDO request
    const result = await updatePilotFlightRequest(requestId, validation.data)

    if (!result.success) {
      const statusCode = result.error === ERROR_MESSAGES.AUTH.FORBIDDEN.message ? 403 : 500
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to update RDO/SDO request',
            category: ERROR_MESSAGES.FLIGHT.UPDATE_FAILED?.category || 'database',
            severity: ERROR_MESSAGES.FLIGHT.UPDATE_FAILED?.severity || 'error',
          },
          statusCode
        ),
        { status: statusCode }
      )
    }

    // Revalidate cache for all affected paths
    revalidatePath('/portal/flight-requests')
    revalidatePath('/portal/dashboard')
    revalidatePath('/dashboard/requests')

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'RDO/SDO request updated successfully',
    })
  } catch (error: unknown) {
    console.error('Update flight request API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'updateFlightRequest',
      endpoint: '/api/portal/flight-requests',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})

/**
 * DELETE - Cancel RDO/SDO Request
 *
 * Allows pilot to cancel their own pending RDO/SDO request.
 * Query params: ?id=<request_id>
 */
export const DELETE = withRateLimit(async (request: NextRequest) => {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'Invalid request ID format',
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request ID').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('request ID').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Cancel RDO/SDO request
    const result = await cancelPilotFlightRequest(requestId)

    if (!result.success) {
      const statusCode = result.error === ERROR_MESSAGES.AUTH.FORBIDDEN.message ? 403 : 500
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to cancel RDO/SDO request',
            category: ERROR_MESSAGES.FLIGHT.DELETE_FAILED.category,
            severity: ERROR_MESSAGES.FLIGHT.DELETE_FAILED.severity,
          },
          statusCode
        ),
        { status: statusCode }
      )
    }

    // Revalidate cache for all affected paths
    revalidatePath('/portal/flight-requests')
    revalidatePath('/portal/dashboard')
    revalidatePath('/dashboard/requests')

    return NextResponse.json({
      success: true,
      message: 'RDO/SDO request cancelled successfully',
    })
  } catch (error: unknown) {
    console.error('Cancel flight request API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'cancelFlightRequest',
      endpoint: '/api/portal/flight-requests',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
