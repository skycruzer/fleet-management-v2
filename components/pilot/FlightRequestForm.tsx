'use client'

/**
 * Flight Request Form Component
 *
 * Client Component for submitting flight requests with validation.
 * Uses React Hook Form + Zod for form validation.
 *
 * @spec 001-missing-core-features (US3, T062)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FlightRequestSchema, type FlightRequestInput } from '@/lib/validations/flight-request-schema'

export default function FlightRequestForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<FlightRequestInput>({
    resolver: zodResolver(FlightRequestSchema),
    defaultValues: {
      request_type: 'additional_flight',
      route: '',
      start_date: '',
      end_date: '',
      reason: '',
      additional_details: '',
    },
  })

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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="additional_flight">Additional Flight</option>
          <option value="route_change">Route Change</option>
          <option value="schedule_swap">Schedule Swap</option>
          <option value="other">Other</option>
        </select>
        {form.formState.errors.request_type && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.request_type.message}</p>
        )}
      </div>

      {/* Route */}
      <div>
        <label htmlFor="route" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Route <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="route"
          {...form.register('route')}
          placeholder="POM-LAE or route description"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.route && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.route.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Format: XXX-YYY or descriptive text
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
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
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          {...form.register('reason')}
          rows={3}
          placeholder="Explain why you need this flight request..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.reason && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.reason.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Minimum 10 characters, maximum 1000 characters
        </p>
      </div>

      {/* Additional Details (Optional) */}
      <div>
        <label htmlFor="additional_details" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Details (Optional)
        </label>
        <textarea
          id="additional_details"
          {...form.register('additional_details')}
          rows={2}
          placeholder="Any additional information..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.additional_details && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.additional_details.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Maximum 2000 characters
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
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Flight Request'}
      </button>
    </form>
  )
}
