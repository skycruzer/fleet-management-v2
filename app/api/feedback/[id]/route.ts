/**
 * Admin Feedback Detail API Endpoint
 *
 * Handles admin operations for individual pilot feedback items.
 *
 * @route GET /api/feedback/[id] - Get feedback details
 * @route PUT /api/feedback/[id] - Update feedback (status or add response)
 * @auth Admin Supabase Authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getFeedbackById,
  updateFeedbackStatus,
  addAdminResponse,
} from '@/lib/services/feedback-service'

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
    console.log(`🌐 [API GET /api/feedback/${id}] Request received`)

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ [API] Unauthorized access attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
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
    const { id } = await context.params
    console.log(`🌐 [API PUT /api/feedback/${id}] Request received`)

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ [API] Unauthorized access attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Handle admin response
    if (body.adminResponse) {
      const result = await addAdminResponse(id, body.adminResponse)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Admin response added successfully',
      })
    }

    // Handle status update
    if (body.status) {
      const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        )
      }

      const result = await updateFeedbackStatus(id, body.status)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
