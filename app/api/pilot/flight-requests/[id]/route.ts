import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { verifyPilotSession } from '@/lib/services/pilot-portal-service'
import { cancelPilotFlightRequest } from '@/lib/services/pilot-flight-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * DELETE /api/pilot/flight-requests/[id]
 *
 * Cancel a pending flight request.
 * Only allows canceling PENDING requests owned by the authenticated pilot.
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 * @spec 001-missing-core-features (US3, T057)
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(_request)
    if (csrfError) return csrfError

    // SECURITY: Verify pilot session (pilot portal uses custom auth)
    const pilotId = await verifyPilotSession(_request)
    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(pilotId)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const requestId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    // Cancel request
    const result = await cancelPilotFlightRequest(requestId)

    if (!result.success) {
      // Determine appropriate status code
      let statusCode = 500
      if (result.error?.includes('Unauthorized')) statusCode = 401
      else if (result.error?.includes('Forbidden')) statusCode = 403
      else if (result.error?.includes('not found')) statusCode = 404
      else if (result.error?.includes('only cancel pending')) statusCode = 400

      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    return NextResponse.json(
      { success: true, message: 'Flight request cancelled successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Pilot flight-requests DELETE error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'cancelPilotFlightRequest',
      requestId: params.id,
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
