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
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { redisCacheService } from '@/lib/services/redis-cache-service'
import { getCacheHealth } from '@/lib/services/dashboard-service-v4'
import type { PilotDashboardMetrics } from '@/types/database-views'

/**
 * GET /api/cache/health
 * Check cache health status
 *
 * Auth, rate limiting, and sanitized error handling are supplied by the route factory.
 */
export const GET = createAdminRoute(
  { operation: 'getCacheHealth', endpoint: '/api/cache/health' },
  async () => {
    // Get cache health status
    const health = await getCacheHealth()

    // Get Redis info
    const redisInfo = await redisCacheService.info()

    // Get materialized view status
    const supabase = createAdminClient()
    const { data: viewData, error: viewError } = await supabase
      .from('pilot_dashboard_metrics' as any)
      .select('last_refreshed')
      .single()

    const typedData = viewData as unknown as Pick<PilotDashboardMetrics, 'last_refreshed'>

    let viewHealthDetails: {
      healthy: boolean
      error?: string
      lastRefreshed?: string | null
      ageSeconds?: number | null
    }

    if (viewError) {
      // Do not leak raw DB error details to the client; log server-side.
      console.error('Cache health: materialized view check failed:', viewError)
      viewHealthDetails = { healthy: false, error: 'Materialized view unavailable' }
    } else {
      viewHealthDetails = {
        healthy: true,
        lastRefreshed: typedData?.last_refreshed,
        ageSeconds: typedData?.last_refreshed
          ? Math.floor((Date.now() - new Date(typedData.last_refreshed).getTime()) / 1000)
          : null,
      }
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
  }
)

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
