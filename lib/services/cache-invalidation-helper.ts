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
 * Invalidate request-related caches (unified leave + flight requests).
 * Covers both admin and portal surfaces; pass requestId for the detail page.
 */
export async function invalidateRequestCaches(requestId?: string): Promise<void> {
  const paths = [
    '/dashboard',
    '/dashboard/requests',
    '/portal/dashboard',
    '/portal/leave-requests',
    '/portal/flight-requests',
  ]
  if (requestId) {
    paths.push(`/dashboard/requests/${requestId}`)
  }
  await invalidateAfterMutation({
    paths,
    tags: ['requests', 'leave-requests', 'pilot-requests'],
  })
}

/**
 * Invalidate pilot-related caches
 * Includes Redis analytics cache invalidation
 */
export async function invalidatePilotCaches(pilotId?: string): Promise<void> {
  const paths = ['/dashboard', '/dashboard/pilots']
  if (pilotId) {
    paths.push(`/dashboard/pilots/${pilotId}`)
  }

  // Invalidate Next.js caches
  await invalidateAfterMutation({ paths, tags: ['pilots'] })

  // Invalidate Redis analytics caches (pilot changes affect analytics)
  await invalidatePilotAnalyticsCaches()

  // Invalidate Redis pilot list cache
  await redisCacheService.delPattern(`${CACHE_KEYS.PILOTS_LIST}:*`)

  // Invalidate all cache keys tagged with 'pilots'
  await redisCacheService.invalidateByTag('pilots')
}

/**
 * Invalidate certification-related caches
 * Includes Redis analytics cache invalidation
 */
export async function invalidateCertificationCaches(options?: {
  certificationId?: string
  pilotId?: string
}): Promise<void> {
  const paths = ['/dashboard', '/dashboard/certifications']
  if (options?.certificationId) {
    paths.push(`/dashboard/certifications/${options.certificationId}`)
  }
  if (options?.pilotId) {
    paths.push(`/dashboard/pilots/${options.pilotId}`)
  }

  // Invalidate Next.js caches
  await invalidateAfterMutation({
    paths,
    tags: ['certifications', 'pilot-checks'],
  })

  // Invalidate Redis analytics caches (certification changes affect analytics)
  await invalidateCertificationAnalyticsCaches()

  // Invalidate all cache keys tagged with 'certifications'
  await redisCacheService.invalidateByTag('certifications')
}

/**
 * Invalidate leave/request-related caches
 * Includes Redis analytics cache invalidation
 */
export async function invalidateLeaveCaches(): Promise<void> {
  // Invalidate Next.js caches. The old /dashboard/leave* paths are gone —
  // they 308-redirect to /dashboard/requests (next.config.js), so
  // revalidating them was a no-op.
  await invalidateAfterMutation({
    paths: ['/dashboard', '/dashboard/requests', '/portal/dashboard', '/portal/leave-requests'],
    tags: ['requests', 'leave-requests', 'pilot-requests'],
  })

  // Invalidate Redis analytics caches (leave changes affect analytics)
  await invalidateLeaveAnalyticsCaches()

  // Invalidate all cache keys tagged with 'leave'
  await redisCacheService.invalidateByTag('leave')
}

/**
 * Invalidate all analytics caches
 * Use for bulk operations or when unsure which domain changed
 */
export async function invalidateAllAnalyticsCaches(): Promise<void> {
  await invalidateAnalyticsCaches()
}

/**
 * Invalidate task-related caches
 */
export async function invalidateTaskCaches(taskId?: string): Promise<void> {
  const paths = ['/dashboard/tasks']
  if (taskId) {
    paths.push(`/dashboard/tasks/${taskId}`, `/dashboard/tasks/${taskId}/edit`)
  }
  await invalidateAfterMutation({ paths, tags: ['tasks'] })
}

/**
 * Invalidate feedback-related caches (admin + portal surfaces)
 */
export async function invalidateFeedbackCaches(feedbackId?: string): Promise<void> {
  const paths = ['/dashboard/feedback', '/portal/feedback']
  if (feedbackId) {
    paths.push(`/dashboard/feedback/${feedbackId}`)
  }
  await invalidateAfterMutation({ paths, tags: ['feedback'] })
}

/**
 * Invalidate disciplinary-matter caches
 */
export async function invalidateDisciplinaryCaches(matterId?: string): Promise<void> {
  const paths = ['/dashboard/disciplinary']
  if (matterId) {
    paths.push(`/dashboard/disciplinary/${matterId}`)
  }
  await invalidateAfterMutation({ paths, tags: ['disciplinary'] })
}

/**
 * Invalidate settings caches. Settings (e.g. app title, retirement age) feed
 * the dashboard layout, so '/dashboard' is invalidated layout-scoped to bust
 * every nested dashboard page, not just the index.
 */
export async function invalidateSettingsCaches(): Promise<void> {
  try {
    revalidatePath('/dashboard', 'layout')
  } catch {
    // Path might not exist, continue
  }
  await invalidateAfterMutation({
    paths: ['/dashboard/settings', '/dashboard/admin/settings'],
    tags: ['settings'],
  })
}

/**
 * Invalidate published-roster caches (admin + portal surfaces)
 */
export async function invalidatePublishedRosterCaches(): Promise<void> {
  await invalidateAfterMutation({
    paths: ['/dashboard/published-rosters', '/portal/dashboard'],
    tags: ['published-rosters'],
  })
}

/**
 * Invalidate renewal-planning caches
 */
export async function invalidateRenewalPlanningCaches(): Promise<void> {
  await invalidateAfterMutation({
    paths: ['/dashboard/renewal-planning', '/dashboard/renewal-planning/calendar'],
    tags: ['renewal-planning'],
  })
}

/**
 * Invalidate leave-bid caches (admin + portal surfaces).
 * Distinct from invalidateLeaveCaches: bids are the annual bidding system.
 */
export async function invalidateLeaveBidCaches(): Promise<void> {
  await invalidateAfterMutation({
    paths: [
      '/dashboard/admin/leave-bids',
      '/portal/leave-bids',
      '/portal/dashboard',
      '/portal/leave-requests',
    ],
    tags: ['leave-bids'],
  })
}

/**
 * Invalidate notification caches (bell dropdown + notifications pages)
 */
export async function invalidateNotificationCaches(): Promise<void> {
  await invalidateAfterMutation({
    paths: ['/dashboard/notifications', '/portal/notifications'],
    tags: ['notifications'],
  })
}
