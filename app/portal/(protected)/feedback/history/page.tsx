/**
 * Feedback History Page
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Facebook-style feed displaying all feedback submissions from the authenticated pilot.
 * Features threaded comments for conversations with admins.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageBreadcrumbs } from '@/components/navigation/page-breadcrumbs'
import { FeedbackPost, type FeedbackPostData } from '@/components/shared/feedback-post'

interface PilotSession {
  id: string
  pilot_id: string
  employee_id?: string
  first_name?: string
  last_name?: string
}

interface Feedback {
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
}

export default function FeedbackHistoryPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [pilotSession, setPilotSession] = useState<PilotSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Fetch pilot session info
  const fetchPilotSession = useCallback(async () => {
    try {
      const response = await fetch('/api/portal/session')
      const result = await response.json()

      if (response.ok && result.success && result.data) {
        setPilotSession(result.data)
      }
    } catch (err) {
      console.error('Error fetching pilot session:', err)
    }
  }, [])

  // Fetch feedback history
  const fetchFeedbackHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/portal/feedback')
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to fetch feedback history')
        setIsLoading(false)
        return
      }

      setFeedback(result.data || [])
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching feedback:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    Promise.all([fetchPilotSession(), fetchFeedbackHistory()])
  }, [fetchPilotSession, fetchFeedbackHistory])

  // Convert Feedback to FeedbackPostData
  function convertToPostData(item: Feedback): FeedbackPostData {
    return {
      id: item.id,
      pilot_id: item.pilot_id,
      category: item.category,
      subject: item.subject,
      message: item.message,
      is_anonymous: item.is_anonymous,
      status: item.status,
      admin_response: item.admin_response,
      responded_by: item.responded_by,
      responded_at: item.responded_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      pilot: pilotSession
        ? {
            first_name: pilotSession.first_name || 'Unknown',
            last_name: pilotSession.last_name || '',
            role: 'Pilot',
          }
        : null,
    }
  }

  // Get pilot's display name
  const pilotName = pilotSession
    ? `${pilotSession.first_name || ''} ${pilotSession.last_name || ''}`.trim() || 'Pilot'
    : 'Pilot'

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-muted-foreground text-sm">Loading feedback history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="px-8 pt-6">
        <PageBreadcrumbs rootPath="portal" />
      </div>
      {/* Page Header */}
      <div className="bg-card border-border border-b px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-primary h-8 w-8" />
            <div>
              <h1 className="text-foreground text-2xl font-bold">Feedback History</h1>
              <p className="text-muted-foreground text-sm">
                View your feedback and conversations with fleet management
              </p>
            </div>
          </div>
          <Link href="/portal/feedback">
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              New Feedback
            </Button>
          </Link>
        </div>
      </div>

      <main className="px-8 py-8">
        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Feedback</p>
                  <p className="text-foreground text-3xl font-bold">{feedback.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-[var(--color-primary-500)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pending Response</p>
                  <p className="text-foreground text-3xl font-bold">
                    {
                      feedback.filter((f) => f.status === 'PENDING' || f.status === 'REVIEWED')
                        .length
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-[var(--color-warning-500)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Resolved</p>
                  <p className="text-foreground text-3xl font-bold">
                    {feedback.filter((f) => f.status === 'RESOLVED').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-[var(--color-success-500)]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-semibold">
                No Feedback Submitted Yet
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                You haven't submitted any feedback. Share your thoughts and suggestions!
              </p>
              <Link href="/portal/feedback">
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Submit Feedback
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <FeedbackPost
                key={item.id}
                feedback={convertToPostData(item)}
                currentUserId={pilotSession?.id || ''}
                currentUserName={pilotName}
                isAdmin={false}
                showIdentity={!item.is_anonymous}
                commentsApiPath="/api/portal/feedback"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
