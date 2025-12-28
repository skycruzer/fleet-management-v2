/**
 * Leave Request Review API
 * API endpoint for approving or denying leave requests
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PUT method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 * @since 2025-10-25
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateLeaveRequestStatus } from '@/lib/services/unified-request-service'
import { createNotification } from '@/lib/services/notification-service'
import { z } from 'zod'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'

// Request schema validation
const ReviewSchema = z.object({
  status: z.enum(['APPROVED', 'DENIED'], {
    message: 'Status must be APPROVED or DENIED',
  }),
  comments: z.string().max(500).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request ID from params
    const { id: requestId } = await params

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
    const result = await updateLeaveRequestStatus(requestId, status, user.id, comments)

    // Fetch the leave request details to get pilot information
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
    revalidatePath('/dashboard/leave')
    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard')
    revalidatePath('/portal/leave-requests')

    return NextResponse.json(
      {
        success: true,
        message: `Leave request ${status.toLowerCase()} successfully`,
        requestId: result.data?.id ?? requestId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error reviewing leave request:', error)
    const { id: requestId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'updateLeaveRequestStatus',
      resourceId: requestId,
      endpoint: '/api/leave-requests/[id]/review',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
