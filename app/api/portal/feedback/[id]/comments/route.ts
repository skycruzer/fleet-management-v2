/**
 * Pilot Portal Feedback Comments API Route
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Handles CRUD operations for feedback comments from the pilot portal.
 * Uses pilot portal authentication (Redis session + pilot_users table).
 *
 * @route GET /api/portal/feedback/[id]/comments - Get all comments for feedback
 * @route POST /api/portal/feedback/[id]/comments - Add new comment
 * @route PATCH /api/portal/feedback/[id]/comments - Update comment
 * @route DELETE /api/portal/feedback/[id]/comments - Delete comment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createFeedbackComment,
  getFeedbackComments,
  updateFeedbackComment,
  deleteFeedbackComment,
} from '@/lib/services/feedback-comment-service'
import { z } from 'zod'

/**
 * Verify pilot owns the feedback referenced by feedbackId
 */
async function verifyFeedbackOwnership(feedbackId: string, pilotId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('pilot_feedback')
    .select('pilot_id')
    .eq('id', feedbackId)
    .single()
  return data?.pilot_id === pilotId
}

// Validation schemas
const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  parent_comment_id: z.string().uuid().optional().nullable(),
})

const updateCommentSchema = z.object({
  comment_id: z.string().uuid('Invalid comment ID'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
})

const deleteCommentSchema = z.object({
  comment_id: z.string().uuid('Invalid comment ID'),
})

/**
 * GET /api/portal/feedback/[id]/comments
 *
 * Get all comments for a feedback item
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: feedbackId } = await params

    // Verify pilot portal authentication
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify pilot owns this feedback
    if (pilot.pilot_id && !(await verifyFeedbackOwnership(feedbackId, pilot.pilot_id))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Fetch comments
    const result = await getFeedbackComments(feedbackId)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('GET portal feedback comments error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/portal/feedback/[id]/comments
 *
 * Create a new comment on feedback (pilot)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: feedbackId } = await params

    // Verify pilot portal authentication
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify pilot owns this feedback
    if (pilot.pilot_id && !(await verifyFeedbackOwnership(feedbackId, pilot.pilot_id))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    // Create comment - use pilot.id as user_id
    const result = await createFeedbackComment({
      feedback_id: feedbackId,
      user_id: pilot.id,
      user_type: 'pilot',
      content: validation.data.content,
      parent_comment_id: validation.data.parent_comment_id || null,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('POST portal feedback comment error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/portal/feedback/[id]/comments
 *
 * Update a comment (pilot can only update own comments)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify pilot portal authentication
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    // Update comment (pilot can only update their own)
    const result = await updateFeedbackComment(validation.data.comment_id, pilot.id, {
      content: validation.data.content,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('PATCH portal feedback comment error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/portal/feedback/[id]/comments
 *
 * Delete a comment (pilot can only delete own comments)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify pilot portal authentication
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = deleteCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    // Delete comment (pilot can only delete their own comments - isAdmin = false)
    const result = await deleteFeedbackComment(
      validation.data.comment_id,
      pilot.id,
      false // isAdmin = false, pilots can only delete their own comments
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE portal feedback comment error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
