/**
 * Feedback Post Component
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Facebook-style post card displaying feedback with threaded comments.
 * Used in both admin dashboard and pilot portal.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CommentInput } from './comment-input'
import { CommentThread } from './comment-thread'
import { cn } from '@/lib/utils'
import type { FeedbackComment } from '@/lib/services/feedback-comment-service'

export interface FeedbackPostData {
  id: string
  pilot_id: string
  category: string
  subject: string
  message: string
  is_anonymous: boolean
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
  admin_response?: string | null
  responded_by?: string | null
  responded_at?: string | null
  created_at: string
  updated_at: string
  pilot?: {
    first_name: string
    last_name: string
    role: string
    employee_id?: string
  } | null
}

interface FeedbackPostProps {
  /** The feedback data */
  feedback: FeedbackPostData
  /** Current user's ID */
  currentUserId: string
  /** Whether current user is admin */
  isAdmin?: boolean
  /** Current user's name */
  currentUserName?: string
  /** Whether to show the pilot's identity (false for anonymous) */
  showIdentity?: boolean
  /** API base path for comments */
  commentsApiPath?: string
  /** Callback when status should be updated (admin only) */
  onStatusChange?: (feedbackId: string, status: string) => Promise<void>
  /** Callback when clicking on post (for modal/detail view) */
  onViewDetails?: (feedback: FeedbackPostData) => void
}

export function FeedbackPost({
  feedback,
  currentUserId,
  isAdmin = false,
  currentUserName,
  showIdentity = true,
  commentsApiPath = '/api/feedback',
  onStatusChange,
  onViewDetails,
}: FeedbackPostProps) {
  const [comments, setComments] = useState<FeedbackComment[]>([])
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  // Determine author display
  const authorName =
    feedback.is_anonymous && !isAdmin
      ? 'Anonymous'
      : feedback.pilot
        ? `${feedback.pilot.first_name} ${feedback.pilot.last_name}`
        : 'Unknown Pilot'

  const authorRole = feedback.is_anonymous && !isAdmin ? null : feedback.pilot?.role

  // Fetch comments function
  const fetchComments = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoadingComments(true)
      setCommentError(null)
      try {
        const response = await fetch(`${commentsApiPath}/${feedback.id}/comments`, {
          credentials: 'include',
        })
        const data = await response.json()

        if (data.success) {
          setComments(data.data || [])
        } else {
          setCommentError(data.error || 'Failed to load comments')
        }
      } catch (error) {
        setCommentError('Failed to load comments')
      } finally {
        if (showLoading) setIsLoadingComments(false)
      }
    },
    [commentsApiPath, feedback.id]
  )

  // Fetch comments on mount
  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Auto-expand comments section if there are comments
  useEffect(() => {
    if (comments.length > 0 && !isCommentsOpen) {
      setIsCommentsOpen(true)
    }
  }, [comments.length, isCommentsOpen])

  // Subscribe to real-time comment updates (always active)
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to changes on feedback_comments for this feedback
    const channel = supabase
      .channel(`feedback-comments-${feedback.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'feedback_comments',
          filter: `feedback_id=eq.${feedback.id}`,
        },
        () => {
          // Refresh comments when any change occurs (silent refresh)
          fetchComments(false)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [feedback.id, fetchComments])

  async function handleAddComment(content: string) {
    setIsSubmitting(true)
    setCommentError(null)
    try {
      const response = await fetch(`${commentsApiPath}/${feedback.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        // Refresh comments to get the new one with author info
        await fetchComments()
      } else {
        throw new Error(data.error || 'Failed to add comment')
      }
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Failed to add comment')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReply(content: string, parentCommentId: string) {
    setIsSubmitting(true)
    setCommentError(null)
    try {
      const response = await fetch(`${commentsApiPath}/${feedback.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent_comment_id: parentCommentId }),
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        await fetchComments()
      } else {
        throw new Error(data.error || 'Failed to add reply')
      }
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Failed to add reply')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const response = await fetch(`${commentsApiPath}/${feedback.id}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        await fetchComments()
      } else {
        throw new Error(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Failed to delete comment')
    }
  }

  async function handleEditComment(commentId: string, content: string) {
    try {
      const response = await fetch(`${commentsApiPath}/${feedback.id}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, content }),
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        await fetchComments()
      } else {
        throw new Error(data.error || 'Failed to edit comment')
      }
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Failed to edit comment')
    }
  }

  // Generate avatar initials
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get status badge
  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 text-[var(--color-warning-500)]"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'REVIEWED':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-primary-500)]/30 bg-[var(--color-info-bg)] text-[var(--color-primary-500)]"
          >
            <AlertCircle className="mr-1 h-3 w-3" />
            Reviewed
          </Badge>
        )
      case 'RESOLVED':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-success-500)]/30 bg-[var(--color-success-muted)] text-[var(--color-success-500)]"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        )
      case 'DISMISSED':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-danger-500)]/30 bg-[var(--color-danger-500)]/10 text-[var(--color-danger-500)]"
          >
            Dismissed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get category badge color
  function getCategoryBadge(category: string) {
    const colors: Record<string, string> = {
      GENERAL: 'bg-muted text-muted-foreground border-border',
      OPERATIONS:
        'bg-[var(--color-info-bg)] text-[var(--color-primary-500)] border-[var(--color-primary-500)]/30',
      SAFETY:
        'bg-[var(--color-danger-500)]/10 text-[var(--color-danger-500)] border-[var(--color-danger-500)]/30',
      TRAINING:
        'bg-[var(--color-badge-purple-bg)] text-[var(--color-badge-purple)] border-[var(--color-badge-purple)]/30',
      SCHEDULING:
        'bg-[var(--color-badge-orange-bg)] text-[var(--color-badge-orange)] border-[var(--color-badge-orange)]/30',
      SYSTEM_IT:
        'bg-[var(--color-badge-cyan-bg)] text-[var(--color-badge-cyan)] border-[var(--color-badge-cyan)]/30',
      OTHER: 'bg-muted text-muted-foreground border-border',
    }
    const colorClass = colors[category.toUpperCase()] || colors.OTHER
    return (
      <Badge variant="outline" className={colorClass}>
        {category}
      </Badge>
    )
  }

  const commentCount = comments.length

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Author Avatar */}
          <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-white">
            {getInitials(authorName)}
          </div>

          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-semibold">{authorName}</span>
              {authorRole && <span className="text-muted-foreground text-sm">{authorRole}</span>}
              {feedback.is_anonymous && isAdmin && (
                <Badge variant="outline" className="text-xs">
                  Anonymous
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>{formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}</span>
              <span>·</span>
              {getCategoryBadge(feedback.category)}
            </div>
          </div>

          {/* Status Badge */}
          <div>{getStatusBadge(feedback.status)}</div>
        </div>
      </CardHeader>

      {/* Post Content */}
      <CardContent className="pt-0">
        {/* Subject */}
        <h3
          className={cn(
            'text-foreground mb-2 text-lg font-semibold',
            onViewDetails && 'hover:text-primary cursor-pointer'
          )}
          onClick={() => onViewDetails?.(feedback)}
        >
          {feedback.subject}
        </h3>

        {/* Message */}
        <p className="text-foreground/90 text-sm whitespace-pre-wrap">{feedback.message}</p>

        {/* Legacy B767 Office Response (if exists) */}
        {feedback.admin_response && (
          <div className="border-primary/20 bg-primary/5 mt-4 rounded-lg border p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white">
                A
              </div>
              <span className="text-primary text-sm font-semibold">B767 Office Response</span>
            </div>
            <p className="text-foreground/90 text-sm whitespace-pre-wrap">
              {feedback.admin_response}
            </p>
            {feedback.responded_at && (
              <span className="text-muted-foreground mt-1 block text-xs">
                {formatDistanceToNow(new Date(feedback.responded_at), { addSuffix: true })}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-border my-3 border-t" />

        {/* Comment Toggle */}
        <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between py-1 text-sm"
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {commentCount > 0
                  ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}`
                  : 'Add Comment'}
              </span>
              {isCommentsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-3 space-y-4">
              {/* Error Message */}
              {commentError && (
                <div className="rounded border border-[var(--color-danger-500)]/30 bg-[var(--color-danger-500)]/10 px-3 py-2 text-sm text-[var(--color-danger-500)]">
                  {commentError}
                </div>
              )}

              {/* Loading State */}
              {isLoadingComments && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  Loading comments...
                </div>
              )}

              {/* Comments List */}
              {!isLoadingComments && comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                      currentUserName={currentUserName}
                      onReply={handleReply}
                      onDelete={handleDeleteComment}
                      onEdit={handleEditComment}
                    />
                  ))}
                </div>
              )}

              {/* No Comments */}
              {!isLoadingComments && comments.length === 0 && !commentError && (
                <p className="text-muted-foreground py-2 text-center text-sm">
                  No comments yet. Be the first to comment!
                </p>
              )}

              {/* Add Comment Input */}
              <CommentInput
                placeholder="Write a comment..."
                userName={currentUserName}
                isSubmitting={isSubmitting}
                onSubmit={handleAddComment}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
