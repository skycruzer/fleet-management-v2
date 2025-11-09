'use client'

/**
 * Leave Requests List Component
 *
 * Displays list of pilot's leave requests with status and cancel functionality.
 *
 * @spec 001-missing-core-features (US2, T053)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeaveRequest } from '@/lib/services/leave-service'

interface LeaveRequestsListProps {
  requests: LeaveRequest[]
}

export default function LeaveRequestsList({ requests }: LeaveRequestsListProps) {
  const router = useRouter()
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const handleCancel = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return
    }

    setCancelingId(requestId)

    try {
      const response = await fetch(`/api/pilot/leave/${requestId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to cancel leave request')
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
        <p className="text-gray-600 dark:text-gray-400">No leave requests yet</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Submit your first leave request using the form on the left
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
                  {request.request_type}
                </h3>
                <StatusBadge status={request.status} />
                {request.is_late_request && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                    Late Request
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Dates:</strong>{' '}
                  {new Date(request.start_date).toLocaleDateString()} -{' '}
                  {new Date(request.end_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Days:</strong> {request.days_count}
                </p>
                {request.roster_period && (
                  <p>
                    <strong>Roster Period:</strong> {request.roster_period}
                  </p>
                )}
                {request.reason && (
                  <p>
                    <strong>Reason:</strong> {request.reason}
                  </p>
                )}
                <p>
                  <strong>Submitted:</strong>{' '}
                  {request.request_date
                    ? new Date(request.request_date).toLocaleDateString()
                    : new Date(request.created_at || '').toLocaleDateString()}
                </p>
              </div>

              {/* Review Comments */}
              {request.status !== 'PENDING' && request.review_comments && (
                <div className="mt-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Review Comments:
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {request.review_comments}
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

// Status Badge Component
function StatusBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'DENIED' }) {
  const badgeStyles = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    DENIED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[status]}`}>
      {status}
    </span>
  )
}
