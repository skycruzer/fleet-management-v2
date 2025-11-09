import { NextResponse } from 'next/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { getCertificationsByPilotId } from '@/lib/services/certification-service'
import { logInfo } from '@/lib/error-logger'

/**
 * GET /api/portal/certifications
 * Fetch all certifications for the authenticated pilot
 *
 * @version 2.0.0 - Refactored to use service layer
 */
export async function GET() {
  try {
    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - pilot not found',
        },
        { status: 401 }
      )
    }

    const pilotUser = pilot

    // If pilot doesn't have a linked pilots table record, return empty certifications
    if (!pilotUser.pilot_id) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No pilot record linked - certifications not available',
      })
    }

    // Fetch pilot certifications using service layer
    const certifications = await getCertificationsByPilotId(pilotUser.pilot_id)

    logInfo('Pilot certifications fetched', {
      source: 'PortalCertificationsAPI',
      metadata: { pilotId: pilotUser.pilot_id, count: certifications.length },
    })

    return NextResponse.json({
      success: true,
      data: certifications || [],
    })
  } catch (error: any) {
    const sanitized = sanitizeError(error, {
      operation: 'getPilotCertifications',
      endpoint: '/api/portal/certifications'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
