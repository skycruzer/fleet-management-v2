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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { LeaveRequest } from '@/lib/services/unified-request-service'

interface LeaveRequestsListProps {
  requests: LeaveRequest[]
}

export default function LeaveRequestsList({ requests }: LeaveRequestsListProps) {
  const router = useRouter()
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const handleCancel = async (requestId: string) => {
    setCancelingId(requestId)

    try {
      const response = await fetch(`/api/portal/leave-requests?id=${requestId}`, {
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
      <div className="rounded-lg border-2 border-dashed p-8 text-center">
        <p className="text-muted-foreground">No leave requests yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Submit your first leave request using the form on the left
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            {/* Request Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-foreground font-medium">{request.request_type}</h3>
                <StatusBadge status={request.workflow_status} />
                {request.is_late_request && (
                  <span className="rounded-full bg-[var(--color-status-medium-bg)] px-2 py-0.5 text-xs font-medium text-[var(--color-status-medium)]">
                    Late Request
                  </span>
                )}
              </div>

              <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                <p>
                  <strong>Dates:</strong> {new Date(request.start_date).toLocaleDateString()} -{' '}
                  {request.end_date
                    ? new Date(request.end_date).toLocaleDateString()
                    : new Date(request.start_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Days:</strong> {request.days_count ?? 1}
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
                  {new Date(request.submission_date || request.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Review Comments */}
              {request.workflow_status !== 'SUBMITTED' && request.review_comments && (
                <div className="bg-muted/50 mt-3 rounded-md p-3">
                  <p className="text-foreground text-sm font-medium">Review Comments:</p>
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
            {request.workflow_status === 'SUBMITTED' && (
              <button
                onClick={() => setConfirmCancelId(request.id)}
                disabled={cancelingId === request.id}
                className="ml-4 rounded-md bg-[var(--color-status-high-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-status-high)] transition-colors hover:bg-[var(--color-status-high-bg)]/80 focus:ring-2 focus:ring-[var(--color-status-high)] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelingId === request.id ? 'Canceling...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!confirmCancelId}
        onOpenChange={(open) => !open && setConfirmCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmCancelId) {
                  handleCancel(confirmCancelId)
                  setConfirmCancelId(null)
                }
              }}
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Status Badge Component
function StatusBadge({
  status,
}: {
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'
}) {
  const badgeStyles: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    SUBMITTED: 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
    IN_REVIEW: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    APPROVED: 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]',
    DENIED: 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
    WITHDRAWN: 'bg-muted text-muted-foreground',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[status]}`}>
      {status}
    </span>
  )
}
