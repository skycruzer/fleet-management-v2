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
 * Security pipeline (CSRF, auth, rate limiting) via createPilotRoute.
 * GET is intentionally not rate limited — shared office IPs would pool
 * into one bucket (see lib/rate-limit.ts prefix note).
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 * @architecture Service Layer Pattern
 * @auth Pilot Portal Authentication (via an_users table)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  submitLeaveBid,
  getCurrentPilotLeaveBids,
  cancelLeaveBid,
  updateLeaveBid,
  type LeaveBidInput,
} from '@/lib/services/leave-bid-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { createPilotRoute } from '@/lib/middleware/create-api-route'
import { invalidateLeaveBidCaches } from '@/lib/services/cache-invalidation-helper'
import { createNotification } from '@/lib/services/notification-service'
import { sendLeaveBidSubmittedEmail } from '@/lib/services/pilot-email-notification-service'

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

const CancelLeaveBidSchema = z.object({
  bidId: z.string().min(1, 'Bid ID is required'),
})

/**
 * POST - Submit/Update Leave Bid
 *
 * Allows authenticated pilot to submit or update their annual leave bid.
 */
export const POST = createPilotRoute(
  {
    operation: 'submitLeaveBid',
    endpoint: '/api/portal/leave-bids',
    schema: LeaveBidFormSchema,
    invalidateCache: invalidateLeaveBidCaches,
  },
  async ({ body, pilot }) => {
    const { bid_year, options } = body

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
      const status = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to submit leave bid',
            category: ERROR_MESSAGES.LEAVE.CREATE_FAILED.category,
            severity: ERROR_MESSAGES.LEAVE.CREATE_FAILED.severity,
          },
          status
        ),
        { status }
      )
    }

    // Send confirmation notification to pilot (bell + email)
    if (pilot.pilot_id) {
      createNotification({
        userId: pilot.pilot_id,
        title: 'Leave Bid Submitted',
        message: `Your leave bid for ${bid_year} has been submitted and is pending review.`,
        type: 'leave_bid_submitted',
        link: '/portal/leave-bids',
      }).catch((err) => console.error('Failed to create bid submission notification:', err))
    }

    // Send email confirmation to pilot
    sendLeaveBidSubmittedEmail(
      {
        email: pilot.email,
        firstName: pilot.first_name,
        lastName: pilot.last_name,
        rank: pilot.rank as 'Captain' | 'First Officer',
        employeeNumber: pilot.employee_id || '',
      },
      {
        bidYear: bid_year,
        optionCount: options.length,
        preferences: options.map((opt) => ({
          priority: opt.priority,
          startDate: opt.start_date,
          endDate: opt.end_date,
        })),
      }
    ).catch((err) => console.error('Failed to send bid submission email:', err))

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave bid submitted successfully',
    })
  }
)

/**
 * GET - Get Leave Bids
 *
 * Retrieves all leave bids for the authenticated pilot.
 */
export const GET = createPilotRoute(
  {
    operation: 'getLeaveBids',
    endpoint: '/api/portal/leave-bids',
    rateLimit: false,
  },
  async () => {
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
  }
)

/**
 * PUT - Update Leave Bid
 *
 * Allows pilot to update a pending leave bid.
 * Only PENDING bids can be edited. Bid ID comes from the `id` query parameter.
 */
export const PUT = createPilotRoute(
  {
    operation: 'updateLeaveBid',
    endpoint: '/api/portal/leave-bids',
    schema: LeaveBidFormSchema,
    invalidateCache: invalidateLeaveBidCaches,
  },
  async ({ request, body }) => {
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

    const { bid_year, options } = body

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
      const status = result.error?.includes('Unauthorized')
        ? 401
        : result.error?.includes('pending')
          ? 400
          : 500
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to update leave bid',
            category: ERROR_MESSAGES.LEAVE.UPDATE_FAILED?.category || 'LEAVE_ERROR',
            severity: ERROR_MESSAGES.LEAVE.UPDATE_FAILED?.severity || 'error',
          },
          status
        ),
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Leave bid updated successfully',
    })
  }
)

/**
 * DELETE - Cancel Leave Bid
 *
 * Allows pilot to cancel a pending leave bid.
 */
export const DELETE = createPilotRoute(
  {
    operation: 'cancelLeaveBid',
    endpoint: '/api/portal/leave-bids',
    schema: CancelLeaveBidSchema,
    invalidateCache: invalidateLeaveBidCaches,
  },
  async ({ body }) => {
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
  }
)
