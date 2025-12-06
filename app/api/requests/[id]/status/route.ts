/**
 * Update Request Status API Endpoint
 *
 * PATCH /api/requests/[id]/status - Update workflow status of a pilot request
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateRequestStatus, type WorkflowStatus } from '@/lib/services/unified-request-service'
import { logger } from '@/lib/services/logging-service'
import { revalidatePath } from 'next/cache'

interface RouteContext {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient()

  try {
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { status, comments } = body as { status: WorkflowStatus; comments?: string }

    // Validate status
    const validStatuses: WorkflowStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'IN_REVIEW',
      'APPROVED',
      'DENIED',
      'WITHDRAWN',
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 })
    }

    // Update request status
    const { id } = await context.params
    const result = await updateRequestStatus(id, status, user.id, comments)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // Log the action
    await logger.info('Request status updated', {
      source: 'api:requests:status:patch',
      requestId: id,
      newStatus: status,
      userId: user.id,
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
