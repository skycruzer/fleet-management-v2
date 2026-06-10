/**
 * Crew Impact Analysis API Route
 * Returns crew impact data with warnings
 *
 * @route GET /api/retirement/impact
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { getCrewImpactAnalysis } from '@/lib/services/retirement-forecast-service'
import { NextResponse } from 'next/server'

export const GET = createAdminRoute(
  {
    operation: 'getCrewImpactAnalysis',
    endpoint: '/api/retirement/impact',
    rateLimit: false,
  },
  async ({ request }) => {
    try {
      const { searchParams } = new URL(request.url)
      const retirementAge = parseInt(searchParams.get('retirementAge') || '65')

      const impact = await getCrewImpactAnalysis(retirementAge, 10, 10)

      return NextResponse.json(impact)
    } catch (error) {
      console.error('Error fetching crew impact analysis:', error)
      return NextResponse.json({ error: 'Failed to fetch crew impact analysis' }, { status: 500 })
    }
  }
)
