import { NextResponse } from 'next/server'
import { PilotLeaveRequestSchema } from '@/lib/validations/pilot-leave-schema'
import {
  submitPilotLeaveRequest,
  getCurrentPilotLeaveRequests,
} from '@/lib/services/pilot-leave-service'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { createPilotRoute } from '@/lib/middleware/create-api-route'

/**
 * GET /api/pilot/leave
 *
 * Fetch all leave requests for the authenticated pilot.
 * Returns list of leave requests sorted by request_date descending.
 *
 * @spec 001-missing-core-features (US2, T047)
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */
export const GET = createPilotRoute(
  {
    operation: 'getCurrentPilotLeaveRequests',
    endpoint: '/api/pilot/leave',
    rateLimit: false,
  },
  async () => {
    const result = await getCurrentPilotLeaveRequests()

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  }
)

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
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */
export const POST = createPilotRoute(
  {
    operation: 'submitPilotLeaveRequest',
    endpoint: '/api/pilot/leave',
    rateLimit: { limiter: mutationRateLimit, by: 'ip' },
  },
  async ({ request }) => {
    const body = await request.json()

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
  }
)
