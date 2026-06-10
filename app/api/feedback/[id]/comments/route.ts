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
 *
 * @version 2.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
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
export const GET = createAdminRoute(
  {
    operation: 'getFeedbackComments',
    endpoint: '/api/feedback/[id]/comments',
    rateLimit: false,
  },
  async ({ params }) => {
    try {
      const { id: feedbackId } = params

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
)

/**
 * POST /api/feedback/[id]/comments
 *
 * Create a new comment on feedback (admin)
 */
export const POST = createAdminRoute(
  {
    operation: 'createFeedbackComment',
    endpoint: '/api/feedback/[id]/comments',
    rateLimit: false,
  },
  async ({ request, params, admin }) => {
    try {
      const { id: feedbackId } = params

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
        user_id: admin.userId,
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
)

/**
 * PATCH /api/feedback/[id]/comments
 *
 * Update a comment (admin)
 */
export const PATCH = createAdminRoute(
  {
    operation: 'updateFeedbackComment',
    endpoint: '/api/feedback/[id]/comments',
    rateLimit: false,
  },
  async ({ request, admin }) => {
    try {
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
      const result = await updateFeedbackComment(validation.data.comment_id, admin.userId, {
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
)

/**
 * DELETE /api/feedback/[id]/comments
 *
 * Delete a comment (admin)
 */
export const DELETE = createAdminRoute(
  {
    operation: 'deleteFeedbackComment',
    endpoint: '/api/feedback/[id]/comments',
    rateLimit: false,
  },
  async ({ request, admin }) => {
    try {
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
        admin.userId,
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
)
