/**
 * Analytics API Route
 * Provides comprehensive analytics data for dashboard visualization
 *
 * Developer: Maurice Rondeau
 *
 * RATE LIMITING: 30 requests per minute per user (heavy endpoint - runs 5 service calls)
 * HTTP CACHING: Private, 1 minute cache (dashboard data)
 * REDIS CACHING: Analytics service uses 10-minute Redis cache (reduces response from 500-800ms to 5ms)
 *
 * @version 2.2.0
 * @updated 2026-01 - Added rate limiting, standardized error responses, HTTP caching, Redis caching
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
import { authRateLimit } from '@/lib/rate-limit'
import { unauthorizedResponse } from '@/lib/utils/api-response-helper'
import { getCacheHeadersPreset } from '@/lib/utils/cache-headers'

/**
 * GET /api/analytics
 * Get comprehensive analytics data with optional type filter
 *
 * NOTE: This is a heavy endpoint that runs up to 5 parallel service calls.
 * Rate limiting is enforced per user.
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return unauthorizedResponse()
    }

    // Rate limiting per authenticated user
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          errorCode: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
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

    return NextResponse.json(
      {
        success: true,
        data: analyticsData,
      },
      {
        headers: getCacheHeadersPreset('DASHBOARD_DATA'),
      }
    )
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getAnalytics',
      endpoint: '/api/analytics',
    })
    return NextResponse.json(
      {
        success: false,
        error: sanitized.error,
        errorId: sanitized.errorId,
      },
      { status: sanitized.statusCode || 500 }
    )
  }
}
