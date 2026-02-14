'use client'

/**
 * Flight Requests Table Component (Admin)
 *
 * Displays admin table of flight requests with filtering and review functionality.
 *
 * @spec 001-missing-core-features (US3, T064)
 */

import { useState, useMemo } from 'react'
import type { FlightRequest } from '@/lib/services/pilot-flight-service'
import { Plane } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import FlightRequestReviewModal from './FlightRequestReviewModal'

interface FlightRequestsTableProps {
  requests: FlightRequest[]
}

type StatusFilter = 'all' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED'

export default function FlightRequestsTable({ requests }: FlightRequestsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedRequest, setSelectedRequest] = useState<FlightRequest | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  // Filter requests based on status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests
    return requests.filter((req) => req.workflow_status === statusFilter)
  }, [requests, statusFilter])

  const handleReview = (request: FlightRequest) => {
    setSelectedRequest(request)
    setIsReviewModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsReviewModalOpen(false)
    setSelectedRequest(null)
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Plane}
        title="No flight requests yet"
        description="Flight requests will appear here once submitted."
        variant="compact"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterButton
          label="All"
          count={requests.length}
          isActive={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <FilterButton
          label="Pending"
          count={requests.filter((r) => r.workflow_status === 'SUBMITTED').length}
          isActive={statusFilter === 'SUBMITTED'}
          onClick={() => setStatusFilter('SUBMITTED')}
        />
        <FilterButton
          label="Under Review"
          count={requests.filter((r) => r.workflow_status === 'IN_REVIEW').length}
          isActive={statusFilter === 'IN_REVIEW'}
          onClick={() => setStatusFilter('IN_REVIEW')}
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
      </div>

      {/* Results Count */}
      <p className="text-muted-foreground text-sm">
        Showing {filteredRequests.length} of {requests.length} requests
      </p>

      {/* Requests Table/List */}
      <div className="space-y-3">
        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className="border-border rounded-lg border p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              {/* Request Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-foreground font-medium">
                    {formatRequestType(request.request_type)}
                  </h3>
                  <StatusBadge status={request.workflow_status} />
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">
                      <strong>Pilot:</strong> {request.pilot_name || 'Unknown'}
                      {request.pilot_rank && ` (${request.pilot_rank})`}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Flight Date:</strong>{' '}
                      {new Date(request.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Description:</strong>{' '}
                      {request.description ? request.description.substring(0, 50) + '...' : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      <strong>Submitted:</strong>{' '}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.reason && (
                      <p className="text-muted-foreground">
                        <strong>Reason:</strong> {request.reason.substring(0, 100)}
                        {request.reason.length > 100 && '...'}
                      </p>
                    )}
                    {request.reviewed_by && (
                      <p className="text-muted-foreground">
                        <strong>Reviewed by:</strong> {request.reviewer_name || 'Unknown'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Button */}
              <button
                onClick={() => handleReview(request)}
                className="focus:ring-accent ml-4 rounded-md bg-[var(--color-info-bg)] px-4 py-2 text-sm font-medium text-[var(--color-info)] transition-colors hover:bg-[var(--color-info-bg)]/80 focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                {request.workflow_status === 'SUBMITTED' || request.workflow_status === 'IN_REVIEW'
                  ? 'Review'
                  : 'View Details'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <FlightRequestReviewModal
          isOpen={isReviewModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
        />
      )}
    </div>
  )
}

// Filter Button Component
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
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label} ({count})
    </button>
  )
}

// Helper function to format request type
function formatRequestType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Status Badge Component
function StatusBadge({
  status,
}: {
  status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'
}) {
  const badgeStyles = {
    SUBMITTED: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    PENDING: 'bg-muted text-muted-foreground',
    IN_REVIEW: 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
    APPROVED: 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]',
    DENIED: 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
    WITHDRAWN: 'bg-muted text-muted-foreground',
  }

  const labels = {
    SUBMITTED: 'Submitted',
    PENDING: 'Pending',
    IN_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    DENIED: 'Denied',
    WITHDRAWN: 'Withdrawn',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[status]}`}>
      {labels[status]}
    </span>
  )
}
