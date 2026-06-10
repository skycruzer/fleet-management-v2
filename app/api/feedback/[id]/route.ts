/**
 * Admin Feedback Detail API Endpoint
 *
 * Handles admin operations for individual pilot feedback items.
 *
 * @route GET /api/feedback/[id] - Get feedback details
 * @route PUT /api/feedback/[id] - Update feedback (status or add response)
 * @auth Admin Supabase Authentication
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import {
  getFeedbackById,
  updateFeedbackStatus,
  addAdminResponse,
} from '@/lib/services/feedback-service'
// Authorization handled by getAuthenticatedAdmin() - admin users can manage all feedback
import { revalidatePath } from 'next/cache'

/**
 * GET /api/feedback/[id]
 *
 * Returns single feedback submission with full details
 */
export const GET = createAdminRoute(
  {
    operation: 'getFeedbackById',
    endpoint: '/api/feedback/[id]',
    rateLimit: false,
  },
  async ({ params }) => {
    const { id } = params

    const result = await getFeedbackById(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('not found') ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  }
)

/**
 * PUT /api/feedback/[id]
 *
 * Updates feedback item - either status or admin response
 *
 * Body:
 * - { status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' } - Update status
 * - { adminResponse: string } - Add admin response (also sets status to REVIEWED)
 */
export const PUT = createAdminRoute(
  {
    operation: 'updateFeedback',
    endpoint: '/api/feedback/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, params, admin }) => {
    const { id } = params

    // NOTE: Authorization is already verified by getAuthenticatedAdmin() above
    // Admin users can manage all feedback - no ownership check needed

    // Parse request body
    const body = await request.json()

    // Handle admin response
    if (body.adminResponse) {
      const result = await addAdminResponse(id, body.adminResponse, admin.userId)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      // Revalidate cache for all affected paths
      revalidatePath('/dashboard/feedback')
      revalidatePath(`/dashboard/feedback/${id}`)
      revalidatePath('/dashboard')

      return NextResponse.json({
        success: true,
        message: 'Admin response added successfully',
      })
    }

    // Handle status update
    if (body.status) {
      const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 })
      }

      const result = await updateFeedbackStatus(id, body.status)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      // Revalidate cache for all affected paths
      revalidatePath('/dashboard/feedback')
      revalidatePath(`/dashboard/feedback/${id}`)
      revalidatePath('/dashboard')

      return NextResponse.json({
        success: true,
        message: 'Feedback status updated successfully',
      })
    }

    // No valid update provided
    return NextResponse.json(
      { success: false, error: 'No valid update data provided' },
      { status: 400 }
    )
  }
)
