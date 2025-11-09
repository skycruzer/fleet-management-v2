import { NextResponse } from 'next/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { getPilotCertifications } from '@/lib/services/pilot-certification-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/portal/certifications
 * Fetch all certifications for the authenticated pilot
 * Refactored to use pilot-certification-service
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

    // If pilot doesn't have a linked pilots table record, return empty certifications
    if (!pilot.pilot_id) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No pilot record linked - certifications not available',
      })
    }

    // Use service layer to fetch certifications
    const certifications = await getPilotCertifications(pilot.pilot_id)

    return NextResponse.json({
      success: true,
      data: certifications,
    })
  } catch (error: any) {
    console.error('Certifications API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getPilotCertifications',
      endpoint: '/api/portal/certifications'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
