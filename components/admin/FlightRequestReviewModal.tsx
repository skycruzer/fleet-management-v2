'use client'

/**
 * Flight Request Review Modal Component (Admin)
 *
 * Modal for reviewing, approving, or denying flight requests.
 *
 * @spec 001-missing-core-features (US3, T065)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FlightRequestReviewSchema,
  type FlightRequestReviewInput,
} from '@/lib/validations/flight-request-schema'
import type { FlightRequest } from '@/lib/services/pilot-flight-service'

interface FlightRequestReviewModalProps {
  isOpen: boolean
  onClose: () => void
  request: FlightRequest
}

export default function FlightRequestReviewModal({
  isOpen,
  onClose,
  request,
}: FlightRequestReviewModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FlightRequestReviewInput>({
    resolver: zodResolver(FlightRequestReviewSchema),
    defaultValues: {
      status:
        request.workflow_status === 'SUBMITTED'
          ? 'UNDER_REVIEW'
          : (request.workflow_status as 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'),
      reviewer_comments: request.review_comments || '',
    },
  })

  const selectedStatus = form.watch('status')

  const onSubmit = async (data: FlightRequestReviewInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/flight-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to review flight request')
        return
      }

      // Success - close modal and refresh
      onClose()
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isReadOnly = request.workflow_status === 'APPROVED' || request.workflow_status === 'DENIED'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-border border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-foreground text-xl font-bold">
              {isReadOnly ? 'Flight Request Details' : 'Review Flight Request'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground focus:ring-primary rounded-md focus:ring-2 focus:outline-none"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="space-y-6 px-6 py-4">
          {/* Request Details */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-foreground mb-3 font-medium">Request Details</h3>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">
                  <strong>Pilot:</strong> {request.pilot_name || 'Unknown'}
                  {request.pilot_rank && ` (${request.pilot_rank})`}
                </p>
                <p className="text-muted-foreground">
                  <strong>Request Type:</strong>{' '}
                  {request.request_type
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  <strong>Flight Date:</strong> {new Date(request.start_date).toLocaleDateString()}
                </p>
                <p className="text-muted-foreground">
                  <strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-muted-foreground">
                <strong>Description:</strong>
              </p>
              <p className="text-foreground mt-1 text-sm">{request.description}</p>
            </div>

            {request.reason && (
              <div className="mt-3">
                <p className="text-muted-foreground">
                  <strong>Reason:</strong>
                </p>
                <p className="text-foreground mt-1 text-sm">{request.reason}</p>
              </div>
            )}
          </div>

          {/* Review Form */}
          {!isReadOnly && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Status Selection */}
              <div>
                <label htmlFor="status" className="text-foreground block text-sm font-medium">
                  Review Status <span className="text-destructive">*</span>
                </label>
                <select
                  id="status"
                  {...form.register('status')}
                  className="border-border focus:border-primary focus:ring-primary bg-card mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
                >
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DENIED">Denied</option>
                </select>
                {form.formState.errors.status && (
                  <p className="text-destructive mt-1 text-sm">
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>

              {/* Reviewer Comments */}
              <div>
                <label
                  htmlFor="reviewer_comments"
                  className="text-foreground block text-sm font-medium"
                >
                  Reviewer Comments{' '}
                  {selectedStatus === 'DENIED' && <span className="text-destructive">*</span>}
                </label>
                <textarea
                  id="reviewer_comments"
                  {...form.register('reviewer_comments')}
                  rows={4}
                  placeholder={
                    selectedStatus === 'DENIED'
                      ? 'Please provide a reason for denial...'
                      : 'Optional comments for the pilot...'
                  }
                  className="border-border focus:border-primary focus:ring-primary bg-card mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
                />
                {form.formState.errors.reviewer_comments && (
                  <p className="text-destructive mt-1 text-sm">
                    {form.formState.errors.reviewer_comments.message}
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {selectedStatus === 'DENIED'
                    ? 'Required when denying a request'
                    : 'This will be visible to the pilot'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-[var(--color-status-high-bg)] p-3">
                  <p className="text-sm text-[var(--color-status-high)]">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="border-border rounded-md border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary rounded-md px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          )}

          {/* Read-only view for completed reviews */}
          {isReadOnly && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-foreground text-sm font-medium">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      request.workflow_status === 'APPROVED'
                        ? 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
                        : 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
                    }`}
                  >
                    {request.workflow_status}
                  </span>
                </p>
                {request.review_comments && (
                  <div className="mt-3">
                    <p className="text-foreground text-sm font-medium">
                      <strong>Reviewer Comments:</strong>
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">{request.review_comments}</p>
                  </div>
                )}
                {request.reviewed_by && (
                  <p className="text-muted-foreground mt-3 text-xs">
                    Reviewed by {request.reviewer_name || 'Unknown'} on{' '}
                    {request.reviewed_at && new Date(request.reviewed_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="bg-muted text-foreground hover:bg-muted/80 focus:ring-primary rounded-md px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
