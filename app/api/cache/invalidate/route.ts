/**
 * Cache Invalidation API Endpoint
 * Sprint 2: Performance Optimization - Week 3, Day 2
 *
 * Purpose: Manually invalidate Redis cache entries
 *
 * Endpoints:
 * - POST /api/cache/invalidate - Invalidate specific cache keys or patterns
 * - DELETE /api/cache/invalidate - Flush all cache (dangerous!)
 *
 * Use Cases:
 * - After bulk data imports
 * - After critical data corrections
 * - During testing/debugging
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 * @since 2025-10-27
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'
import { redisCacheService } from '@/lib/services/redis-cache-service'
import { refreshDashboardMetrics } from '@/lib/services/dashboard-service-v4'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * POST /api/cache/invalidate
 * Invalidate specific cache keys or patterns
 *
 * Body:
 * {
 *   "keys": ["key1", "key2"],  // Optional: specific keys
 *   "pattern": "fleet:*"        // Optional: pattern to match
 * }
 */
export const POST = createAdminRoute(
  {
    operation: 'invalidateCache',
    endpoint: '/api/cache/invalidate',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    roles: [UserRole.ADMIN],
  },
  async ({ request, admin }) => {
    try {
      const body = await request.json()
      const { keys, pattern } = body

      let invalidatedCount = 0

      // Invalidate specific keys
      if (keys && Array.isArray(keys)) {
        for (const key of keys) {
          await redisCacheService.del(key)
          invalidatedCount++
        }
      }

      // Invalidate by pattern
      if (pattern && typeof pattern === 'string') {
        await redisCacheService.delPattern(pattern)
        invalidatedCount += 1 // Pattern counts as 1 operation
      }

      // Special case: dashboard cache invalidation
      if (pattern === 'dashboard:*' || (keys && keys.includes('dashboard:metrics:v3'))) {
        // Also refresh materialized view
        await refreshDashboardMetrics()
      }

      logWarning('Cache invalidation requested', {
        source: 'CacheInvalidateAPI',
        metadata: {
          operation: 'POST /api/cache/invalidate',
          userId: admin.userId,
          keys,
          pattern,
          invalidatedCount,
        },
      })

      return NextResponse.json({
        success: true,
        invalidatedCount,
        message: `Invalidated ${invalidatedCount} cache entries`,
      })
    } catch (error) {
      logError(error as Error, {
        source: 'CacheInvalidateAPI',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          operation: 'POST /api/cache/invalidate',
        },
      })

      const sanitized = sanitizeError(error, {
        operation: 'invalidateCache',
        method: 'POST',
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode })
    }
  }
)

/**
 * DELETE /api/cache/invalidate
 * Flush ALL cache (dangerous - use sparingly!)
 */
export const DELETE = createAdminRoute(
  {
    operation: 'flushAllCache',
    endpoint: '/api/cache/invalidate',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    roles: [UserRole.ADMIN],
  },
  async ({ admin }) => {
    try {
      // Flush all cache
      await redisCacheService.flushAll()

      // Also refresh materialized view
      await refreshDashboardMetrics()

      logWarning('Full cache flush requested', {
        source: 'CacheInvalidateAPI',
        metadata: {
          operation: 'DELETE /api/cache/invalidate',
          userId: admin.userId,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'All cache flushed and materialized view refreshed',
      })
    } catch (error) {
      logError(error as Error, {
        source: 'CacheInvalidateAPI',
        severity: ErrorSeverity.HIGH,
        metadata: {
          operation: 'DELETE /api/cache/invalidate',
        },
      })

      const sanitized = sanitizeError(error, {
        operation: 'flushAllCache',
        method: 'DELETE',
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode })
    }
  }
)
