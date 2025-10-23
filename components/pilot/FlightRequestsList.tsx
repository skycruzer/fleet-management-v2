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
      const response = await fetch(`/api/pilot/flight-requests/${requestId}`, {
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
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
        <p className="text-gray-600 dark:text-gray-400">No flight requests yet</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
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
          className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700"
        >
          <div className="flex items-start justify-between">
            {/* Request Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {formatRequestType(request.request_type)}
                </h3>
                <StatusBadge status={request.status} />
              </div>

              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Flight Date:</strong> {new Date(request.flight_date).toLocaleDateString()}
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
                  <strong>Submitted:</strong>{' '}
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Admin Comments */}
              {request.status !== 'PENDING' && request.reviewer_comments && (
                <div className="mt-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Reviewer Comments:
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {request.reviewer_comments}
                  </p>
                  {request.reviewed_at && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cancel Button */}
            {request.status === 'PENDING' && (
              <button
                onClick={() => handleCancel(request.id)}
                disabled={cancelingId === request.id}
                className="ml-4 rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
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
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

// Status Badge Component
function StatusBadge({ status }: { status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' }) {
  const badgeStyles = {
    PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    DENIED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  const labels = {
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
