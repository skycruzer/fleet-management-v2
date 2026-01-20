'use client'

/**
 * Leave Request Form Component
 *
 * Client Component for submitting leave requests with validation.
 * Uses React Hook Form + Zod for form validation.
 *
 * @spec 001-missing-core-features (US2, T051)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PilotLeaveRequestSchema,
  type PilotLeaveRequestInput,
} from '@/lib/validations/pilot-leave-schema'

export default function LeaveRequestForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<PilotLeaveRequestInput>({
    resolver: zodResolver(PilotLeaveRequestSchema),
    defaultValues: {
      request_type: 'ANNUAL',
      start_date: '',
      end_date: '',
      reason: '',
    },
  })

  const startDate = form.watch('start_date')
  const endDate = form.watch('end_date')

  // Auto-sync end date to start date when start date changes
  useEffect(() => {
    if (startDate && !endDate) {
      form.setValue('end_date', startDate)
    }
  }, [startDate, endDate, form])

  const onSubmit = async (data: PilotLeaveRequestInput) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

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

      // Success
      setSuccess(true)
      form.reset()

      // Refresh page to show new request
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Leave Type */}
      <div>
        <label htmlFor="request_type" className="text-foreground block text-sm font-medium">
          Leave Type <span className="text-[var(--color-status-high)]">*</span>
        </label>
        <select
          id="request_type"
          {...form.register('request_type')}
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
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
          <p className="mt-1 text-sm text-[var(--color-status-high)]">
            {form.formState.errors.request_type.message}
          </p>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="start_date" className="text-foreground block text-sm font-medium">
          Start Date <span className="text-[var(--color-status-high)]">*</span>
        </label>
        <input
          type="date"
          id="start_date"
          {...form.register('start_date')}
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block h-11 w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
        />
        {form.formState.errors.start_date && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">
            {form.formState.errors.start_date.message}
          </p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label htmlFor="end_date" className="text-foreground block text-sm font-medium">
          End Date <span className="text-[var(--color-status-high)]">*</span>
        </label>
        <input
          type="date"
          id="end_date"
          {...form.register('end_date')}
          min={startDate || undefined}
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block h-11 w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
        />
        {form.formState.errors.end_date && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">
            {form.formState.errors.end_date.message}
          </p>
        )}
      </div>

      {/* Reason (Optional) */}
      <div>
        <label htmlFor="reason" className="text-foreground block text-sm font-medium">
          Reason (Optional)
        </label>
        <textarea
          id="reason"
          {...form.register('reason')}
          rows={3}
          placeholder="Optional notes about your leave request..."
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
        />
        {form.formState.errors.reason && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">
            {form.formState.errors.reason.message}
          </p>
        )}
        <p className="text-muted-foreground mt-1 text-xs">Maximum 500 characters</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-[var(--color-status-high-bg)] p-3">
          <p className="text-sm text-[var(--color-status-high)]">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-[var(--color-status-low-bg)] p-3">
          <p className="text-sm text-[var(--color-status-low)]">
            Leave request submitted successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary hover:bg-primary/90 focus:ring-primary w-full rounded-md px-4 py-2 text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
      </button>

      {/* Help Text */}
      <div className="rounded-md bg-[var(--color-info-bg)] p-3">
        <p className="text-xs text-[var(--color-info)]">
          <strong>Note:</strong> Leave requests submitted with less than 21 days advance notice will
          be flagged as late requests and may require special approval.
        </p>
      </div>
    </form>
  )
}
