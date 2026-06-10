import { NextResponse } from 'next/server'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'
import {
  submitPilotFlightRequest,
  getCurrentPilotFlightRequests,
} from '@/lib/services/pilot-flight-service'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { createPilotRoute } from '@/lib/middleware/create-api-route'

/**
 * GET /api/pilot/flight-requests
 *
 * Fetch all flight requests for the authenticated pilot.
 * Returns list of flight requests sorted by created_at descending.
 *
 * @spec 001-missing-core-features (US3, T057)
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */
export const GET = createPilotRoute(
  {
    operation: 'getCurrentPilotFlightRequests',
    endpoint: '/api/pilot/flight-requests',
    rateLimit: false,
  },
  async () => {
    const result = await getCurrentPilotFlightRequests()

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  }
)

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
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */
export const POST = createPilotRoute(
  {
    operation: 'submitPilotFlightRequest',
    endpoint: '/api/pilot/flight-requests',
    rateLimit: { limiter: mutationRateLimit, by: 'ip' },
  },
  async ({ request }) => {
    const body = await request.json()

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
  }
)
