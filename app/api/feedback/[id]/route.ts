/**
 * Admin Feedback Detail API Endpoint
 *
 * Handles admin operations for individual pilot feedback items.
 *
 * @route GET /api/feedback/[id] - Get feedback details
 * @route PUT /api/feedback/[id] - Update feedback (status or add response)
 * @auth Admin Supabase Authentication
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import {
  getFeedbackById,
  updateFeedbackStatus,
  addAdminResponse,
} from '@/lib/services/feedback-service'
import { verifyRequestAuthorization, ResourceType } from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/feedback/[id]
 *
 * Returns single feedback submission with full details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('❌ [API] Error in GET /api/feedback/[id]:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getFeedbackById',
      feedbackId: (await context.params).id,
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PUT /api/feedback/[id]
 *
 * Updates feedback item - either status or admin response
 *
 * Body:
 * - { status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' } - Update status
 * - { adminResponse: string } - Add admin response (also sets status to REVIEWED)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const { id } = await context.params

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // AUTHORIZATION: Verify user can update this feedback (Admin/Manager only)
    const authResult = await verifyRequestAuthorization(request, ResourceType.FEEDBACK, id)

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    // Parse request body
    const body = await request.json()

    // Handle admin response
    if (body.adminResponse) {
      const result = await addAdminResponse(id, body.adminResponse)

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
  } catch (error) {
    console.error('❌ [API] Error in PUT /api/feedback/[id]:', error)
    const sanitized = sanitizeError(error, {
      operation: 'updateFeedback',
      feedbackId: (await context.params).id,
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
