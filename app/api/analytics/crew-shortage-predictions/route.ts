/**
 * Crew Shortage Predictions API Route
 * Returns crew shortage predictions with recommendations
 *
 * @route GET /api/analytics/crew-shortage-predictions
 * @query retirementAge - Retirement age (default: 65)
 * @query minimumCaptains - Minimum captains required (default: 10)
 * @query minimumFirstOfficers - Minimum first officers required (default: 10)
 */

import { predictCrewShortages } from '@/lib/services/analytics-service'
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
  } catch (error) {
    console.error('Error fetching crew shortage predictions:', error)
    const sanitized = sanitizeError(error, {
      operation: 'predictCrewShortages',
      endpoint: '/api/analytics/crew-shortage-predictions',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
