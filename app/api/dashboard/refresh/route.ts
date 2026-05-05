/**
 * Dashboard Refresh API Endpoint
 *
 * Manually refresh the pilot_dashboard_metrics materialized view (POST) and
 * report on its freshness (GET). Both delegate to dashboard-service-v4 — this
 * route only handles HTTP/auth/CSRF concerns.
 *
 * @version 2.0.0 — refactored to delegate to service layer
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import {
  refreshDashboardMetrics,
  getDashboardLastRefreshTime,
} from '@/lib/services/dashboard-service-v4'

/**
 * POST /api/dashboard/refresh
 * Refresh the materialized view and invalidate Redis cache.
 */
export async function POST(request: NextRequest) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await refreshDashboardMetrics()
    const lastRefreshed = await getDashboardLastRefreshTime()

    return NextResponse.json({
      success: true,
      lastRefreshed,
      message: 'Dashboard metrics refreshed successfully',
    })
  } catch (error) {
    logError(error as Error, {
      source: 'DashboardRefreshAPI',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'POST /api/dashboard/refresh' },
    })

    const sanitized = sanitizeError(error, {
      operation: 'refreshDashboardMetrics',
      method: 'POST',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * GET /api/dashboard/refresh
 * Check materialized view freshness.
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const lastRefreshed = await getDashboardLastRefreshTime()

    if (!lastRefreshed) {
      return NextResponse.json({
        success: true,
        healthy: false,
        lastRefreshed: null,
        ageSeconds: null,
        recommendation: 'View has not been refreshed yet',
      })
    }

    const ageSeconds = Math.floor((Date.now() - new Date(lastRefreshed).getTime()) / 1000)
    const isRecent = ageSeconds < 10 * 60

    return NextResponse.json({
      success: true,
      healthy: isRecent,
      lastRefreshed,
      ageSeconds,
      recommendation: isRecent ? 'View is fresh' : 'Consider refreshing the view',
    })
  } catch (error) {
    logError(error as Error, {
      source: 'DashboardRefreshAPI',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'GET /api/dashboard/refresh' },
    })

    const sanitized = sanitizeError(error, {
      operation: 'getDashboardHealth',
      method: 'GET',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
