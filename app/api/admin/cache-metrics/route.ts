/**
 * Cache Metrics API Route
 * Provides cache statistics and health monitoring for admin dashboard
 *
 * Developer: Maurice Rondeau
 *
 * AUTHENTICATION: Admin only
 * RATE LIMITING: N/A (admin-only endpoint)
 *
 * @version 1.0.0
 * @since 2026-01
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { unauthorizedResponse, forbiddenResponse } from '@/lib/utils/api-response-helper'
import { redisCacheService, checkRedisHealth } from '@/lib/services/redis-cache-service'
import { unifiedCacheService, getCacheStats } from '@/lib/services/unified-cache-service'
import { getNoCacheHeaders } from '@/lib/utils/cache-headers'

/**
 * GET /api/admin/cache-metrics
 * Get comprehensive cache statistics from Redis and local cache
 *
 * Returns:
 * - Redis connection status and metrics
 * - Local cache statistics
 * - Cache hit rate
 * - Top accessed keys
 */
export async function GET(_request: NextRequest) {
  // Check authentication
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  try {
    // Get Redis status and metrics
    const [redisHealth, redisInfo] = await Promise.all([
      checkRedisHealth(),
      redisCacheService.info(),
    ])

    // Get Redis cache metrics (hit/miss tracking)
    const redisMetrics = redisCacheService.getMetrics()

    // Get local cache statistics
    const localCacheStats = getCacheStats()

    // Get top accessed keys from local cache
    const topAccessedKeys = unifiedCacheService.getTopAccessedKeys(10)

    return NextResponse.json(
      {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          redis: {
            connected: redisHealth,
            keyCount: redisInfo.keyCount,
            memory: redisInfo.memory,
            metrics: {
              hits: redisMetrics.hits,
              misses: redisMetrics.misses,
              sets: redisMetrics.sets,
              deletes: redisMetrics.deletes,
              errors: redisMetrics.errors,
              hitRate: redisMetrics.hitRate,
              totalOperations: redisMetrics.totalOperations,
              lastReset: redisMetrics.lastReset.toISOString(),
            },
          },
          local: {
            totalEntries: localCacheStats.totalEntries,
            trackingEntries: localCacheStats.trackingEntries,
            entries: localCacheStats.entries.map((entry) => ({
              key: entry.key,
              ageMinutes: entry.ageMinutes,
              ttlMinutes: entry.ttlMinutes,
              expired: entry.expired,
              accessCount: entry.accessCount,
              tags: entry.tags,
            })),
          },
          topAccessedKeys,
          summary: {
            totalCachedItems: redisInfo.keyCount + localCacheStats.totalEntries,
            redisHitRate: redisMetrics.hitRate,
            localCacheSize: localCacheStats.totalEntries,
          },
        },
      },
      {
        headers: getNoCacheHeaders(), // Metrics should always be fresh
      }
    )
  } catch (error) {
    console.error('GET /api/admin/cache-metrics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cache metrics',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cache-metrics
 * Reset cache metrics or invalidate caches
 *
 * Body:
 * - action: 'reset-metrics' | 'invalidate-all' | 'invalidate-analytics'
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'reset-metrics':
        redisCacheService.resetMetrics()
        return NextResponse.json({
          success: true,
          message: 'Redis metrics reset successfully',
        })

      case 'invalidate-all':
        unifiedCacheService.invalidateAll()
        await redisCacheService.flushAll()
        return NextResponse.json({
          success: true,
          message: 'All caches invalidated successfully',
        })

      case 'invalidate-analytics':
        // Import dynamically to avoid circular dependency
        const { invalidateAnalyticsCaches } = await import('@/lib/services/analytics-service')
        await invalidateAnalyticsCaches()
        return NextResponse.json({
          success: true,
          message: 'Analytics caches invalidated successfully',
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}. Valid actions: reset-metrics, invalidate-all, invalidate-analytics`,
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('POST /api/admin/cache-metrics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform cache action',
      },
      { status: 500 }
    )
  }
}
