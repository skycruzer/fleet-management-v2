'use client'

/**
 * Flight Request Form Component
 *
 * Client Component for submitting flight requests, RDO, SDO, and other duty requests.
 * Uses React Hook Form + Zod for form validation.
 * Automatically calculates roster period from selected date.
 *
 * @spec 001-missing-core-features (US3, T062)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FlightRequestSchema, type FlightRequestInput } from '@/lib/validations/flight-request-schema'
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

export default function FlightRequestForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [calculatedRosterPeriod, setCalculatedRosterPeriod] = useState<string>('')

  const form = useForm<FlightRequestInput>({
    resolver: zodResolver(FlightRequestSchema),
    defaultValues: {
      request_type: 'REQUEST_FLIGHT',
      request_date: '',
      description: '',
      reason: '',
    },
  })

  // Watch request_date changes to calculate roster period
  const requestDate = form.watch('request_date')

  useEffect(() => {
    if (requestDate) {
      try {
        const rosterPeriod = getRosterPeriodFromDate(new Date(requestDate))
        setCalculatedRosterPeriod(rosterPeriod.code)
        // Update form with calculated roster period
        form.setValue('roster_period', rosterPeriod.code)
      } catch (error) {
        setCalculatedRosterPeriod('')
      }
    } else {
      setCalculatedRosterPeriod('')
    }
  }, [requestDate, form])

  const onSubmit = async (data: FlightRequestInput) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/pilot/flight-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to submit flight request')
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
      {/* Request Type */}
      <div>
        <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Request Type <span className="text-red-500">*</span>
        </label>
        <select
          id="request_type"
          {...form.register('request_type')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="REQUEST_FLIGHT">Request a Flight to Operate</option>
          <option value="REQUEST_DAY_OFF">Request a Day Off (RDO)</option>
          <option value="REQUEST_SUBSTITUTE_DAY_OFF">Request Substitute Day Off (SDO)</option>
          <option value="REQUEST_OTHER_DUTY">Request Other Duty</option>
        </select>
        {form.formState.errors.request_type && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.request_type.message}</p>
        )}
      </div>

      {/* Request Date */}
      <div>
        <label htmlFor="request_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="request_date"
          {...form.register('request_date')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.request_date && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.request_date.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Select the date for your request
        </p>
      </div>

      {/* Calculated Roster Period */}
      {calculatedRosterPeriod && (
        <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 dark:bg-cyan-900/20">
          <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
            Roster Period: <span className="text-lg font-bold">{calculatedRosterPeriod}</span>
          </p>
          <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
            Automatically calculated from selected date
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...form.register('description')}
          rows={3}
          placeholder="Describe your flight request (route, requirements, etc.)..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.description.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Minimum 10 characters, maximum 2000 characters
        </p>
      </div>

      {/* Reason (Optional) */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reason (Optional)
        </label>
        <textarea
          id="reason"
          {...form.register('reason')}
          rows={2}
          placeholder="Additional reasoning for your request..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.reason && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.reason.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Maximum 1000 characters
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
            Flight request submitted successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:hover:bg-primary"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  )
}
