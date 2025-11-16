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
import FlightRequestReviewModal from './FlightRequestReviewModal'

interface FlightRequestsTableProps {
  requests: FlightRequest[]
}

type StatusFilter = 'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'

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
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
        <p className="text-gray-600 dark:text-gray-400">No flight requests yet</p>
      </div>
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
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredRequests.length} of {requests.length} requests
      </p>

      {/* Requests Table/List */}
      <div className="space-y-3">
        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              {/* Request Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {formatRequestType(request.request_type)}
                  </h3>
                  <StatusBadge status={request.workflow_status} />
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Pilot:</strong> {request.pilot_name || 'Unknown'}
                      {request.pilot_rank && ` (${request.pilot_rank})`}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Flight Date:</strong>{' '}
                      {new Date(request.flight_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Description:</strong> {request.description.substring(0, 50)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Submitted:</strong>{' '}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.reason && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Reason:</strong> {request.reason.substring(0, 100)}
                        {request.reason.length > 100 && '...'}
                      </p>
                    )}
                    {request.reviewed_by && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Reviewed by:</strong> {request.reviewer_name || 'Unknown'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Button */}
              <button
                onClick={() => handleReview(request)}
                className="ml-4 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                {request.workflow_status === 'SUBMITTED' ||
                request.workflow_status === 'UNDER_REVIEW'
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
          ? 'bg-blue-600 text-white dark:bg-blue-500'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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
function StatusBadge({ status }: { status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' }) {
  const badgeStyles = {
    SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    DENIED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  const labels = {
    SUBMITTED: 'Submitted',
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    DENIED: 'Denied',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[status]}`}>
      {labels[status]}
    </span>
  )
}
