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
 * Invalidate caches after a mutation
 *
 * Revalidates relevant paths and tags after data mutations.
 *
 * @param options - Paths and tags to revalidate
 */
export async function invalidateAfterMutation(options?: {
  paths?: string[]
  tags?: string[]
}): Promise<void> {
  const defaultPaths = [
    '/dashboard',
    '/dashboard/requests',
    '/dashboard/leave',
    '/dashboard/leave/approve',
    '/dashboard/leave/calendar',
  ]

  const paths = options?.paths ?? defaultPaths

  // Revalidate paths
  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch {
      // Path might not exist, continue
    }
  }

  // Revalidate tags if provided
  if (options?.tags) {
    for (const tag of options.tags) {
      try {
        revalidateTag(tag)
      } catch {
        // Tag might not exist, continue
      }
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
