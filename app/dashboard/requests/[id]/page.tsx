/**
 * Request Detail Page
 *
 * Displays comprehensive details for a single pilot request with
 * action buttons for status updates and deletion.
 *
 * @author Maurice Rondeau
 * @date November 20, 2025
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { redirect } from 'next/navigation'
import { RequestDetailActions } from '@/components/requests/request-detail-actions'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params

  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Use admin client to bypass RLS (auth already verified above)
  const supabase = createAdminClient()

  // Fetch request details
  const { data: request, error } = await supabase
    .from('pilot_requests')
    .select(
      `
      *,
      pilot:pilots!pilot_requests_pilot_id_fkey (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !request) {
    notFound()
  }

  // Format functions
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      DRAFT: 'bg-muted/60 text-muted-foreground',
      SUBMITTED: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
      IN_REVIEW: 'bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]',
      APPROVED: 'bg-[var(--color-success-muted)] text-[var(--color-success-400)]',
      DENIED: 'bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)]',
      WITHDRAWN: 'bg-muted/60 text-muted-foreground',
    }
    return classes[status] || 'bg-muted/60 text-muted-foreground'
  }

  const getCategoryBadgeClass = (category: string) => {
    const classes: Record<string, string> = {
      LEAVE: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
      FLIGHT: 'bg-[var(--color-badge-purple-bg)] text-[var(--color-badge-purple)]',
      LEAVE_BID: 'bg-[var(--color-success-muted)] text-[var(--color-success-400)]',
    }
    return classes[category] || 'bg-muted/60 text-muted-foreground'
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Request Details</h1>
            <p className="text-muted-foreground">Request ID: {request.id.substring(0, 8)}...</p>
          </div>
        </div>

        <RequestDetailActions request={request} />
      </div>

      {/* Status and Category Badges */}
      <div className="flex gap-3">
        <Badge className={getStatusBadgeClass(request.workflow_status || 'SUBMITTED')}>
          {request.workflow_status || 'SUBMITTED'}
        </Badge>
        <Badge className={getCategoryBadgeClass(request.request_category)}>
          {request.request_category}
        </Badge>
        {request.is_late_request && (
          <Badge
            variant="outline"
            className="border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]"
          >
            <Clock className="mr-1 h-3 w-3" />
            Late Request
          </Badge>
        )}
        {request.is_past_deadline && (
          <Badge
            variant="outline"
            className="border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)]"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Past Deadline
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Request Type</p>
                  <p className="text-lg font-semibold">{request.request_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Category</p>
                  <p className="text-lg font-semibold">{request.request_category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Submission Channel</p>
                  <p className="text-lg">{request.submission_channel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Submission Date</p>
                  <p className="text-lg">{formatDate(request.submission_date || request.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Start Date</p>
                  <p className="text-lg font-semibold">{formatDate(request.start_date)}</p>
                </div>
                {request.end_date && (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">End Date</p>
                    <p className="text-lg font-semibold">{formatDate(request.end_date)}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Roster Period</p>
                  {(() => {
                    const periods =
                      request.start_date && request.end_date
                        ? getAffectedRosterPeriods(
                            new Date(request.start_date),
                            new Date(request.end_date)
                          )
                        : []
                    return (
                      <>
                        <p className="font-mono text-lg">
                          {periods.length > 1
                            ? periods.map((p) => p.code).join(', ')
                            : request.roster_period || (periods[0]?.code ?? 'N/A')}
                        </p>
                        {periods.length > 1 && (
                          <p className="text-muted-foreground text-xs">
                            Spans {periods.length} roster periods
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
                {request.days_count && (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Duration</p>
                    <p className="text-lg">
                      {request.days_count} day{request.days_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reason */}
          {request.reason && (
            <Card>
              <CardHeader>
                <CardTitle>Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{request.reason}</p>
              </CardContent>
            </Card>
          )}

          {/* Review Information */}
          {(request.workflow_status === 'APPROVED' || request.workflow_status === 'DENIED') &&
            request.review_comments && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Comments</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{request.review_comments}</p>
                  </div>
                  {request.reviewed_at && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Reviewed At</p>
                      <p className="mt-1 text-sm">{formatDateTime(request.reviewed_at)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pilot Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Pilot Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.pilot && (
                <>
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Name</p>
                    <p className="text-lg font-semibold">
                      {request.pilot.first_name} {request.pilot.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Rank</p>
                    <p className="text-sm">{request.pilot.role}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Employee Number</p>
                    <p className="font-mono text-sm">{request.pilot.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Seniority</p>
                    <p className="text-sm">#{request.pilot.seniority_number}</p>
                  </div>
                  <Link href={`/dashboard/pilots/${request.pilot.id}`}>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      View Pilot Profile
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Priority and Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Priority & Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Priority Score</p>
                <p className="text-2xl font-bold">{request.priority_score || 0}</p>
              </div>
              {(request.is_late_request || request.is_past_deadline) && (
                <div className="space-y-2">
                  {request.is_late_request && (
                    <Badge
                      variant="outline"
                      className="w-full justify-start border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      Late Request (&lt;21 days notice)
                    </Badge>
                  )}
                  {request.is_past_deadline && (
                    <Badge
                      variant="outline"
                      className="w-full justify-start border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)]"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Past Deadline (After 22-day cutoff)
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground font-medium">Created</p>
                <p>{formatDateTime(request.created_at)}</p>
              </div>
              {request.updated_at && (
                <div>
                  <p className="text-muted-foreground font-medium">Last Updated</p>
                  <p>{formatDateTime(request.updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
