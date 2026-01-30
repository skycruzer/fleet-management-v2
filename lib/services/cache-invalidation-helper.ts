/**
 * Cache Invalidation Helper
 *
 * Utility functions for invalidating caches after mutations.
 * Handles both Next.js path/tag revalidation and Redis cache invalidation.
 *
 * @author Maurice Rondeau
 * @date December 2025
 * @updated January 2026 - Added Redis analytics cache invalidation
 */

import { revalidatePath, revalidateTag } from 'next/cache'
import {
  invalidatePilotAnalyticsCaches,
  invalidateCertificationAnalyticsCaches,
  invalidateLeaveAnalyticsCaches,
  invalidateAnalyticsCaches,
} from './analytics-service'
import { redisCacheService, CACHE_KEYS } from './redis-cache-service'

/**
 * Domain-specific path mappings for cache invalidation
 */
const DOMAIN_PATHS: Record<string, string[]> = {
  leave: [
    '/dashboard',
    '/dashboard/requests',
    '/dashboard/leave',
    '/dashboard/leave/approve',
    '/dashboard/leave/calendar',
  ],
  flight: ['/dashboard', '/dashboard/requests', '/dashboard/flight-requests'],
  pilot: ['/dashboard', '/dashboard/pilots'],
  certification: ['/dashboard', '/dashboard/certifications'],
  task: ['/dashboard', '/dashboard/tasks'],
}

/**
 * Invalidate caches after a mutation
 *
 * Supports two call patterns:
 * 1. `invalidateAfterMutation('leave', { resourceId: id })` - domain-based
 * 2. `invalidateAfterMutation({ paths, tags })` - explicit paths/tags
 *
 * @param domainOrOptions - Domain string or options object
 * @param legacyOptions - Legacy options (resourceId, etc.) when using domain string
 */
export async function invalidateAfterMutation(
  domainOrOptions?:
    | string
    | {
        paths?: string[]
        tags?: string[]
      },
  legacyOptions?: { resourceId?: string }
): Promise<void> {
  let paths: string[]

  // Handle legacy call pattern: invalidateAfterMutation('leave', { resourceId: id })
  if (typeof domainOrOptions === 'string') {
    paths = DOMAIN_PATHS[domainOrOptions] ?? ['/dashboard']
    // If resourceId provided, add specific resource path
    if (legacyOptions?.resourceId) {
      paths = [...paths, `/dashboard/requests/${legacyOptions.resourceId}`]
    }
  } else {
    // Handle new call pattern: invalidateAfterMutation({ paths, tags })
    const defaultPaths = [
      '/dashboard',
      '/dashboard/requests',
      '/dashboard/leave',
      '/dashboard/leave/approve',
      '/dashboard/leave/calendar',
    ]
    paths = domainOrOptions?.paths ?? defaultPaths

    // Revalidate tags if provided
    if (domainOrOptions?.tags) {
      for (const tag of domainOrOptions.tags) {
        try {
          revalidateTag(tag, 'default')
        } catch {
          // Tag might not exist, continue
        }
      }
    }
  }

  // Revalidate paths
  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch {
      // Path might not exist, continue
    }
  }
}

/**
 * Invalidate request-related caches
 */
export async function invalidateRequestCaches(): Promise<void> {
  await invalidateAfterMutation({
    paths: ['/dashboard/requests', '/dashboard/leave/approve', '/dashboard/leave/calendar'],
    tags: ['requests', 'leave-requests', 'pilot-requests'],
  })
}

/**
 * Invalidate pilot-related caches
 * Includes Redis analytics cache invalidation
 */
export async function invalidatePilotCaches(pilotId?: string): Promise<void> {
  const paths = ['/dashboard/pilots']
  if (pilotId) {
    paths.push(`/dashboard/pilots/${pilotId}`)
  }

  // Invalidate Next.js caches
  await invalidateAfterMutation({ paths, tags: ['pilots'] })

  // Invalidate Redis analytics caches (pilot changes affect analytics)
  await invalidatePilotAnalyticsCaches()

  // Invalidate Redis pilot list cache
  await redisCacheService.delPattern(`${CACHE_KEYS.PILOTS_LIST}:*`)
}

/**
 * Invalidate certification-related caches
 * Includes Redis analytics cache invalidation
 */
export async function invalidateCertificationCaches(): Promise<void> {
  // Invalidate Next.js caches
  await invalidateAfterMutation({
    paths: ['/dashboard/certifications'],
    tags: ['certifications', 'pilot-checks'],
  })

  // Invalidate Redis analytics caches (certification changes affect analytics)
  await invalidateCertificationAnalyticsCaches()
}

/**
 * Invalidate leave/request-related caches
 * Includes Redis analytics cache invalidation
 */
export async function invalidateLeaveCaches(): Promise<void> {
  // Invalidate Next.js caches
  await invalidateAfterMutation({
    paths: [
      '/dashboard/requests',
      '/dashboard/leave',
      '/dashboard/leave/approve',
      '/dashboard/leave/calendar',
    ],
    tags: ['requests', 'leave-requests', 'pilot-requests'],
  })

  // Invalidate Redis analytics caches (leave changes affect analytics)
  await invalidateLeaveAnalyticsCaches()
}

/**
 * Invalidate all analytics caches
 * Use for bulk operations or when unsure which domain changed
 */
export async function invalidateAllAnalyticsCaches(): Promise<void> {
  await invalidateAnalyticsCaches()
}
