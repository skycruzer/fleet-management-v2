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
  cancelLeaveBid,
  type LeaveBidInput,
} from '@/lib/services/leave-bid-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { z } from 'zod'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'

/**
 * Validation Schema for Leave Bid Submission
 *
 * Accepts form structure with bid_year and array of options.
 * Each option includes priority (number), start_date, end_date, and roster_periods.
 */
const LeaveBidOptionSchema = z.object({
  priority: z.number().int().min(1).max(10),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  roster_periods: z.array(z.string()).optional(),
})

const LeaveBidFormSchema = z.object({
  bid_year: z.number().int().min(2025).max(2030),
  options: z.array(LeaveBidOptionSchema).min(1, 'At least one leave option is required'),
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

    // Validate request data using form schema
    const validation = LeaveBidFormSchema.safeParse(body)

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

    const { bid_year, options } = validation.data

    // Transform form data to service layer format
    // For now, use the first option's roster period as the main one
    // and serialize all options as JSON for preferred_dates
    const primaryOption = options[0]
    const roster_period_code = primaryOption.roster_periods?.[0] || `RP1/${bid_year}`

    const bidData: LeaveBidInput = {
      roster_period_code,
      preferred_dates: JSON.stringify(options), // Store all options as JSON
      alternative_dates: null,
      priority: 'MEDIUM', // Default priority
      reason: `Leave bid for ${bid_year} with ${options.length} preferred option(s)`,
      notes: null,
    }

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

    // Revalidate cache for all affected paths
    revalidatePath('/portal/leave-bids')
    revalidatePath('/portal/leave-requests')
    revalidatePath('/dashboard/leave')

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave bid submitted successfully',
    })
  } catch (error: any) {
    console.error('Submit leave bid API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'submitLeaveBid',
      endpoint: '/api/portal/leave-bids',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
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
  } catch (error: any) {
    console.error('Get leave bids API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getLeaveBids',
      endpoint: '/api/portal/leave-bids',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE - Cancel Leave Bid
 *
 * Allows pilot to cancel a pending leave bid.
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate bid ID
    if (!body.bidId) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'Bid ID is required',
            category: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('bidId').category,
            severity: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('bidId').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Cancel leave bid via service layer
    const result = await cancelLeaveBid(body.bidId)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to cancel leave bid',
            category: ERROR_MESSAGES.LEAVE.DELETE_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.DELETE_FAILED.severity,
          },
          result.error?.includes('Unauthorized') ? 401 : 500
        ),
        { status: result.error?.includes('Unauthorized') ? 401 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Leave bid cancelled successfully',
    })
  } catch (error: any) {
    console.error('Cancel leave bid API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'cancelLeaveBid',
      endpoint: '/api/portal/leave-bids',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
