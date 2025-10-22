import { NextRequest, NextResponse } from 'next/server'
import { cancelPilotFlightRequest } from '@/lib/services/pilot-flight-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * DELETE /api/pilot/flight-requests/[id]
 *
 * Cancel a pending flight request.
 * Only allows canceling PENDING requests owned by the authenticated pilot.
 *
 * @spec 001-missing-core-features (US3, T057)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.FLIGHT.DELETE_FAILED.message },
      { status: 500 }
    )
  }
}
