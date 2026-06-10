/**
 * Retirement Forecast API Route
 * Returns retirement forecast data by rank
 *
 * @route GET /api/retirement/forecast
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { getRetirementForecastByRank } from '@/lib/services/retirement-forecast-service'
import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'

export const GET = createAdminRoute(
  {
    operation: 'getRetirementForecast',
    endpoint: '/api/retirement/forecast',
    rateLimit: false,
  },
  async ({ request }) => {
    try {
      const { searchParams } = new URL(request.url)
      const retirementAge = parseInt(searchParams.get('retirementAge') || '65')

      const forecast = await getRetirementForecastByRank(retirementAge)

      return NextResponse.json(forecast)
    } catch (error) {
      console.error('Error fetching retirement forecast:', error)
      return NextResponse.json({ error: 'Failed to fetch retirement forecast' }, { status: 500 })
    }
  }
)
