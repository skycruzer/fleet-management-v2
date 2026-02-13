/**
 * Retirement Forecast API Route
 * Returns retirement forecast data by rank
 *
 * @route GET /api/retirement/forecast
 */

import { getRetirementForecastByRank } from '@/lib/services/retirement-forecast-service'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const retirementAge = parseInt(searchParams.get('retirementAge') || '65')

    const forecast = await getRetirementForecastByRank(retirementAge)

    return NextResponse.json(forecast)
  } catch (error) {
    console.error('Error fetching retirement forecast:', error)
    return NextResponse.json({ error: 'Failed to fetch retirement forecast' }, { status: 500 })
  }
}
