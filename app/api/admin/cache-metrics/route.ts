/**
 * Cache Metrics API Route
 * Provides cache statistics and health monitoring for admin dashboard
 *
 * Developer: Maurice Rondeau
 *
 * AUTHENTICATION: Admin only
 * RATE LIMITING: N/A (admin-only endpoint)
 *
 * @version 2.0.0
 * @since 2026-01
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { redisCacheService, checkRedisHealth } from '@/lib/services/redis-cache-service'
import { unifiedCacheService, getCacheStats } from '@/lib/services/unified-cache-service'
import { getNoCacheHeaders } from '@/lib/utils/cache-headers'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

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
export const GET = createAdminRoute(
  {
    operation: 'getCacheMetrics',
    endpoint: '/api/admin/cache-metrics',
    rateLimit: false,
    roles: [UserRole.ADMIN],
  },
  async () => {
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
      logError(error instanceof Error ? error : new Error(String(error)), {
        source: 'api/admin/cache-metrics/GET',
        severity: ErrorSeverity.MEDIUM,
      })
      const s = sanitizeError(error, {
        operation: 'getCacheMetrics',
        endpoint: '/api/admin/cache-metrics',
      })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)

/**
 * POST /api/admin/cache-metrics
 * Reset cache metrics or invalidate caches
 *
 * Body:
 * - action: 'reset-metrics' | 'invalidate-all' | 'invalidate-analytics'
 */
export const POST = createAdminRoute(
  {
    operation: 'performCacheAction',
    endpoint: '/api/admin/cache-metrics',
    rateLimit: false,
    roles: [UserRole.ADMIN],
  },
  async ({ request }) => {
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
      logError(error instanceof Error ? error : new Error(String(error)), {
        source: 'api/admin/cache-metrics/POST',
        severity: ErrorSeverity.MEDIUM,
      })
      const s = sanitizeError(error, {
        operation: 'performCacheAction',
        endpoint: '/api/admin/cache-metrics',
      })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
