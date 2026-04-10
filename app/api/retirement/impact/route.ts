/**
 * Crew Impact Analysis API Route
 * Returns crew impact data with warnings
 *
 * @route GET /api/retirement/impact
 */

import { getCrewImpactAnalysis } from '@/lib/services/retirement-forecast-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
