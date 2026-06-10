/**
 * Crew Shortage Predictions API Route
 * Returns crew shortage predictions with recommendations
 *
 * @route GET /api/analytics/crew-shortage-predictions
 * @query retirementAge - Retirement age (default: 65)
 * @query minimumCaptains - Minimum captains required (default: 10)
 * @query minimumFirstOfficers - Minimum first officers required (default: 10)
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { predictCrewShortages } from '@/lib/services/analytics-service'
import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'

export const GET = createAdminRoute(
  {
    operation: 'predictCrewShortages',
    endpoint: '/api/analytics/crew-shortage-predictions',
    rateLimit: false,
  },
  async ({ request }) => {
    const { searchParams } = new URL(request.url)
    const retirementAge = Math.min(
      75,
      Math.max(50, parseInt(searchParams.get('retirementAge') || '65') || 65)
    )
    const minimumCaptains = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('minimumCaptains') || '10') || 10)
    )
    const minimumFirstOfficers = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('minimumFirstOfficers') || '10') || 10)
    )

    const predictions = await predictCrewShortages(
      retirementAge,
      minimumCaptains,
      minimumFirstOfficers
    )

    return NextResponse.json(predictions)
  }
)
