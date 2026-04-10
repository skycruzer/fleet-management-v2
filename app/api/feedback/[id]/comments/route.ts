/**
 * Admin Feedback Comments API Route
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Handles CRUD operations for feedback comments from the admin dashboard.
 *
 * @route GET /api/feedback/[id]/comments - Get all comments for feedback
 * @route POST /api/feedback/[id]/comments - Add new comment
 * @route PATCH /api/feedback/[id]/comments - Update comment
 * @route DELETE /api/feedback/[id]/comments - Delete comment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import {
  createFeedbackComment,
  getFeedbackComments,
  updateFeedbackComment,
  deleteFeedbackComment,
} from '@/lib/services/feedback-comment-service'
import { z } from 'zod'

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
 * GET /api/feedback/[id]/comments
 *
 * Get all comments for a feedback item
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: feedbackId } = await params

    // Verify admin authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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
    console.error('GET feedback comments error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/feedback/[id]/comments
 *
 * Create a new comment on feedback (admin)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: feedbackId } = await params

    // Verify admin authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    // Create comment
    const result = await createFeedbackComment({
      feedback_id: feedbackId,
      user_id: auth.userId,
      user_type: 'admin',
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
    console.error('POST feedback comment error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/feedback/[id]/comments
 *
 * Update a comment (admin)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated || !auth.userId) {
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

    // Update comment
    const result = await updateFeedbackComment(validation.data.comment_id, auth.userId, {
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
    console.error('PATCH feedback comment error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/feedback/[id]/comments
 *
 * Delete a comment (admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated || !auth.userId) {
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

    // Delete comment (admin can delete any comment)
    const result = await deleteFeedbackComment(
      validation.data.comment_id,
      auth.userId,
      true // isAdmin
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE feedback comment error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
