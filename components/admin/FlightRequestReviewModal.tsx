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
import { FlightRequestReviewSchema, type FlightRequestReviewInput } from '@/lib/validations/flight-request-schema'
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
      status: request.status === 'PENDING' ? 'UNDER_REVIEW' : request.status,
      admin_comments: request.admin_comments || '',
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
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isReadOnly = request.status === 'APPROVED' || request.status === 'DENIED'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
              {isReadOnly ? 'Flight Request Details' : 'Review Flight Request'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Request Details</h3>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Pilot:</strong> {request.pilot_name || 'Unknown'}
                  {request.pilot_rank && ` (${request.pilot_rank})`}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Request Type:</strong>{' '}
                  {request.request_type
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Route:</strong> {request.route}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Start Date:</strong> {new Date(request.start_date).toLocaleDateString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>End Date:</strong> {new Date(request.end_date).toLocaleDateString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Reason:</strong>
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{request.reason}</p>
            </div>

            {request.additional_details && (
              <div className="mt-3">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Additional Details:</strong>
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {request.additional_details}
                </p>
              </div>
            )}
          </div>

          {/* Review Form */}
          {!isReadOnly && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Status Selection */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Review Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  {...form.register('status')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DENIED">Denied</option>
                </select>
                {form.formState.errors.status && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.status.message}</p>
                )}
              </div>

              {/* Admin Comments */}
              <div>
                <label
                  htmlFor="admin_comments"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Admin Comments {selectedStatus === 'DENIED' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="admin_comments"
                  {...form.register('admin_comments')}
                  rows={4}
                  placeholder={
                    selectedStatus === 'DENIED'
                      ? 'Please provide a reason for denial...'
                      : 'Optional comments for the pilot...'
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {form.formState.errors.admin_comments && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.admin_comments.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {selectedStatus === 'DENIED'
                    ? 'Required when denying a request'
                    : 'This will be visible to the pilot'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isSubmitting ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          )}

          {/* Read-only view for completed reviews */}
          {isReadOnly && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      request.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {request.status}
                  </span>
                </p>
                {request.admin_comments && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      <strong>Admin Comments:</strong>
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {request.admin_comments}
                    </p>
                  </div>
                )}
                {request.reviewed_by && (
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                    Reviewed by {request.reviewer_name || 'Unknown'} on{' '}
                    {request.reviewed_at && new Date(request.reviewed_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
