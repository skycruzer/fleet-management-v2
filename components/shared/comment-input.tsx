/**
 * Comment Input Component
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Facebook-style comment input with avatar and submit button.
 * Used for adding comments to feedback posts.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentInputProps {
  /** Placeholder text */
  placeholder?: string
  /** User's display name for avatar */
  userName?: string
  /** Whether submission is in progress */
  isSubmitting?: boolean
  /** Callback when comment is submitted */
  onSubmit: (content: string) => Promise<void>
  /** Optional parent comment ID for replies */
  parentCommentId?: string | null
  /** Whether to auto-focus the input */
  autoFocus?: boolean
  /** Optional callback when cancelled (for reply mode) */
  onCancel?: () => void
  /** Additional CSS classes */
  className?: string
}

export function CommentInput({
  placeholder = 'Write a comment...',
  userName,
  isSubmitting = false,
  onSubmit,
  parentCommentId,
  autoFocus = false,
  onCancel,
  className,
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus when in reply mode
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [content])

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    try {
      await onSubmit(content.trim())
      setContent('')
      // Reset height after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    // Cancel on Escape (for reply mode)
    if (e.key === 'Escape' && onCancel) {
      onCancel()
    }
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

  const isReplyMode = !!parentCommentId

  return (
    <div className={cn('flex items-start gap-3', className)}>
      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-medium text-white',
          isReplyMode ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm',
          'bg-primary/80'
        )}
      >
        {getInitials(userName)}
      </div>

      {/* Input Container */}
      <div className="flex-1">
        <div className="bg-muted/50 focus-within:bg-muted relative rounded-2xl transition-colors">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            rows={1}
            className={cn(
              'min-h-[40px] resize-none border-0 bg-transparent pr-12 focus-visible:ring-0',
              isReplyMode ? 'py-2 text-sm' : 'py-2.5'
            )}
            maxLength={2000}
          />

          {/* Submit Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className={cn(
              'absolute top-1/2 right-1 -translate-y-1/2',
              isReplyMode ? 'h-7 w-7' : 'h-8 w-8',
              content.trim() && !isSubmitting
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground'
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Reply mode actions */}
        {isReplyMode && onCancel && (
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Cancel
            </button>
            <span className="text-muted-foreground text-xs">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
