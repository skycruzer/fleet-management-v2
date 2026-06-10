/**
 * Roster Reports API - List all reports
 *
 * GET /api/roster-reports
 * - Returns list of all generated roster reports
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { listRosterReports } from '@/lib/services/roster-report-service'
import { logger } from '@/lib/services/logging-service'

/**
 * GET /api/roster-reports
 *
 * Fetch all roster reports (with optional filtering by roster period)
 */
export const GET = createAdminRoute(
  {
    operation: 'listRosterReports',
    endpoint: '/api/roster-reports',
    rateLimit: false,
  },
  async ({ request, admin }) => {
    try {
      const rosterPeriod = request.nextUrl.searchParams.get('rosterPeriod') ?? undefined

      const result = await listRosterReports(rosterPeriod)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error ?? 'Failed to fetch roster reports' },
          { status: 500 }
        )
      }

      logger.info('Fetched roster reports', {
        userId: admin.userId,
        count: result.data?.length || 0,
        rosterPeriod,
      })

      return NextResponse.json({ success: true, data: result.data || [] })
    } catch (error: any) {
      logger.error('Roster reports API error', { error })
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)
