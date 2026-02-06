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
import {
  PilotLeaveRequestSchema,
  type PilotLeaveRequestInput,
} from '@/lib/validations/pilot-leave-schema'
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
        className="bg-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-foreground text-xl font-bold">
              Submit Leave Request
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-muted-foreground rounded-md focus:ring-2 focus:ring-[var(--color-primary-500)] focus:outline-none"
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

          {/* Current Roster Period Info */}
          {currentRosterPeriod && (
            <div className="mt-3 rounded-md bg-[var(--color-info-bg)] p-3">
              <p className="text-sm text-[var(--color-info)]">
                <strong>Current Roster Period:</strong> {currentRosterPeriod.code}
              </p>
              <p className="mt-1 text-xs text-[var(--color-info)]">
                {currentRosterPeriod.startDate.toLocaleDateString()} -{' '}
                {currentRosterPeriod.endDate.toLocaleDateString()} (
                {currentRosterPeriod.daysRemaining} days remaining)
              </p>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {/* Leave Type */}
          <div>
            <label
              htmlFor="modal-request-type"
              className="text-foreground/80 block text-sm font-medium"
            >
              Leave Type <span className="text-[var(--color-danger-500)]">*</span>
            </label>
            <select
              id="modal-request-type"
              {...form.register('request_type')}
              className="mt-1 block w-full rounded-md border border-white/[0.1] px-3 py-2 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
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
              <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                {form.formState.errors.request_type.message}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-start-date"
                className="text-foreground/80 block text-sm font-medium"
              >
                Start Date <span className="text-[var(--color-danger-500)]">*</span>
              </label>
              <input
                type="date"
                id="modal-start-date"
                {...form.register('start_date')}
                className="mt-1 block w-full rounded-md border border-white/[0.1] px-3 py-2 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
              />
              {form.formState.errors.start_date && (
                <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="modal-end-date"
                className="text-foreground/80 block text-sm font-medium"
              >
                End Date <span className="text-[var(--color-danger-500)]">*</span>
              </label>
              <input
                type="date"
                id="modal-end-date"
                {...form.register('end_date')}
                className="mt-1 block w-full rounded-md border border-white/[0.1] px-3 py-2 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
              />
              {form.formState.errors.end_date && (
                <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="modal-reason" className="text-foreground/80 block text-sm font-medium">
              Reason (Optional)
            </label>
            <textarea
              id="modal-reason"
              {...form.register('reason')}
              rows={3}
              placeholder="Optional notes about your leave request..."
              className="mt-1 block w-full rounded-md border border-white/[0.1] px-3 py-2 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
            />
            {form.formState.errors.reason && (
              <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-[var(--color-destructive-muted)] p-3">
              <p className="text-sm text-[var(--color-danger-400)]">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="rounded-md bg-[var(--color-info-bg)] p-3">
            <p className="text-xs text-[var(--color-info)]">
              <strong>Note:</strong> Leave requests must fall within roster period boundaries.
              Requests with less than 21 days advance notice will be flagged as late requests.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-foreground/80 rounded-md border border-white/[0.1] px-4 py-2 text-sm font-medium transition-colors hover:bg-white/[0.03] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-700)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
