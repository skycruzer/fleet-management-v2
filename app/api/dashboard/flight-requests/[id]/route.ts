/**
 * Flight Request Admin API
 * Handles individual flight request operations for admins
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PATCH method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFlightRequestById, reviewFlightRequest } from '@/lib/services/flight-request-service'
import { FlightRequestReviewSchema } from '@/lib/validations/flight-request-schema'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/dashboard/flight-requests/[id]
 *
 * Fetch a single flight request by ID for admin review.
 *
 * @spec 001-missing-core-features (US3, T059)
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params

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
  } catch (error) {
    console.error('Admin flight-requests GET [id] error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getFlightRequestById',
      requestId: (await params).id,
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PATCH /api/dashboard/flight-requests/[id]
 *
 * Review (approve/deny) a flight request.
 * Creates audit log and sends notification to pilot.
 *
 * Request body:
 * {
 *   status: "UNDER_REVIEW" | "APPROVED" | "DENIED",
 *   admin_comments?: string (required for DENIED)
 * }
 *
 * @spec 001-missing-core-features (US3, T059)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const { id: requestId } = await params

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
  } catch (error) {
    console.error('Admin flight-requests PATCH [id] error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'reviewFlightRequest',
      requestId: (await params).id,
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
