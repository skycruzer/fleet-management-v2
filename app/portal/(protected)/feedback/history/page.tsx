/**
 * Feedback History Page
 *
 * Developer: Maurice Rondeau
 *
 * Displays all feedback submissions from the authenticated pilot
 * Features:
 * - View past feedback with status
 * - See admin responses
 * - Filter by status/category
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Feedback {
  id: string
  category: string
  subject: string
  message: string
  is_anonymous: boolean
  status?: 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED' | null
  admin_response?: string | null
  created_at: string
  updated_at: string | null
}

export default function FeedbackHistoryPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchFeedbackHistory()
  }, [])

  const fetchFeedbackHistory = async () => {
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
  }

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Under Review</Badge>
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge>
      case 'SUBMITTED':
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="mr-1 h-3 w-3" />Submitted</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      Operations: 'bg-blue-100 text-blue-800',
      Training: 'bg-purple-100 text-purple-800',
      Scheduling: 'bg-orange-100 text-orange-800',
      Safety: 'bg-red-100 text-red-800',
      Equipment: 'bg-green-100 text-green-800',
      System: 'bg-cyan-100 text-cyan-800',
      Suggestion: 'bg-pink-100 text-pink-800',
      Other: 'bg-gray-100 text-gray-800',
    }

    return <Badge className={colors[category] || colors.Other}>{category}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading feedback history...</p>
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
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Feedback History</h1>
              <p className="text-sm text-muted-foreground">
                View your past feedback submissions and admin responses
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
                  <p className="text-sm font-medium text-muted-foreground">Total Feedback</p>
                  <p className="text-3xl font-bold text-foreground">{feedback.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                  <p className="text-3xl font-bold text-foreground">
                    {feedback.filter((f) => f.status === 'UNDER_REVIEW').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-3xl font-bold text-foreground">
                    {feedback.filter((f) => f.status === 'RESOLVED').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No Feedback Submitted Yet
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
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
              <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {getCategoryBadge(item.category)}
                        {getStatusBadge(item.status)}
                        {item.is_anonymous && (
                          <Badge variant="outline" className="text-xs">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{item.subject}</CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        Submitted {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-semibold text-foreground">Your Feedback:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>

                  {/* Admin Response */}
                  {item.admin_response && (
                    <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary-600" />
                        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                          Admin Response:
                        </h4>
                      </div>
                      <p className="text-sm text-primary-800 dark:text-primary-200 whitespace-pre-wrap">
                        {item.admin_response}
                      </p>
                      {item.updated_at && (
                        <p className="mt-2 text-xs text-primary-600 dark:text-primary-400">
                          Responded {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* No Response Yet */}
                  {!item.admin_response && item.status !== 'RESOLVED' && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="mr-1 inline h-3 w-3" />
                        Waiting for admin response...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
