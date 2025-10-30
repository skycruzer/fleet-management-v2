/**
 * Retirement Timeline API Route
 * Returns monthly retirement timeline data
 *
 * @route GET /api/retirement/timeline
 */

import { getMonthlyRetirementTimeline } from '@/lib/services/retirement-forecast-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const retirementAge = parseInt(searchParams.get('retirementAge') || '65')

    const timeline = await getMonthlyRetirementTimeline(retirementAge)

    return NextResponse.json(timeline)
  } catch (error) {
    console.error('Error fetching retirement timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retirement timeline' },
      { status: 500 }
    )
  }
}
