/**
 * Optimistic Feedback Form Example
 * Demonstrates optimistic updates for feedback submissions
 *
 * Features:
 * - Instant visual feedback on vote
 * - Optimistic form submission
 * - Success toast with rollback capability
 * - Error handling
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react'

interface FeedbackItem {
  id: string
  title: string
  content: string
  upvotes: number
  downvotes: number
  userVote: 'up' | 'down' | null
}

interface OptimisticFeedbackExampleProps {
  initialFeedback: FeedbackItem[]
}

export function OptimisticFeedbackExample({ initialFeedback }: OptimisticFeedbackExampleProps) {
  const router = useRouter()

  // Optimistic feedback state
  const [optimisticFeedback, setOptimisticFeedback] = useOptimistic(
    initialFeedback,
    (state: FeedbackItem[], update: { id: string; action: 'upvote' | 'downvote' | 'remove-vote' }) => {
      return state.map((item) => {
        if (item.id !== update.id) return item

        const currentVote = item.userVote

        switch (update.action) {
          case 'upvote':
            if (currentVote === 'up') {
              // Remove upvote
              return { ...item, upvotes: item.upvotes - 1, userVote: null }
            } else if (currentVote === 'down') {
              // Change from downvote to upvote
              return {
                ...item,
                upvotes: item.upvotes + 1,
                downvotes: item.downvotes - 1,
                userVote: 'up' as const,
              }
            } else {
              // Add upvote
              return { ...item, upvotes: item.upvotes + 1, userVote: 'up' as const }
            }

          case 'downvote':
            if (currentVote === 'down') {
              // Remove downvote
              return { ...item, downvotes: item.downvotes - 1, userVote: null }
            } else if (currentVote === 'up') {
              // Change from upvote to downvote
              return {
                ...item,
                upvotes: item.upvotes - 1,
                downvotes: item.downvotes + 1,
                userVote: 'down' as const,
              }
            } else {
              // Add downvote
              return { ...item, downvotes: item.downvotes + 1, userVote: 'down' as const }
            }

          case 'remove-vote':
            if (currentVote === 'up') {
              return { ...item, upvotes: item.upvotes - 1, userVote: null }
            } else if (currentVote === 'down') {
              return { ...item, downvotes: item.downvotes - 1, userVote: null }
            }
            return item

          default:
            return item
        }
      })
    }
  )

  // Handle vote with optimistic update
  const handleVote = async (feedbackId: string, voteType: 'upvote' | 'downvote') => {
    // Apply optimistic update immediately
    setOptimisticFeedback({ id: feedbackId, action: voteType })

    try {
      // Send vote to server
      const response = await fetch(`/api/feedback/${feedbackId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteType }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      // Vote recorded successfully
      console.log('Vote recorded successfully')
    } catch (error) {
      // Rollback happens automatically via useOptimistic
      console.error('Vote failed:', error)

      // Revalidate to ensure data consistency
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Optimistic Feedback Voting Example</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click the thumbs up or down buttons to vote. The UI updates instantly without waiting
            for the server. If the server request fails, the vote is automatically rolled back.
          </p>
        </CardContent>
      </Card>

      {optimisticFeedback.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {/* Vote Buttons */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant={item.userVote === 'up' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVote(item.id, 'upvote')}
                  className="w-12"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium tabular-nums">{item.upvotes}</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  variant={item.userVote === 'down' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVote(item.id, 'downvote')}
                  className="w-12"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium tabular-nums">{item.downvotes}</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.content}</p>

                {/* Vote Status Indicator */}
                {item.userVote && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    You voted {item.userVote === 'up' ? 'up' : 'down'}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
