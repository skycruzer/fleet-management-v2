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
import { Calendar, User, Clock, AlertTriangle, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, getStatusLabel } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { redirect } from 'next/navigation'
import { RequestDetailActions } from '@/components/requests/request-detail-actions'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import { listRequestDocuments } from '@/lib/services/pilot-document-service'
import {
  getSignedUrlForBucket,
  extractPathFromSignedUrl,
  MEDICAL_CERTIFICATES_BUCKET,
} from '@/lib/services/file-upload-service'
import { formatFileSize } from '@/lib/validations/file-upload-schema'

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

  // Attachments: pilot_documents rows linked to this request, with fresh
  // signed URLs (stored URLs expire — always re-sign from the path).
  const documentsResult = await listRequestDocuments(request.id)
  const requestDocuments = documentsResult.success ? (documentsResult.data ?? []) : []
  const attachments = (
    await Promise.all(
      requestDocuments.map(async (doc) => ({
        id: doc.id,
        name: doc.title || doc.file_name,
        size: doc.file_size,
        url: await getSignedUrlForBucket(doc.storage_bucket, doc.file_path),
      }))
    )
  ).filter((a) => a.url)

  // Legacy single-attachment fallback (pre-pilot_documents requests stored a
  // signed URL in source_attachment_url; re-sign its extracted path)
  if (attachments.length === 0 && request.source_attachment_url) {
    const legacyPath = extractPathFromSignedUrl(request.source_attachment_url)
    if (legacyPath) {
      const url = await getSignedUrlForBucket(MEDICAL_CERTIFICATES_BUCKET, legacyPath)
      if (url) {
        attachments.push({
          id: 'legacy',
          name: legacyPath.split('/').pop() || 'Medical certificate',
          size: 0,
          url,
        })
      }
    }
  }

  // Format functions
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryBadgeClass = (category: string) => {
    const classes: Record<string, string> = {
      LEAVE: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
      FLIGHT: 'bg-[var(--color-badge-purple-bg)] text-[var(--color-badge-purple)]',
      LEAVE_BID: 'bg-[var(--color-success-muted)] text-[var(--color-success-muted-foreground)]',
    }
    return classes[category] || 'bg-muted/60 text-muted-foreground'
  }

  // Human-readable labels for raw DB enum values (fall back to title-casing)
  const CATEGORY_LABELS: Record<string, string> = {
    LEAVE: 'Leave',
    FLIGHT: 'RDO/SDO',
    LEAVE_BID: 'Leave Bid',
  }
  const REQUEST_TYPE_LABELS: Record<string, string> = {
    RDO: 'RDO',
    SDO: 'SDO',
    FLIGHT_REQUEST: 'RDO/SDO Request',
    LSL: 'Long Service Leave',
    LWOP: 'Leave Without Pay',
  }
  const formatCategory = (category: string | null) =>
    category ? (CATEGORY_LABELS[category] ?? getStatusLabel(category)) : 'N/A'
  const formatRequestType = (type: string | null) =>
    type ? (REQUEST_TYPE_LABELS[type] ?? getStatusLabel(type)) : 'N/A'
  const formatChannel = (channel: string | null) => (channel ? getStatusLabel(channel) : 'N/A')

  const pilotName = request.pilot ? `${request.pilot.first_name} ${request.pilot.last_name}` : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={
          pilotName
            ? `${pilotName} — ${formatRequestType(request.request_type)}`
            : 'Request Details'
        }
        breadcrumbs={[
          { label: 'Requests', href: '/dashboard/requests' },
          { label: 'Request Details' },
        ]}
        actions={<RequestDetailActions request={request} />}
      />

      {/* Status and Category Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={request.workflow_status || 'SUBMITTED'} />
        <Badge className={getCategoryBadgeClass(request.request_category)}>
          {formatCategory(request.request_category)}
        </Badge>
        {request.is_late_request && (
          <Badge
            variant="outline"
            className="border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] text-[var(--color-warning-muted-foreground)]"
          >
            <Clock className="mr-1 h-3 w-3" />
            Late Request
          </Badge>
        )}
        {request.is_past_deadline && (
          <Badge
            variant="outline"
            className="border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] text-[var(--color-destructive-muted-foreground)]"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Past Deadline
          </Badge>
        )}
        <span className="text-muted-foreground font-mono text-xs">
          Request ID: {request.id.substring(0, 8)}...
        </span>
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
                  <p className="text-lg font-semibold">{formatRequestType(request.request_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Category</p>
                  <p className="text-lg font-semibold">
                    {formatCategory(request.request_category)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Submission Channel</p>
                  <p className="text-lg">{formatChannel(request.submission_channel)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Submission Date</p>
                  <p className="text-lg">
                    {formatDate(request.submission_date || request.created_at)}
                  </p>
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

          {/* Attachments (sick-leave medical certificates, supporting documents) */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {attachments.map((attachment) => (
                    <li key={attachment.id} className="flex items-center gap-2 text-sm">
                      <a
                        href={attachment.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium hover:underline"
                      >
                        {attachment.name}
                      </a>
                      {attachment.size > 0 && (
                        <span className="text-muted-foreground text-xs">
                          ({formatFileSize(attachment.size)})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground mt-3 text-xs">
                  Links expire after 1 hour — refresh the page for new links.
                </p>
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
                      className="w-full justify-start border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] text-[var(--color-warning-muted-foreground)]"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      Late Request (&lt;21 days notice)
                    </Badge>
                  )}
                  {request.is_past_deadline && (
                    <Badge
                      variant="outline"
                      className="w-full justify-start border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] text-[var(--color-destructive-muted-foreground)]"
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
