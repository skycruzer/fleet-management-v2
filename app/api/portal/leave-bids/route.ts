/**
 * Pilot Portal Leave Bids API Route
 *
 * Handles pilot self-service annual leave bid operations:
 * - POST: Submit/update annual leave bid with preferred options
 * - GET: Get all leave bids for current pilot
 * - PUT: Update an existing leave bid
 * - DELETE: Cancel a pending leave bid
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST, PUT methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 * AUTH: Explicit pilot authentication check at API layer
 *
 * @version 2.2.0
 * @updated 2026-01 - Added explicit auth guards and standardized responses
 * @architecture Service Layer Pattern
 * @auth Pilot Portal Authentication (via an_users table)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  submitLeaveBid,
  getCurrentPilotLeaveBids,
  cancelLeaveBid,
  updateLeaveBid,
  type LeaveBidInput,
} from '@/lib/services/leave-bid-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { z } from 'zod'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { unauthorizedResponse } from '@/lib/utils/api-response-helper'

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
 *
 * @auth Pilot Portal Authentication required (explicit check)
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Explicit authentication check at API layer
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return unauthorizedResponse('Pilot authentication required')
    }

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
 *
 * @auth Pilot Portal Authentication required (explicit check)
 */
export async function GET(_request: NextRequest) {
  try {
    // SECURITY: Explicit authentication check at API layer
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return unauthorizedResponse('Pilot authentication required')
    }

    // Get leave bids via service layer
    const result = await getCurrentPilotLeaveBids()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch leave bids',
          errorCode: result.error?.includes('Unauthorized') ? 'UNAUTHORIZED' : 'FETCH_FAILED',
        },
        { status: result.error?.includes('Unauthorized') ? 401 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    })
  } catch (error: unknown) {
    console.error('Get leave bids API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getLeaveBids',
      endpoint: '/api/portal/leave-bids',
    })
    return NextResponse.json(
      { success: false, error: sanitized.error, errorId: sanitized.errorId },
      { status: sanitized.statusCode || 500 }
    )
  }
}

/**
 * PUT - Update Leave Bid
 *
 * Allows pilot to update a pending leave bid.
 * Only PENDING bids can be edited.
 *
 * @auth Pilot Portal Authentication required (explicit check)
 */
export const PUT = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Explicit authentication check at API layer
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return unauthorizedResponse('Pilot authentication required')
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Get bid ID from query parameter
    const { searchParams } = new URL(request.url)
    const bidId = searchParams.get('id')

    if (!bidId) {
      return NextResponse.json(
        formatApiError(
          {
            message: 'Bid ID is required',
            category: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('id').category,
            severity: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('id').severity,
          },
          400
        ),
        { status: 400 }
      )
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
    const primaryOption = options[0]
    const roster_period_code = primaryOption.roster_periods?.[0] || `RP1/${bid_year}`

    const bidData: Partial<LeaveBidInput> = {
      roster_period_code,
      preferred_dates: JSON.stringify(options),
      priority: 'MEDIUM',
      reason: `Leave bid for ${bid_year} with ${options.length} preferred option(s)`,
    }

    // Update leave bid via service layer
    const result = await updateLeaveBid(bidId, bidData)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to update leave bid',
            category: ERROR_MESSAGES.LEAVE.UPDATE_FAILED?.category || 'LEAVE_ERROR',
            severity: ERROR_MESSAGES.LEAVE.UPDATE_FAILED?.severity || 'error',
          },
          result.error?.includes('Unauthorized')
            ? 401
            : result.error?.includes('pending')
              ? 400
              : 500
        ),
        {
          status: result.error?.includes('Unauthorized')
            ? 401
            : result.error?.includes('pending')
              ? 400
              : 500,
        }
      )
    }

    // Revalidate cache for all affected paths
    revalidatePath('/portal/leave-bids')
    revalidatePath('/portal/leave-requests')
    revalidatePath('/dashboard/leave')

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave bid updated successfully',
    })
  } catch (error: any) {
    console.error('Update leave bid API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'updateLeaveBid',
      endpoint: '/api/portal/leave-bids',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})

/**
 * DELETE - Cancel Leave Bid
 *
 * Allows pilot to cancel a pending leave bid.
 *
 * @auth Pilot Portal Authentication required (explicit check)
 */
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Explicit authentication check at API layer
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return unauthorizedResponse('Pilot authentication required')
    }

    const body = await request.json()

    // Validate bid ID
    if (!body.bidId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bid ID is required',
          errorCode: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Cancel leave bid via service layer
    const result = await cancelLeaveBid(body.bidId)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to cancel leave bid',
          errorCode: result.error?.includes('Unauthorized') ? 'UNAUTHORIZED' : 'DELETE_FAILED',
        },
        { status: result.error?.includes('Unauthorized') ? 401 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Leave bid cancelled successfully',
    })
  } catch (error: unknown) {
    console.error('Cancel leave bid API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'cancelLeaveBid',
      endpoint: '/api/portal/leave-bids',
    })
    return NextResponse.json(
      { success: false, error: sanitized.error, errorId: sanitized.errorId },
      { status: sanitized.statusCode || 500 }
    )
  }
}
