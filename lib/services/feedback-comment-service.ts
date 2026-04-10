/**
 * Feedback Comment Service
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Service layer for feedback comments enabling Facebook-style threaded conversations.
 * Supports both pilot and admin comment operations.
 *
 * NOTE: After running the migration 20260129000001_create_feedback_comments_table.sql,
 * run `npm run db:types` to generate TypeScript types for the feedback_comments table.
 * Until then, this service uses type assertions for database operations.
 *
 * @architecture Service Layer Pattern
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAllAdmins } from '@/lib/services/notification-service'
import { logger } from '@/lib/services/logging-service'

// ============================================================================
// Type Definitions
// ============================================================================

export type UserType = 'pilot' | 'admin'

export interface FeedbackComment {
  id: string
  feedback_id: string
  user_id: string
  user_type: UserType
  content: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  author?: {
    name: string
    avatar_url?: string | null
    role?: string
  }
  replies?: FeedbackComment[]
}

export interface CreateCommentInput {
  feedback_id: string
  user_id: string
  user_type: UserType
  content: string
  parent_comment_id?: string | null
}

export interface UpdateCommentInput {
  content: string
}

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// Database row type (matches the migration schema)
interface FeedbackCommentRow {
  id: string
  feedback_id: string
  user_id: string
  user_type: string
  content: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Comment Operations
// ============================================================================

/**
 * Create a new comment on feedback
 *
 * @param input - Comment creation data
 * @returns Created comment with author info
 */
export async function createFeedbackComment(
  input: CreateCommentInput
): Promise<ServiceResponse<FeedbackComment>> {
  const supabase = createAdminClient()

  try {
    // Validate content
    if (!input.content || input.content.trim().length === 0) {
      return {
        success: false,
        error: 'Comment content is required',
      }
    }

    if (input.content.length > 2000) {
      return {
        success: false,
        error: 'Comment must be 2000 characters or less',
      }
    }

    // Verify feedback exists
    const { data: feedback, error: feedbackError } = await supabase
      .from('pilot_feedback')
      .select('id, pilot_id, subject, is_anonymous')
      .eq('id', input.feedback_id)
      .single()

    if (feedbackError || !feedback) {
      return {
        success: false,
        error: 'Feedback not found',
      }
    }

    // Verify parent comment exists if specified
    if (input.parent_comment_id) {
      // Use type assertion until db:types is regenerated
      const { data: parentComment, error: parentError } = await (supabase as any)
        .from('feedback_comments')
        .select('id, feedback_id')
        .eq('id', input.parent_comment_id)
        .single()

      if (parentError || !parentComment) {
        return {
          success: false,
          error: 'Parent comment not found',
        }
      }

      // Ensure parent comment belongs to same feedback
      if (parentComment.feedback_id !== input.feedback_id) {
        return {
          success: false,
          error: 'Parent comment must belong to the same feedback',
        }
      }
    }

    // Insert comment - use type assertion until db:types is regenerated
    const { data: comment, error: insertError } = await (supabase as any)
      .from('feedback_comments')
      .insert({
        feedback_id: input.feedback_id,
        user_id: input.user_id,
        user_type: input.user_type,
        content: input.content.trim(),
        parent_comment_id: input.parent_comment_id || null,
      })
      .select()
      .single()

    if (insertError) {
      await logger.error('Failed to create feedback comment', {
        source: 'feedback-comment-service:createFeedbackComment',
        error: insertError.message,
        input,
      })
      return {
        success: false,
        error: 'Failed to create comment',
      }
    }

    // Notify admins if pilot added a comment (they may need to respond)
    if (input.user_type === 'pilot') {
      notifyAllAdmins(
        'New Comment on Feedback',
        `A pilot replied to feedback: "${feedback.subject}"`,
        'leave_request_submitted', // Using existing enum value
        '/dashboard/feedback'
      ).catch((err) => console.error('Failed to notify admins:', err))
    }

    return {
      success: true,
      data: comment as FeedbackComment,
    }
  } catch (error) {
    await logger.error('Failed to create feedback comment', {
      source: 'feedback-comment-service:createFeedbackComment',
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: 'Failed to create comment',
    }
  }
}

/**
 * Get all comments for a feedback item
 *
 * Returns comments in a threaded structure with author information
 *
 * @param feedbackId - Feedback ID
 * @returns Array of comments with nested replies
 */
export async function getFeedbackComments(
  feedbackId: string
): Promise<ServiceResponse<FeedbackComment[]>> {
  const supabase = createAdminClient()

  try {
    // Fetch all comments for this feedback - use type assertion until db:types is regenerated
    const { data: comments, error } = await (supabase as any)
      .from('feedback_comments')
      .select('*')
      .eq('feedback_id', feedbackId)
      .order('created_at', { ascending: true })

    if (error) {
      await logger.error('Failed to fetch feedback comments', {
        source: 'feedback-comment-service:getFeedbackComments',
        error: error.message,
        feedbackId,
      })
      return {
        success: false,
        error: 'Failed to fetch comments',
      }
    }

    if (!comments || comments.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    const typedComments = comments as FeedbackCommentRow[]

    // Fetch author info for all unique user IDs
    const userIds = [...new Set(typedComments.map((c) => c.user_id))]
    const authorMap = new Map<string, FeedbackComment['author']>()

    // Fetch admin authors
    const { data: admins } = await supabase
      .from('an_users')
      .select('id, name, role')
      .in('id', userIds)
      .eq('role', 'admin')

    if (admins) {
      admins.forEach((admin) => {
        authorMap.set(admin.id, {
          name: admin.name || 'Admin',
          role: 'Admin',
        })
      })
    }

    // Fetch pilot authors (from pilots table via an_users)
    const { data: pilotUsers } = (await supabase
      .from('an_users')
      .select('id, pilot_id, pilots!inner(first_name, last_name, role)')
      .in('id', userIds)
      .not('pilot_id', 'is', null)) as any

    if (pilotUsers) {
      pilotUsers.forEach((pu: any) => {
        if (pu.pilots) {
          authorMap.set(pu.id, {
            name: `${pu.pilots.first_name} ${pu.pilots.last_name}`,
            role: pu.pilots.role,
          })
        }
      })
    }

    // Add author info to comments
    const commentsWithAuthors: FeedbackComment[] = typedComments.map((comment) => ({
      id: comment.id,
      feedback_id: comment.feedback_id,
      user_id: comment.user_id,
      user_type: comment.user_type as UserType,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: authorMap.get(comment.user_id) || { name: 'Unknown User' },
    }))

    // Build threaded structure
    const threadedComments = buildCommentTree(commentsWithAuthors)

    return {
      success: true,
      data: threadedComments,
    }
  } catch (error) {
    await logger.error('Failed to fetch feedback comments', {
      source: 'feedback-comment-service:getFeedbackComments',
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: 'Failed to fetch comments',
    }
  }
}

/**
 * Build a tree structure from flat comment array
 *
 * @param comments - Flat array of comments with parent_comment_id
 * @returns Array of top-level comments with nested replies
 */
function buildCommentTree(comments: FeedbackComment[]): FeedbackComment[] {
  const commentMap = new Map<string, FeedbackComment>()
  const topLevelComments: FeedbackComment[] = []

  // First pass: index all comments
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree
  comments.forEach((comment) => {
    const mappedComment = commentMap.get(comment.id)!
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id)
      if (parent && parent.replies) {
        parent.replies.push(mappedComment)
      }
    } else {
      topLevelComments.push(mappedComment)
    }
  })

  return topLevelComments
}

/**
 * Get a single comment by ID
 *
 * @param commentId - Comment ID
 * @returns Comment with author info
 */
export async function getFeedbackCommentById(
  commentId: string
): Promise<ServiceResponse<FeedbackComment>> {
  const supabase = createAdminClient()

  try {
    // Use type assertion until db:types is regenerated
    const { data: comment, error } = await (supabase as any)
      .from('feedback_comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (error || !comment) {
      return {
        success: false,
        error: 'Comment not found',
      }
    }

    const typedComment = comment as FeedbackCommentRow

    return {
      success: true,
      data: {
        id: typedComment.id,
        feedback_id: typedComment.feedback_id,
        user_id: typedComment.user_id,
        user_type: typedComment.user_type as UserType,
        content: typedComment.content,
        parent_comment_id: typedComment.parent_comment_id,
        created_at: typedComment.created_at,
        updated_at: typedComment.updated_at,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch comment',
    }
  }
}

/**
 * Update a comment's content
 *
 * Only allowed within 15 minutes of creation and by the original author
 *
 * @param commentId - Comment ID
 * @param userId - User ID (must match original author)
 * @param updates - Updated content
 * @returns Updated comment
 */
export async function updateFeedbackComment(
  commentId: string,
  userId: string,
  updates: UpdateCommentInput
): Promise<ServiceResponse<FeedbackComment>> {
  const supabase = createAdminClient()

  try {
    // Validate content
    if (!updates.content || updates.content.trim().length === 0) {
      return {
        success: false,
        error: 'Comment content is required',
      }
    }

    if (updates.content.length > 2000) {
      return {
        success: false,
        error: 'Comment must be 2000 characters or less',
      }
    }

    // Fetch existing comment - use type assertion
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('feedback_comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Comment not found',
      }
    }

    const typedExisting = existing as FeedbackCommentRow

    // Verify ownership
    if (typedExisting.user_id !== userId) {
      return {
        success: false,
        error: 'You can only edit your own comments',
      }
    }

    // Check time window (15 minutes)
    const createdAt = new Date(typedExisting.created_at)
    const now = new Date()
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)

    if (minutesSinceCreation > 15) {
      return {
        success: false,
        error: 'Comments can only be edited within 15 minutes of posting',
      }
    }

    // Update comment - use type assertion
    const { data: updated, error: updateError } = await (supabase as any)
      .from('feedback_comments')
      .update({
        content: updates.content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update comment',
      }
    }

    const typedUpdated = updated as FeedbackCommentRow

    return {
      success: true,
      data: {
        id: typedUpdated.id,
        feedback_id: typedUpdated.feedback_id,
        user_id: typedUpdated.user_id,
        user_type: typedUpdated.user_type as UserType,
        content: typedUpdated.content,
        parent_comment_id: typedUpdated.parent_comment_id,
        created_at: typedUpdated.created_at,
        updated_at: typedUpdated.updated_at,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update comment',
    }
  }
}

/**
 * Delete a comment
 *
 * Authors can delete within 15 minutes; admins can delete any comment
 *
 * @param commentId - Comment ID
 * @param userId - User ID
 * @param isAdmin - Whether the user is an admin
 * @returns Success/failure result
 */
export async function deleteFeedbackComment(
  commentId: string,
  userId: string,
  isAdmin: boolean
): Promise<ServiceResponse> {
  const supabase = createAdminClient()

  try {
    // Fetch existing comment - use type assertion
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('feedback_comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Comment not found',
      }
    }

    const typedExisting = existing as FeedbackCommentRow

    // Non-admin users can only delete their own comments within 15 minutes
    if (!isAdmin) {
      if (typedExisting.user_id !== userId) {
        return {
          success: false,
          error: 'You can only delete your own comments',
        }
      }

      const createdAt = new Date(typedExisting.created_at)
      const now = new Date()
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)

      if (minutesSinceCreation > 15) {
        return {
          success: false,
          error: 'Comments can only be deleted within 15 minutes of posting',
        }
      }
    }

    // Delete comment (cascade will delete replies) - use type assertion
    const { error: deleteError } = await (supabase as any)
      .from('feedback_comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      return {
        success: false,
        error: 'Failed to delete comment',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to delete comment',
    }
  }
}

/**
 * Get comment count for a feedback item
 *
 * @param feedbackId - Feedback ID
 * @returns Comment count
 */
export async function getFeedbackCommentCount(
  feedbackId: string
): Promise<ServiceResponse<number>> {
  const supabase = createAdminClient()

  try {
    // Use type assertion until db:types is regenerated
    const { count, error } = await (supabase as any)
      .from('feedback_comments')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_id', feedbackId)

    if (error) {
      return {
        success: false,
        error: 'Failed to count comments',
      }
    }

    return {
      success: true,
      data: count || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to count comments',
    }
  }
}
