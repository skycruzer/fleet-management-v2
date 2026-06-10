/**
 * Leave Request Review API
 * API endpoint for approving or denying leave requests
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PUT method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * Security pipeline (CSRF, auth, rate limiting, roles) via createAdminRoute.
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 * @since 2025-10-25
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateLeaveRequestStatus } from '@/lib/services/unified-request-service'
import { createNotification } from '@/lib/services/notification-service'
import { z } from 'zod'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { invalidateRequestCaches } from '@/lib/services/cache-invalidation-helper'

// Request schema validation
const ReviewSchema = z.object({
  status: z.enum(['APPROVED', 'DENIED'], {
    message: 'Status must be APPROVED or DENIED',
  }),
  comments: z.string().max(500).optional(),
})

export const PUT = createAdminRoute(
  {
    operation: 'updateLeaveRequestStatus',
    endpoint: '/api/leave-requests/[id]/review',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  async ({ request, params, admin }) => {
    // Get request ID from params
    const { id: requestId } = params

    // Parse and validate request body
    const body = await request.json()
    const validationResult = ReviewSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { status, comments } = validationResult.data

    // Update leave request status using service function
    const result = await updateLeaveRequestStatus(requestId, status, admin.userId, comments)

    // Fetch the leave request details to get pilot information
    const supabase = createAdminClient()
    const { data: leaveRequest } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('id', requestId)
      .eq('request_category', 'LEAVE')
      .single()

    // Create notification for pilot if they have start/end dates
    if (leaveRequest?.pilot_user_id && leaveRequest.start_date && leaveRequest.end_date) {
      const notificationTitle =
        status === 'APPROVED' ? '✅ Leave Request Approved' : '❌ Leave Request Denied'

      const startDate = new Date(leaveRequest.start_date).toLocaleDateString()
      const endDate = new Date(leaveRequest.end_date).toLocaleDateString()

      const notificationMessage =
        status === 'APPROVED'
          ? `Your ${leaveRequest.request_type || 'leave'} from ${startDate} to ${endDate} has been approved.${comments ? ` Comment: ${comments}` : ''}`
          : `Your ${leaveRequest.request_type || 'leave'} from ${startDate} to ${endDate} has been denied.${comments ? ` Reason: ${comments}` : ''}`

      await createNotification({
        userId: leaveRequest.pilot_user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'APPROVED' ? 'leave_request_approved' : 'leave_request_rejected',
        link: '/portal/leave-requests',
      }).catch((err) => {
        // Log error but don't fail the request
        console.error('Failed to create notification:', err)
      })
    }

    // Revalidate cache for all affected paths
    await invalidateRequestCaches().catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json(
      {
        success: true,
        message: `Leave request ${status.toLowerCase()} successfully`,
        requestId: result.data?.id ?? requestId,
      },
      { status: 200 }
    )
  }
)
