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
 * @version 1.0.0
 * @since 2025-10-27
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'
import { redisCacheService } from '@/lib/services/redis-cache-service'
import { refreshDashboardMetrics } from '@/lib/services/dashboard-service-v4'

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
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'Admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 })
    }

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
        userId: user.id,
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
 * DELETE /api/cache/invalidate
 * Flush ALL cache (dangerous - use sparingly!)
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'Admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Flush all cache
    await redisCacheService.flushAll()

    // Also refresh materialized view
    await refreshDashboardMetrics()

    logWarning('Full cache flush requested', {
      source: 'CacheInvalidateAPI',
      metadata: {
        operation: 'DELETE /api/cache/invalidate',
        userId: user.id,
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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
