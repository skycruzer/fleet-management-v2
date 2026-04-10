/**
 * Comment Thread Component
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Displays a threaded comment with nested replies.
 * Facebook-style layout with avatars, timestamps, and reply functionality.
 */

'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CommentInput } from './comment-input'
import { cn } from '@/lib/utils'
import type { FeedbackComment } from '@/lib/services/feedback-comment-service'

interface CommentThreadProps {
  /** The comment to display */
  comment: FeedbackComment
  /** Current user's ID */
  currentUserId: string
  /** Whether current user is admin */
  isAdmin?: boolean
  /** Current user's name (for reply input) */
  currentUserName?: string
  /** Callback when a reply is submitted */
  onReply: (content: string, parentCommentId: string) => Promise<void>
  /** Callback when a comment is deleted */
  onDelete?: (commentId: string) => Promise<void>
  /** Callback when a comment is edited */
  onEdit?: (commentId: string, content: string) => Promise<void>
  /** Depth level for nested replies */
  depth?: number
  /** Maximum nesting depth before flattening */
  maxDepth?: number
}

export function CommentThread({
  comment,
  currentUserId,
  isAdmin = false,
  currentUserName,
  onReply,
  onDelete,
  onEdit,
  depth = 0,
  maxDepth = 3,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOwnComment = comment.user_id === currentUserId
  const canEdit = isOwnComment && canStillEdit(comment.created_at)
  const canDelete = isAdmin || (isOwnComment && canStillEdit(comment.created_at))

  // Check if comment is within 15-minute edit window
  function canStillEdit(createdAt: string): boolean {
    const created = new Date(createdAt)
    const now = new Date()
    const minutesElapsed = (now.getTime() - created.getTime()) / (1000 * 60)
    return minutesElapsed <= 15
  }

  // Generate avatar initials
  const getInitials = (name: string | undefined) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleReply = async (content: string) => {
    setIsSubmitting(true)
    try {
      await onReply(content, comment.id)
      setIsReplying(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim() || !onEdit) return
    setIsSubmitting(true)
    try {
      await onEdit(comment.id, editContent.trim())
      setIsEditing(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsSubmitting(true)
    try {
      await onDelete(comment.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine avatar color based on user type
  const avatarColorClass =
    comment.user_type === 'admin' ? 'bg-primary' : 'bg-[var(--color-success-600)]'

  return (
    <div className={cn('flex gap-2', depth > 0 && 'ml-10')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white',
          avatarColorClass
        )}
      >
        {getInitials(comment.author?.name)}
      </div>

      {/* Comment Content */}
      <div className="flex-1">
        {/* Comment Bubble */}
        <div className="bg-muted/50 inline-block max-w-full rounded-2xl px-3 py-2">
          {/* Author Name and Badge */}
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">
              {comment.author?.name || 'Unknown'}
            </span>
            {comment.user_type === 'admin' && (
              <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
                Admin
              </span>
            )}
            {comment.author?.role && comment.user_type === 'pilot' && (
              <span className="text-muted-foreground text-[10px]">{comment.author.role}</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-background w-full rounded border p-2 text-sm"
                rows={2}
                maxLength={2000}
              />
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editContent.trim() || isSubmitting}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-foreground text-sm break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>

        {/* Actions Row */}
        <div className="mt-1 flex items-center gap-3 px-1">
          {/* Timestamp */}
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>

          {/* Reply Button */}
          {depth < maxDepth && (
            <button
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              className="text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              Reply
            </button>
          )}

          {/* Edit indicator */}
          {comment.updated_at !== comment.created_at && (
            <span className="text-muted-foreground text-xs italic">edited</span>
          )}

          {/* More Actions */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground rounded p-0.5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {canEdit && onEdit && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reply Input */}
        {isReplying && (
          <div className="mt-2">
            <CommentInput
              placeholder="Write a reply..."
              userName={currentUserName}
              isSubmitting={isSubmitting}
              onSubmit={handleReply}
              parentCommentId={comment.id}
              autoFocus
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                currentUserName={currentUserName}
                onReply={onReply}
                onDelete={onDelete}
                onEdit={onEdit}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
