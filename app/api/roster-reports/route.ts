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
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { logger } from '@/lib/services/logging-service'

/**
 * GET /api/roster-reports
 *
 * Fetch all roster reports (with optional filtering by roster period)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const rosterPeriod = searchParams.get('rosterPeriod')

    // Build query
    const supabase = await createClient()
    let query = supabase
      .from('roster_reports')
      .select('*')
      .order('generated_at', { ascending: false })

    // Filter by roster period if provided
    if (rosterPeriod) {
      query = query.eq('roster_period_code', rosterPeriod)
    }

    const { data: reports, error } = await query

    if (error) {
      logger.error('Failed to fetch roster reports', { error })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch roster reports',
        },
        { status: 500 }
      )
    }

    logger.info('Fetched roster reports', {
      userId: auth.userId!,
      count: reports?.length || 0,
      rosterPeriod,
    })

    return NextResponse.json({
      success: true,
      data: reports || [],
    })
  } catch (error: any) {
    logger.error('Roster reports API error', { error })
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
