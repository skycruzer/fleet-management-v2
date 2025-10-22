'use client'

/**
 * Leave Bid Modal Component
 *
 * Modal dialog for submitting leave bids with calendar date selection.
 * Provides enhanced date selection interface for pilots.
 *
 * @spec 001-missing-core-features (US2, T050)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PilotLeaveRequestSchema, type PilotLeaveRequestInput } from '@/lib/validations/pilot-leave-schema'
import { getCurrentRosterPeriodObject, type RosterPeriod } from '@/lib/utils/roster-utils'

interface LeaveBidModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LeaveBidModal({ isOpen, onClose, onSuccess }: LeaveBidModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRosterPeriod, setCurrentRosterPeriod] = useState<RosterPeriod | null>(null)

  const form = useForm<PilotLeaveRequestInput>({
    resolver: zodResolver(PilotLeaveRequestSchema),
    defaultValues: {
      request_type: 'ANNUAL',
      start_date: '',
      end_date: '',
      reason: '',
    },
  })

  // Get current roster period on mount
  useEffect(() => {
    if (isOpen) {
      const period = getCurrentRosterPeriodObject()
      setCurrentRosterPeriod(period)
    }
  }, [isOpen])

  const onSubmit = async (data: PilotLeaveRequestInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/pilot/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to submit leave request')
        return
      }

      // Success - close modal and refresh
      form.reset()
      onSuccess?.()
      onClose()
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Submit Leave Request
            </h2>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current Roster Period Info */}
          {currentRosterPeriod && (
            <div className="mt-3 rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Current Roster Period:</strong> {currentRosterPeriod.code}
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                {currentRosterPeriod.startDate.toLocaleDateString()} -{' '}
                {currentRosterPeriod.endDate.toLocaleDateString()} ({currentRosterPeriod.daysRemaining}{' '}
                days remaining)
              </p>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {/* Leave Type */}
          <div>
            <label htmlFor="modal-request-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              id="modal-request-type"
              {...form.register('request_type')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="RDO">Rostered Day Off (RDO)</option>
              <option value="SDO">Standby Day Off (SDO)</option>
              <option value="SICK">Sick Leave</option>
              <option value="LSL">Long Service Leave</option>
              <option value="LWOP">Leave Without Pay</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="COMPASSIONATE">Compassionate Leave</option>
            </select>
            {form.formState.errors.request_type && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.request_type.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="modal-start-date"
                {...form.register('start_date')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {form.formState.errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="modal-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="modal-end-date"
                {...form.register('end_date')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {form.formState.errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="modal-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason (Optional)
            </label>
            <textarea
              id="modal-reason"
              {...form.register('reason')}
              rows={3}
              placeholder="Optional notes about your leave request..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {form.formState.errors.reason && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.reason.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Leave requests must fall within roster period boundaries.
              Requests with less than 21 days advance notice will be flagged as late requests.
            </p>
          </div>

          {/* Modal Footer */}
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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
