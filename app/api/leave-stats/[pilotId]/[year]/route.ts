/**
 * Leave Statistics API
 * GET /api/leave-stats/:pilotId/:year
 *
 * Returns approved days and priority ranking for a pilot
 *
 * @version 1.0.0
 * @since 2025-10-26
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import {
  getPilotLeaveStats,
  getPriorityRanking,
  getPriorityExplanation,
} from '@/lib/services/leave-stats-service'

export const dynamic = 'force-dynamic'

export const GET = createAdminRoute(
  {
    operation: 'getLeaveStats',
    endpoint: '/api/leave-stats/[pilotId]/[year]',
    rateLimit: false,
  },
  async ({ params }) => {
    try {
      const { pilotId, year } = params
      const yearNumber = parseInt(year, 10)

      if (isNaN(yearNumber)) {
        return NextResponse.json(
          { success: false, error: 'Invalid year parameter' },
          { status: 400 }
        )
      }

      // Get pilot's leave statistics
      const stats = await getPilotLeaveStats(pilotId, yearNumber)

      if (!stats) {
        return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 })
      }

      // Get priority ranking for the pilot's rank
      const allRankings = await getPriorityRanking(stats.rank, yearNumber)
      const pilotRanking = allRankings.find((r) => r.pilotId === pilotId)

      // Generate priority explanation
      const explanation = getPriorityExplanation(
        stats.seniorityNumber,
        stats.approvedDaysThisYear,
        stats.rank
      )

      return NextResponse.json({
        success: true,
        data: {
          stats,
          ranking: pilotRanking,
          explanation,
          totalPilotsInRank: allRankings.length,
        },
      })
    } catch (error) {
      console.error('Error fetching leave stats:', error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch leave statistics',
        },
        { status: 500 }
      )
    }
  }
)
