import { NextResponse } from 'next/server'
import { getPilotCertifications } from '@/lib/services/pilot-certification-service'
import { createPilotRoute } from '@/lib/middleware/create-api-route'

/**
 * GET /api/portal/certifications
 * Fetch all certifications for the authenticated pilot
 * Refactored to use pilot-certification-service
 *
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */
export const GET = createPilotRoute(
  {
    operation: 'getPilotCertifications',
    endpoint: '/api/portal/certifications',
    rateLimit: false,
  },
  async ({ pilot }) => {
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
  }
)
