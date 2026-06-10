/**
 * Retirement Timeline API Route
 * Returns monthly retirement timeline data
 *
 * @route GET /api/retirement/timeline
 * @version 2.0.0
 * @updated 2026-06-10 - SECURITY: added admin authentication (was unauthenticated)
 */

import { getMonthlyRetirementTimeline } from '@/lib/services/retirement-forecast-service'
import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'

export const GET = createAdminRoute(
  {
    operation: 'getRetirementTimeline',
    endpoint: '/api/retirement/timeline',
    rateLimit: false,
  },
  async ({ request }) => {
    try {
      const { searchParams } = new URL(request.url)
      const retirementAge = parseInt(searchParams.get('retirementAge') || '65')

      const timeline = await getMonthlyRetirementTimeline(retirementAge)

      return NextResponse.json(timeline)
    } catch (error) {
      console.error('Error fetching retirement timeline:', error)
      return NextResponse.json({ error: 'Failed to fetch retirement timeline' }, { status: 500 })
    }
  }
)
