'use server'

/**
 * Approvals Hub server actions.
 *
 * Thin wrappers over unified-request-service — the service already performs
 * the atomic crew-eligibility gate, notifications, and audit fields. The hub
 * adds no new mutation logic (see tasks/todo.md, Approvals Hub plan).
 */

import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { updateRequestStatus } from '@/lib/services/unified-request-service'
import { invalidateAfterMutation } from '@/lib/services/cache-invalidation-helper'

interface ActionResult {
  success: boolean
  error?: string
}

async function reviewRequest(
  id: string,
  status: 'APPROVED' | 'DENIED' | 'IN_REVIEW',
  comments?: string
): Promise<ActionResult> {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return { success: false, error: 'Authentication required' }
  }

  const result = await updateRequestStatus(id, status, auth.userId!, comments)
  if (!result.success) {
    return { success: false, error: result.error || `Failed to set request to ${status}` }
  }

  await invalidateAfterMutation('leave', { resourceId: id }).catch((error) =>
    console.error('Cache invalidation failed (non-blocking):', error)
  )
  return { success: true }
}

export async function approveRequestAction(id: string, comments?: string): Promise<ActionResult> {
  return reviewRequest(id, 'APPROVED', comments)
}

export async function denyRequestAction(id: string, comments: string): Promise<ActionResult> {
  return reviewRequest(id, 'DENIED', comments || 'Denied by admin')
}

export async function needsInfoRequestAction(id: string, comments?: string): Promise<ActionResult> {
  return reviewRequest(id, 'IN_REVIEW', comments || 'More information requested')
}
