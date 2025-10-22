'use client'

/**
 * Leave Request Form Component
 *
 * Client Component for submitting leave requests with validation.
 * Uses React Hook Form + Zod for form validation.
 *
 * @spec 001-missing-core-features (US2, T051)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PilotLeaveRequestSchema, type PilotLeaveRequestInput } from '@/lib/validations/pilot-leave-schema'

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
        <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Leave Type <span className="text-red-500">*</span>
        </label>
        <select
          id="request_type"
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

      {/* Start Date */}
      <div>
        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Start Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="start_date"
          {...form.register('start_date')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.start_date && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.start_date.message}</p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          End Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="end_date"
          {...form.register('end_date')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.end_date && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.end_date.message}</p>
        )}
      </div>

      {/* Reason (Optional) */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reason (Optional)
        </label>
        <textarea
          id="reason"
          {...form.register('reason')}
          rows={3}
          placeholder="Optional notes about your leave request..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.reason && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.reason.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Maximum 500 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            Leave request submitted successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
      </button>

      {/* Help Text */}
      <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Leave requests submitted with less than 21 days advance notice
          will be flagged as late requests and may require special approval.
        </p>
      </div>
    </form>
  )
}
