/**
 * Analytics API Route
 * Provides comprehensive analytics data for dashboard visualization
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPilotAnalytics,
  getCertificationAnalytics,
  getLeaveAnalytics,
  getFleetAnalytics,
  getRiskAnalytics,
} from '@/lib/services/analytics-service'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/analytics
 * Get comprehensive analytics data with optional type filter
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameter for specific analytics type
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    let analyticsData: any

    switch (type) {
      case 'pilot':
        analyticsData = await getPilotAnalytics()
        break
      case 'certification':
        analyticsData = await getCertificationAnalytics()
        break
      case 'leave':
        analyticsData = await getLeaveAnalytics()
        break
      case 'fleet':
        analyticsData = await getFleetAnalytics()
        break
      case 'risk':
        analyticsData = await getRiskAnalytics()
        break
      default:
        // Get all analytics data
        const [pilot, certification, leave, fleet, risk] = await Promise.all([
          getPilotAnalytics(),
          getCertificationAnalytics(),
          getLeaveAnalytics(),
          getFleetAnalytics(),
          getRiskAnalytics(),
        ])
        analyticsData = {
          pilot,
          certification,
          leave,
          fleet,
          risk,
        }
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
