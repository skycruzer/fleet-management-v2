/**
 * Memory Statistics API Endpoint
 * Author: Maurice Rondeau
 * Date: November 21, 2025
 *
 * Provides real-time memory usage and cache statistics
 * Use for monitoring and alerting
 *
 * @version 2.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { unifiedCacheService } from '@/lib/services/unified-cache-service'
import { redisCacheService } from '@/lib/services/redis-cache-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/admin/memory-stats
 *
 * Returns comprehensive memory and cache statistics
 *
 * @example
 * curl http://localhost:3000/api/admin/memory-stats
 */
export const GET = createAdminRoute(
  {
    operation: 'getMemoryStats',
    endpoint: '/api/admin/memory-stats',
    rateLimit: false,
    roles: [UserRole.ADMIN],
  },
  async () => {
    try {
      // Node.js memory usage
      const memoryUsage = process.memoryUsage()

      // Local cache statistics
      const cacheStats = unifiedCacheService.getStats()

      // Redis cache info
      const redisInfo = await redisCacheService.info()

      // Calculate heap usage percentage
      const heapPercent = ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)

      // Memory pressure status
      let memoryStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (parseFloat(heapPercent) >= 90) {
        memoryStatus = 'critical'
      } else if (parseFloat(heapPercent) >= 80) {
        memoryStatus = 'warning'
      }

      return NextResponse.json({
        status: memoryStatus,
        memory: {
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapPercent: `${heapPercent}%`,
          external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          arrayBuffers: `${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
        },
        cache: {
          local: {
            totalEntries: cacheStats.totalEntries,
            entries: cacheStats.entries,
          },
          redis: {
            connected: redisInfo.connected,
            keyCount: redisInfo.keyCount,
          },
        },
        uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        source: 'api/admin/memory-stats/GET',
        severity: ErrorSeverity.MEDIUM,
      })
      const s = sanitizeError(error, {
        operation: 'getMemoryStats',
        endpoint: '/api/admin/memory-stats',
      })
      return NextResponse.json({ error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
