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
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/analytics
 * Get comprehensive analytics data with optional type filter
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameter for specific analytics type
    const searchParams = _request.nextUrl.searchParams
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
    const sanitized = sanitizeError(error, {
      operation: 'getAnalytics',
      endpoint: '/api/analytics',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
