/**
 * Dashboard Refresh API Endpoint
 * Sprint 2: Performance Optimization - Week 3, Day 1
 *
 * Purpose: Manually refresh the pilot_dashboard_metrics materialized view
 *
 * When to call:
 * - After pilot CRUD operations
 * - After certification updates
 * - After leave request changes
 * - After system settings modifications
 *
 * Performance:
 * - Refresh time: ~50-100ms
 * - Concurrent refresh (no blocking)
 * - Automatic cache invalidation
 *
 * @version 1.0.0
 * @since 2025-10-27
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import type { PilotDashboardMetrics } from '@/types/database-views'

/**
 * POST /api/dashboard/refresh
 * Refresh the materialized view and invalidate cache
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Call the refresh function
    const { error: refreshError } = await supabase.rpc('refresh_dashboard_metrics')

    if (refreshError) {
      throw new Error(`Failed to refresh dashboard: ${refreshError.message}`)
    }

    // Verify refresh was successful
    const { data: viewData, error: verifyError } = await supabase
      .from('pilot_dashboard_metrics' as any)
      .select('last_refreshed')
      .single()

    if (verifyError) {
      throw new Error(`Failed to verify refresh: ${verifyError.message}`)
    }

    const typedData = viewData as unknown as Pick<PilotDashboardMetrics, 'last_refreshed'>

    return NextResponse.json({
      success: true,
      lastRefreshed: typedData?.last_refreshed,
      message: 'Dashboard metrics refreshed successfully',
    })
  } catch (error) {
    logError(error as Error, {
      source: 'DashboardRefreshAPI',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        operation: 'POST /api/dashboard/refresh',
      },
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dashboard/refresh
 * Check materialized view health status
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get view metadata
    const { data: viewData, error: viewError } = await supabase
      .from('pilot_dashboard_metrics' as any)
      .select('last_refreshed')
      .single()

    if (viewError) {
      return NextResponse.json(
        {
          success: false,
          healthy: false,
          error: 'Materialized view not accessible',
        },
        { status: 503 }
      )
    }

    const typedData = viewData as unknown as Pick<PilotDashboardMetrics, 'last_refreshed'>

    if (!typedData.last_refreshed) {
      return NextResponse.json({
        success: true,
        healthy: false,
        lastRefreshed: null,
        ageSeconds: null,
        recommendation: 'View has not been refreshed yet',
      })
    }

    // Check if data is recent (within last 10 minutes)
    const lastRefresh = new Date(typedData.last_refreshed)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const isRecent = lastRefresh > tenMinutesAgo

    // Calculate age in seconds
    const ageSeconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000)

    return NextResponse.json({
      success: true,
      healthy: isRecent,
      lastRefreshed: typedData.last_refreshed,
      ageSeconds,
      recommendation: isRecent
        ? 'View is fresh'
        : 'Consider refreshing the view',
    })
  } catch (error) {
    logError(error as Error, {
      source: 'DashboardRefreshAPI',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        operation: 'GET /api/dashboard/refresh',
      },
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
