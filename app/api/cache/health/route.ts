/**
 * Cache Health Check API Endpoint
 * Sprint 2: Performance Optimization - Week 3, Day 2
 *
 * Purpose: Monitor Redis cache and materialized view health
 *
 * Endpoints:
 * - GET /api/cache/health - Check cache health status
 *
 * Returns:
 * - Redis connection status
 * - Materialized view health
 * - Overall system status
 * - Cache statistics
 *
 * @version 1.0.0
 * @since 2025-10-27
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { redisCacheService, checkRedisHealth } from '@/lib/services/redis-cache-service'
import { getCacheHealth } from '@/lib/services/dashboard-service-v4'
import type { PilotDashboardMetrics } from '@/types/database-views'

/**
 * GET /api/cache/health
 * Check cache health status
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get cache health status
    const health = await getCacheHealth()

    // Get Redis info
    const redisInfo = await redisCacheService.info()

    // Get materialized view status
    const { data: viewData, error: viewError } = await supabase
      .from('pilot_dashboard_metrics' as any)
      .select('last_refreshed')
      .single()

    const typedData = viewData as unknown as Pick<PilotDashboardMetrics, 'last_refreshed'>

    const viewHealthDetails = viewError
      ? { healthy: false, error: viewError.message }
      : {
          healthy: true,
          lastRefreshed: typedData?.last_refreshed,
          ageSeconds: typedData?.last_refreshed
            ? Math.floor((Date.now() - new Date(typedData.last_refreshed).getTime()) / 1000)
            : null,
        }

    return NextResponse.json({
      success: true,
      overall: health.overall,
      redis: {
        healthy: health.redis,
        connected: redisInfo.connected,
        keyCount: redisInfo.keyCount,
        memory: redisInfo.memory,
      },
      materializedView: viewHealthDetails,
      timestamp: new Date().toISOString(),
      recommendation: getHealthRecommendation(health),
    })
  } catch (error) {
    logError(error as Error, {
      source: 'CacheHealthAPI',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        operation: 'GET /api/cache/health',
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
 * Get health recommendation based on cache status
 */
function getHealthRecommendation(health: {
  redis: boolean
  materializedView: boolean
  overall: string
}): string {
  if (health.overall === 'healthy') {
    return 'All cache layers healthy'
  }

  if (!health.redis && health.materializedView) {
    return 'Redis down - using materialized view (performance degraded)'
  }

  if (health.redis && !health.materializedView) {
    return 'Materialized view stale - refresh recommended'
  }

  return 'Both cache layers unhealthy - check database connection'
}
