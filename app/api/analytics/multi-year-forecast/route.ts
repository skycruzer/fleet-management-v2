/**
 * Multi-Year Retirement Forecast API Route
 * Returns 10-year retirement forecast data
 *
 * @route GET /api/analytics/multi-year-forecast
 * @query retirementAge - Retirement age (default: 65)
 * @query yearsAhead - Years to forecast (default: 10)
 */

import { getMultiYearRetirementForecast } from '@/lib/services/analytics-service'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'

export async function GET(request: NextRequest) {
  try {
    // Authentication check - admin only
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const retirementAge = parseInt(searchParams.get('retirementAge') || '65')
    const yearsAhead = parseInt(searchParams.get('yearsAhead') || '10')

    const forecast = await getMultiYearRetirementForecast(retirementAge, yearsAhead)

    return NextResponse.json(forecast)
  } catch (error) {
    console.error('Error fetching multi-year retirement forecast:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getMultiYearForecast',
      endpoint: '/api/analytics/multi-year-forecast',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
