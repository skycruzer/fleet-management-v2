/**
 * Update Request Status API Endpoint
 *
 * PATCH /api/requests/[id]/status - Update workflow status of a pilot request
 *
 * CSRF PROTECTION: PATCH method validates CSRF token for defense-in-depth
 * RATE LIMITING: Inherits from admin API rate limits
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @version 2.0.0 - Added explicit CSRF validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateRequestStatus } from '@/lib/services/unified-request-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { logger } from '@/lib/services/logging-service'
import { revalidatePath } from 'next/cache'

interface RouteContext {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // SECURITY: Validate CSRF token (defense-in-depth)
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const UpdateStatusSchema = z.object({
      status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN']),
      comments: z.string().optional(),
      force: z.boolean().optional(),
    })

    const body = await request.json()
    const parsed = UpdateStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }
    const { status, comments, force } = parsed.data

    // Update request status
    const { id } = await context.params
    const result = await updateRequestStatus(id, status, auth.userId!, comments, force)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // Log the action
    await logger.info('Request status updated', {
      source: 'api:requests:status:patch',
      requestId: id,
      newStatus: status,
      userId: auth.userId!,
      comments,
    })

    // Revalidate affected paths
    revalidatePath('/dashboard/requests')
    revalidatePath(`/dashboard/requests/${id}`)

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    await logger.error('Failed to update request status', {
      source: 'api:requests:status:patch',
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { success: false, error: 'Failed to update request status' },
      { status: 500 }
    )
  }
}
