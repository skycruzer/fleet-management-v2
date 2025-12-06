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
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 * @since 2025-10-27
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'
import { redisCacheService } from '@/lib/services/redis-cache-service'
import { refreshDashboardMetrics } from '@/lib/services/dashboard-service-v4'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
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
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // AUTHORIZATION: Admin-only endpoint
    const roleCheck = await requireRole(request, [UserRole.ADMIN])
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: roleCheck.statusCode }
      )
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

    const sanitized = sanitizeError(error, {
      operation: 'invalidateCache',
      method: 'POST',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE /api/cache/invalidate
 * Flush ALL cache (dangerous - use sparingly!)
 */
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting (strict for destructive cache flush)
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // AUTHORIZATION: Admin-only endpoint (destructive operation)
    const roleCheck = await requireRole(request, [UserRole.ADMIN])
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: roleCheck.statusCode }
      )
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

    const sanitized = sanitizeError(error, {
      operation: 'flushAllCache',
      method: 'DELETE',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
