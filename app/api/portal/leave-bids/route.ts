/**
 * Pilot Portal Leave Bids API Route
 *
 * Handles pilot self-service annual leave bid operations:
 * - POST: Submit/update annual leave bid with preferred options
 * - GET: Get all leave bids for current pilot
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 * @architecture Service Layer Pattern
 * @auth Pilot Portal Authentication (via an_users table)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  submitLeaveBid,
  getCurrentPilotLeaveBids,
  type LeaveBidInput,
} from '@/lib/services/leave-bid-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { z } from 'zod'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'

/**
 * Validation Schema for Leave Bid Submission
 *
 * IMPORTANT: Database schema uses:
 * - roster_period_code (string): e.g., "RP13/2025"
 * - preferred_dates (string): JSON string of date ranges
 * - alternative_dates (string | null): JSON string of alternative date ranges
 * - priority (string): e.g., "HIGH", "MEDIUM", "LOW"
 * - reason (string): justification for leave bid
 */
const LeaveBidSchema = z.object({
  roster_period_code: z.string().regex(/^RP(1[0-3]|[1-9])\/\d{4}$/, 'Invalid roster period format (expected RP1/2025 through RP13/2025)'),
  preferred_dates: z.string().min(1, 'Preferred dates are required'),
  alternative_dates: z.string().optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
})

/**
 * POST - Submit/Update Leave Bid
 *
 * Allows authenticated pilot to submit or update their annual leave bid.
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
    const validation = LeaveBidSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('leave bid').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('leave bid').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    const bidData: LeaveBidInput = validation.data

    // Submit leave bid via service layer
    const result = await submitLeaveBid(bidData)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to submit leave bid',
            category: ERROR_MESSAGES.LEAVE.CREATE_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.CREATE_FAILED.severity,
          },
          result.error?.includes('Unauthorized') ? 401 : 500
        ),
        { status: result.error?.includes('Unauthorized') ? 401 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave bid submitted successfully',
    })
  } catch (error) {
    console.error('Submit leave bid API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
})

/**
 * GET - Get Leave Bids
 *
 * Retrieves all leave bids for the authenticated pilot.
 */
export async function GET(request: NextRequest) {
  try {
    // Get leave bids via service layer
    const result = await getCurrentPilotLeaveBids()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch leave bids',
            category: ERROR_MESSAGES.LEAVE.FETCH_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.FETCH_FAILED.severity,
          },
          result.error?.includes('Unauthorized') ? 401 : 500
        ),
        { status: result.error?.includes('Unauthorized') ? 401 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    })
  } catch (error) {
    console.error('Get leave bids API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
