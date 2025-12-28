/**
 * Cache Invalidation Helper
 *
 * Utility functions for invalidating caches after mutations.
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

import { revalidatePath, revalidateTag } from 'next/cache'

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
          revalidateTag(tag)
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
    paths: [
      '/dashboard/requests',
      '/dashboard/leave/approve',
      '/dashboard/leave/calendar',
    ],
    tags: ['requests', 'leave-requests', 'pilot-requests'],
  })
}

/**
 * Invalidate pilot-related caches
 */
export async function invalidatePilotCaches(pilotId?: string): Promise<void> {
  const paths = ['/dashboard/pilots']
  if (pilotId) {
    paths.push(`/dashboard/pilots/${pilotId}`)
  }

  await invalidateAfterMutation({ paths, tags: ['pilots'] })
}

/**
 * Invalidate certification-related caches
 */
export async function invalidateCertificationCaches(): Promise<void> {
  await invalidateAfterMutation({
    paths: ['/dashboard/certifications'],
    tags: ['certifications', 'pilot-checks'],
  })
}
