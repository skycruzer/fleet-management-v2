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
import {
  FlightRequestSchema,
  type FlightRequestInput,
} from '@/lib/validations/flight-request-schema'
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
      request_type: 'RDO',
      start_date: '',
      description: '',
      reason: '',
    } satisfies Partial<FlightRequestInput>,
  })

  // Watch start_date changes to calculate roster period
  const flightDate = form.watch('start_date')

  useEffect(() => {
    if (flightDate) {
      try {
        const rosterPeriod = getRosterPeriodFromDate(new Date(flightDate))
        setCalculatedRosterPeriod(rosterPeriod.code)
        // Update form with calculated roster period
        form.setValue('roster_period', rosterPeriod.code)
      } catch {
        setCalculatedRosterPeriod('')
      }
    } else {
      setCalculatedRosterPeriod('')
    }
  }, [flightDate, form])

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
      setTimeout(async () => {
        setSuccess(false)
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }, 2000)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Request Type */}
      <div>
        <label htmlFor="request_type" className="text-foreground block text-sm font-medium">
          Request Type <span className="text-[var(--color-status-high)]">*</span>
        </label>
        <select
          id="request_type"
          {...form.register('request_type')}
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
        >
          <option value="FLIGHT_REQUEST">Flight</option>
          <option value="RDO">RDO</option>
          <option value="SDO">SDO</option>
          <option value="OFFICE_DAY">Office</option>
        </select>
        {form.formState.errors.request_type && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">
            {form.formState.errors.request_type.message}
          </p>
        )}
      </div>

      {/* Flight Date */}
      <div>
        <label htmlFor="start_date" className="text-foreground block text-sm font-medium">
          Flight Date <span className="text-[var(--color-status-high)]">*</span>
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
        <p className="text-muted-foreground mt-1 text-xs">
          Select the date for your flight request
        </p>
      </div>

      {/* Calculated Roster Period */}
      {calculatedRosterPeriod && (
        <div className="rounded-md border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3">
          <p className="text-sm font-medium text-[var(--color-info-foreground)]">
            Roster Period: <span className="text-lg font-bold">{calculatedRosterPeriod}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--color-info)]">
            Automatically calculated from selected date
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="text-foreground block text-sm font-medium">
          Description <span className="text-[var(--color-status-high)]">*</span>
        </label>
        <textarea
          id="description"
          {...form.register('description')}
          rows={3}
          placeholder="Describe your flight request (route, requirements, etc.)..."
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">
            {form.formState.errors.description.message}
          </p>
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          Minimum 50 characters, maximum 2000 characters
        </p>
      </div>

      {/* Reason (Optional) */}
      <div>
        <label htmlFor="reason" className="text-foreground block text-sm font-medium">
          Reason (Optional)
        </label>
        <textarea
          id="reason"
          {...form.register('reason')}
          rows={2}
          placeholder="Additional reasoning for your request..."
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
        />
        {form.formState.errors.reason && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">
            {form.formState.errors.reason.message}
          </p>
        )}
        <p className="text-muted-foreground mt-1 text-xs">Maximum 1000 characters</p>
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
            Flight request submitted successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary hover:bg-primary/90 focus:ring-primary w-full rounded-md px-4 py-2 text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  )
}
