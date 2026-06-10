/**
 * Flight Request Admin API
 * Handles individual flight request operations for admins
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PATCH method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 3.0.0
 * @updated 2026-06-10 - SECURITY: PATCH migrated to createAdminRoute, adding the
 *          route-level admin auth gate it was missing (previously service-layer only)
 */

import { NextResponse } from 'next/server'
import { getFlightRequestById, reviewFlightRequest } from '@/lib/services/flight-request-service'
import { FlightRequestReviewSchema } from '@/lib/validations/flight-request-schema'
import { createAdminRoute } from '@/lib/middleware/create-api-route'

/**
 * GET /api/dashboard/flight-requests/[id]
 *
 * Fetch a single flight request by ID for admin review.
 *
 * @spec 001-missing-core-features (US3, T059)
 */
export const GET = createAdminRoute(
  {
    operation: 'getFlightRequestById',
    endpoint: '/api/dashboard/flight-requests/[id]',
    rateLimit: false,
  },
  async ({ params }) => {
    const { id: requestId } = params

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
  }
)

/**
 * PATCH /api/dashboard/flight-requests/[id]
 *
 * Review (approve/deny) a flight request.
 * Creates audit log and sends notification to pilot.
 *
 * Request body:
 * {
 *   status: "IN_REVIEW" | "APPROVED" | "DENIED",
 *   admin_comments?: string (required for DENIED)
 * }
 *
 * @spec 001-missing-core-features (US3, T059)
 */
export const PATCH = createAdminRoute(
  {
    operation: 'reviewFlightRequest',
    endpoint: '/api/dashboard/flight-requests/[id]',
  },
  async ({ request, params }) => {
    const requestId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

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
  }
)
