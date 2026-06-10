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
 * Security pipeline (CSRF, auth, rate limiting) via createPilotRoute.
 * GET is intentionally not rate limited — shared office IPs would pool
 * into one bucket (see lib/rate-limit.ts prefix note).
 *
 * @version 2.2.0
 * @updated 2025-11-20 - Updated to RDO/SDO only with date ranges
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 * @spec 001-missing-core-features (US3)
 */

import { NextResponse } from 'next/server'
import {
  submitPilotFlightRequest,
  getCurrentPilotFlightRequests,
  updatePilotFlightRequest,
  cancelPilotFlightRequest,
} from '@/lib/services/pilot-flight-service'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { createPilotRoute } from '@/lib/middleware/create-api-route'
import { statusFromErrorCode } from '@/lib/utils/api-response-helper'
import { invalidateRequestCaches } from '@/lib/services/cache-invalidation-helper'

/**
 * POST - Submit RDO/SDO Request
 *
 * Allows authenticated pilot to submit a new RDO/SDO request.
 */
export const POST = createPilotRoute(
  {
    operation: 'submitFlightRequest',
    endpoint: '/api/portal/flight-requests',
  },
  async ({ request }) => {
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
      const status = statusFromErrorCode((result as { errorCode?: string }).errorCode, 500)
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to submit RDO/SDO request',
            category: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.category,
            severity: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.severity,
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
      message: 'RDO/SDO request submitted successfully',
    })
  }
)

/**
 * GET - Get RDO/SDO Requests
 *
 * Retrieves all RDO/SDO requests for the authenticated pilot.
 */
export const GET = createPilotRoute(
  {
    operation: 'getFlightRequests',
    endpoint: '/api/portal/flight-requests',
    rateLimit: false,
  },
  async () => {
    // Get RDO/SDO requests
    const result = await getCurrentPilotFlightRequests()

    if (!result.success) {
      const status = statusFromErrorCode((result as { errorCode?: string }).errorCode, 500)
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch RDO/SDO requests',
            category: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.category,
            severity: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.severity,
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
 * PUT - Update RDO/SDO Request
 *
 * Allows pilot to update their own SUBMITTED RDO/SDO request.
 * Query params: ?id=<request_id>
 */
export const PUT = createPilotRoute(
  {
    operation: 'updateFlightRequest',
    endpoint: '/api/portal/flight-requests',
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
    await invalidateRequestCaches().catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'RDO/SDO request updated successfully',
    })
  }
)

/**
 * DELETE - Cancel RDO/SDO Request
 *
 * Allows pilot to cancel their own pending RDO/SDO request.
 * Query params: ?id=<request_id>
 */
export const DELETE = createPilotRoute(
  {
    operation: 'cancelFlightRequest',
    endpoint: '/api/portal/flight-requests',
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
    await invalidateRequestCaches().catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({
      success: true,
      message: 'RDO/SDO request cancelled successfully',
    })
  }
)
