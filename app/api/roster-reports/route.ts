/**
 * Roster Reports API - List all reports
 *
 * GET /api/roster-reports
 * - Returns list of all generated roster reports
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { listRosterReports } from '@/lib/services/roster-report-service'
import { logger } from '@/lib/services/logging-service'

/**
 * GET /api/roster-reports
 *
 * Fetch all roster reports (with optional filtering by roster period)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rosterPeriod = request.nextUrl.searchParams.get('rosterPeriod') ?? undefined

    const result = await listRosterReports(rosterPeriod)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to fetch roster reports' },
        { status: 500 }
      )
    }

    logger.info('Fetched roster reports', {
      userId: auth.userId!,
      count: result.data?.length || 0,
      rosterPeriod,
    })

    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error: any) {
    logger.error('Roster reports API error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
