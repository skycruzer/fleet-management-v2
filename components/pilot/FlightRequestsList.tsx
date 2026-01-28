'use client'

/**
 * Flight Requests List Component
 *
 * Displays list of pilot's flight requests with status and cancel functionality.
 *
 * @spec 001-missing-core-features (US3, T063)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FlightRequest } from '@/lib/services/pilot-flight-service'

interface FlightRequestsListProps {
  requests: FlightRequest[]
}

export default function FlightRequestsList({ requests }: FlightRequestsListProps) {
  const router = useRouter()
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const handleCancel = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this flight request?')) {
      return
    }

    setCancelingId(requestId)

    try {
      const response = await fetch(`/api/portal/flight-requests?id=${requestId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to cancel flight request')
        return
      }

      // Refresh to show updated list
      router.refresh()
    } catch (error) {
      alert('An unexpected error occurred')
    } finally {
      setCancelingId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-white/[0.1] p-8 text-center">
        <p className="text-muted-foreground">No flight requests yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Submit your first flight request using the form on the left
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="rounded-lg border border-white/[0.08] p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            {/* Request Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-foreground font-medium">
                  {formatRequestType(request.request_type)}
                </h3>
                <StatusBadge status={request.workflow_status} />
              </div>

              <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                <p>
                  <strong>Flight Date:</strong> {new Date(request.start_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Description:</strong> {request.description}
                </p>
                {request.reason && (
                  <p>
                    <strong>Reason:</strong> {request.reason}
                  </p>
                )}
                <p>
                  <strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Admin Comments */}
              {(request.workflow_status === 'APPROVED' || request.workflow_status === 'DENIED') &&
                request.review_comments && (
                  <div className="mt-3 rounded-md bg-white/[0.03] p-3">
                    <p className="text-foreground text-sm font-medium">Reviewer Comments:</p>
                    <p className="text-muted-foreground mt-1 text-sm">{request.review_comments}</p>
                    {request.reviewed_at && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
            </div>

            {/* Cancel Button */}
            {(request.workflow_status === 'SUBMITTED' ||
              request.workflow_status === 'UNDER_REVIEW') && (
              <button
                onClick={() => handleCancel(request.id)}
                disabled={cancelingId === request.id}
                className="ml-4 rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelingId === request.id ? 'Canceling...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
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
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PENDING'
    | 'UNDER_REVIEW'
    | 'IN_REVIEW'
    | 'APPROVED'
    | 'DENIED'
    | 'WITHDRAWN'
}) {
  const badgeStyles: Record<string, string> = {
    DRAFT: 'bg-white/[0.03] text-muted-foreground',
    SUBMITTED: 'bg-blue-500/10 text-blue-400',
    PENDING: 'bg-white/[0.03] text-foreground',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-400',
    IN_REVIEW: 'bg-amber-500/10 text-amber-400',
    APPROVED: 'bg-emerald-500/10 text-emerald-400',
    DENIED: 'bg-red-500/10 text-red-400',
    WITHDRAWN: 'bg-white/[0.03] text-foreground',
  }

  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under Review',
    IN_REVIEW: 'In Review',
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
