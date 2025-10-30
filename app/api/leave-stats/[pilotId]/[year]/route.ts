/**
 * Leave Statistics API
 * GET /api/leave-stats/:pilotId/:year
 *
 * Returns approved days and priority ranking for a pilot
 *
 * @version 1.0.0
 * @since 2025-10-26
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getPilotLeaveStats,
  getPriorityRanking,
  getPriorityExplanation
} from '@/lib/services/leave-stats-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pilotId: string; year: string }> }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { pilotId, year } = await params
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
      return NextResponse.json(
        { success: false, error: 'Pilot not found' },
        { status: 404 }
      )
    }

    // Get priority ranking for the pilot's rank
    const allRankings = await getPriorityRanking(stats.rank, yearNumber)
    const pilotRanking = allRankings.find(r => r.pilotId === pilotId)

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
        totalPilotsInRank: allRankings.length
      }
    })

  } catch (error) {
    console.error('Error fetching leave stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leave statistics'
      },
      { status: 500 }
    )
  }
}
