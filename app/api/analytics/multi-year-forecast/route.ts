/**
 * Multi-Year Retirement Forecast API Route
 * Returns 10-year retirement forecast data
 *
 * @route GET /api/analytics/multi-year-forecast
 * @query retirementAge - Retirement age (default: 65)
 * @query yearsAhead - Years to forecast (default: 10)
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { getMultiYearRetirementForecast } from '@/lib/services/analytics-service'
import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'

export const GET = createAdminRoute(
  {
    operation: 'getMultiYearForecast',
    endpoint: '/api/analytics/multi-year-forecast',
    rateLimit: false,
  },
  async ({ request }) => {
    const { searchParams } = new URL(request.url)
    const retirementAge = Math.min(
      75,
      Math.max(50, parseInt(searchParams.get('retirementAge') || '65') || 65)
    )
    const yearsAhead = Math.min(
      30,
      Math.max(1, parseInt(searchParams.get('yearsAhead') || '10') || 10)
    )

    const forecast = await getMultiYearRetirementForecast(retirementAge, yearsAhead)

    return NextResponse.json(forecast)
  }
)
