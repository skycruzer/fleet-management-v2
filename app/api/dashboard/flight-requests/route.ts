import { NextRequest, NextResponse } from 'next/server'
import { getAllFlightRequests, getFlightRequestStats } from '@/lib/services/flight-request-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/dashboard/flight-requests
 *
 * Fetch all flight requests for admin review.
 * Supports query parameters for filtering:
 * - status: PENDING | UNDER_REVIEW | APPROVED | DENIED
 * - pilot_id: UUID
 * - start_date_from: YYYY-MM-DD
 * - start_date_to: YYYY-MM-DD
 * - stats: Include statistics (stats=true)
 *
 * @spec 001-missing-core-features (US3, T058)
 */
export async function GET(_request: NextRequest) {
  try {
    const searchParams = _request.nextUrl.searchParams
    const includeStats = searchParams.get('stats') === 'true'

    // Get statistics if requested
    if (includeStats) {
      const statsResult = await getFlightRequestStats()
      if (!statsResult.success) {
        const statusCode = statsResult.error?.includes('Unauthorized') ? 401 : 500
        return NextResponse.json(
          { success: false, error: statsResult.error },
          { status: statusCode }
        )
      }
      return NextResponse.json({ success: true, data: statsResult.data }, { status: 200 })
    }

    // Build filters from query params
    const filters: {
      status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'
      pilot_id?: string
      start_date_from?: string
      start_date_to?: string
    } = {}

    const status = searchParams.get('status')
    if (status && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'DENIED'].includes(status)) {
      filters.status = status as 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'
    }

    const pilotId = searchParams.get('pilot_id')
    if (pilotId) {
      filters.pilot_id = pilotId
    }

    const startDateFrom = searchParams.get('start_date_from')
    if (startDateFrom) {
      filters.start_date_from = startDateFrom
    }

    const startDateTo = searchParams.get('start_date_to')
    if (startDateTo) {
      filters.start_date_to = startDateTo
    }

    // Fetch flight requests
    const result = await getAllFlightRequests(filters)

    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 401 : 500
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json(
      { success: true, data: result.data, count: result.data?.length || 0 },
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin flight-requests GET error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getAllFlightRequests',
      endpoint: '/api/dashboard/flight-requests'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
