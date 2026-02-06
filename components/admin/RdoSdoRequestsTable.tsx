'use client'

/**
 * RDO/SDO Requests Table Component (Admin)
 *
 * Displays admin table of RDO/SDO requests with filtering and review functionality.
 *
 * @developer Maurice Rondeau
 * @date January 19, 2025
 * @version 3.0.0 - 3-table architecture
 */

import { useState, useMemo } from 'react'
import type { FlightRequest } from '@/lib/services/pilot-flight-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Ban,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

interface FlightRequestsTableProps {
  requests: FlightRequest[]
}

type StatusFilter = 'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'
type TypeFilter = 'all' | 'RDO' | 'SDO'

export default function FlightRequestsTable({ requests }: FlightRequestsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [selectedRequest, setSelectedRequest] = useState<FlightRequest | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'DENIED'>('APPROVED')
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Filter requests based on status and type
  const filteredRequests = useMemo(() => {
    let filtered = requests

    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.workflow_status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((req) => req.request_type === typeFilter)
    }

    return filtered
  }, [requests, statusFilter, typeFilter])

  const handleReview = (request: FlightRequest) => {
    setSelectedRequest(request)
    setIsReviewModalOpen(true)
    setReviewAction('APPROVED')
    setReviewComments('')
    setError('')
  }

  const handleCloseModal = () => {
    setIsReviewModalOpen(false)
    setSelectedRequest(null)
    setReviewAction('APPROVED')
    setReviewComments('')
    setError('')
  }

  const handleSubmitReview = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/admin/rdo-sdo-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          status: reviewAction,
          // reviewed_by is set server-side from authenticated session
          review_comments: reviewComments || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to update request status')
        setIsSubmitting(false)
        return
      }

      // Refresh page to show updated data
      window.location.reload()
    } catch (err) {
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateDaysCount = (request: FlightRequest): number => {
    const start = new Date(request.start_date)
    const end = request.end_date ? new Date(request.end_date) : start
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No RDO/SDO requests yet"
        description="RDO/SDO requests will appear here once submitted."
        variant="compact"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="space-y-3">
        {/* Status Filters */}
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">Status Filter:</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All"
              count={requests.length}
              isActive={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            />
            <FilterButton
              label="Submitted"
              count={requests.filter((r) => r.workflow_status === 'SUBMITTED').length}
              isActive={statusFilter === 'SUBMITTED'}
              onClick={() => setStatusFilter('SUBMITTED')}
            />
            <FilterButton
              label="In Review"
              count={requests.filter((r) => r.workflow_status === 'UNDER_REVIEW').length}
              isActive={statusFilter === 'UNDER_REVIEW'}
              onClick={() => setStatusFilter('UNDER_REVIEW')}
            />
            <FilterButton
              label="Approved"
              count={requests.filter((r) => r.workflow_status === 'APPROVED').length}
              isActive={statusFilter === 'APPROVED'}
              onClick={() => setStatusFilter('APPROVED')}
            />
            <FilterButton
              label="Denied"
              count={requests.filter((r) => r.workflow_status === 'DENIED').length}
              isActive={statusFilter === 'DENIED'}
              onClick={() => setStatusFilter('DENIED')}
            />
            <FilterButton
              label="Withdrawn"
              count={requests.filter((r) => r.workflow_status === 'WITHDRAWN').length}
              isActive={statusFilter === 'WITHDRAWN'}
              onClick={() => setStatusFilter('WITHDRAWN')}
            />
          </div>
        </div>

        {/* Type Filters */}
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">Request Type:</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All Types"
              count={requests.length}
              isActive={typeFilter === 'all'}
              onClick={() => setTypeFilter('all')}
            />
            <FilterButton
              label="RDO"
              count={requests.filter((r) => r.request_type === 'RDO').length}
              isActive={typeFilter === 'RDO'}
              onClick={() => setTypeFilter('RDO')}
            />
            <FilterButton
              label="SDO"
              count={requests.filter((r) => r.request_type === 'SDO').length}
              isActive={typeFilter === 'SDO'}
              onClick={() => setTypeFilter('SDO')}
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-muted-foreground text-sm">
        Showing {filteredRequests.length} of {requests.length} requests
      </p>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                {/* Request Info */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3">
                    <RequestTypeBadge type={request.request_type} />
                    <StatusBadge status={request.workflow_status} />
                    {request.is_late_request && (
                      <Badge
                        variant="outline"
                        className="border-[var(--color-status-medium-border)] text-[var(--color-status-medium)]"
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Late Request
                      </Badge>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <strong>Pilot:</strong> {request.name}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Rank:</strong> {request.rank}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Employee #:</strong> {request.employee_number}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <strong>Dates:</strong> {formatDate(request.start_date)}
                        {request.end_date && request.end_date !== request.start_date && (
                          <> - {formatDate(request.end_date)}</>
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Days:</strong> {calculateDaysCount(request)}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Roster Period:</strong> {request.roster_period}
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  {request.reason && (
                    <div className="border-border border-t pt-2">
                      <p className="text-muted-foreground text-sm">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    </div>
                  )}

                  {/* Review Info */}
                  {request.reviewed_by && (
                    <div className="border-border text-muted-foreground border-t pt-2 text-sm">
                      <p>
                        <strong>Reviewed by:</strong> {request.reviewed_by}
                      </p>
                      {request.reviewed_at && (
                        <p>
                          <strong>Reviewed on:</strong> {formatDate(request.reviewed_at)}
                        </p>
                      )}
                      {request.review_comments && (
                        <p>
                          <strong>Comments:</strong> {request.review_comments}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Review Button */}
                <div className="ml-4">
                  <Button
                    onClick={() => handleReview(request)}
                    variant={
                      request.workflow_status === 'SUBMITTED' ||
                      request.workflow_status === 'UNDER_REVIEW'
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                  >
                    {request.workflow_status === 'SUBMITTED' ||
                    request.workflow_status === 'UNDER_REVIEW'
                      ? 'Review'
                      : 'View Details'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review {selectedRequest?.request_type} Request</DialogTitle>
            <DialogDescription>
              Review and approve or deny this {selectedRequest?.request_type} request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Request Details */}
              <div className="bg-muted grid grid-cols-2 gap-4 rounded-lg p-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pilot</p>
                  <p className="text-foreground text-sm">{selectedRequest.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Type</p>
                  <p className="text-foreground text-sm">{selectedRequest.request_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Dates</p>
                  <p className="text-foreground text-sm">
                    {formatDate(selectedRequest.start_date)}
                    {selectedRequest.end_date &&
                      selectedRequest.end_date !== selectedRequest.start_date &&
                      ` - ${formatDate(selectedRequest.end_date)}`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Days</p>
                  <p className="text-foreground text-sm">{calculateDaysCount(selectedRequest)}</p>
                </div>
              </div>

              {/* Reason */}
              {selectedRequest.reason && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Reason</p>
                  <p className="text-foreground text-sm">{selectedRequest.reason}</p>
                </div>
              )}

              {/* Action Selection */}
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">Decision</p>
                <div className="flex gap-3">
                  <Button
                    variant={reviewAction === 'APPROVED' ? 'default' : 'outline'}
                    onClick={() => setReviewAction('APPROVED')}
                    className="flex-1"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant={reviewAction === 'DENIED' ? 'destructive' : 'outline'}
                    onClick={() => setReviewAction('DENIED')}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Deny
                  </Button>
                </div>
              </div>

              {/* Review Comments */}
              <div>
                <label className="text-muted-foreground mb-1 block text-sm font-medium">
                  Comments (Optional)
                </label>
                <Textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Add any comments about this decision..."
                  rows={3}
                />
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={isSubmitting}>
              {isSubmitting
                ? 'Submitting...'
                : reviewAction === 'APPROVED'
                  ? 'Approve Request'
                  : 'Deny Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Components
function FilterButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label} ({count})
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
  > = {
    SUBMITTED: { variant: 'secondary', icon: <Clock className="mr-1 h-3 w-3" /> },
    IN_REVIEW: { variant: 'default', icon: <FileText className="mr-1 h-3 w-3" /> },
    APPROVED: {
      variant: 'default',
      icon: <CheckCircle2 className="mr-1 h-3 w-3 text-[var(--color-status-low)]" />,
    },
    DENIED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" /> },
    WITHDRAWN: { variant: 'outline', icon: <Ban className="mr-1 h-3 w-3" /> },
  }

  const config = statusConfig[status] || statusConfig.SUBMITTED

  return (
    <Badge variant={config.variant} className="flex w-fit items-center">
      {config.icon}
      {status}
    </Badge>
  )
}

function RequestTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant={type === 'RDO' ? 'default' : 'secondary'} className="text-sm">
      {type}
    </Badge>
  )
}
