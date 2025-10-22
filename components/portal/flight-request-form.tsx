'use client'

/**
 * Flight Request Form Component
 * Client component for submitting flight requests with validation
 */

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { usePortalForm } from '@/lib/hooks/use-portal-form'
import { FormErrorAlert } from '@/components/portal/form-error-alert'
import { SubmitButton } from '@/components/portal/submit-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitFlightRequestAction } from '@/app/portal/flights/actions'

// Form validation schema
const flightRequestSchema = z.object({
  request_type: z.enum(
    ['ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_PREFERENCE', 'PICKUP_REQUEST'],
    {
      message: 'Please select a request type',
    }
  ),
  flight_date: z.string().min(1, 'Flight date is required'),
  route: z.string().optional(),
  flight_number: z.string().optional(),
  description: z.string().min(10, 'Please provide a detailed description (minimum 10 characters)'),
  reason: z.string().optional(),
})

type FlightRequestFormData = z.infer<typeof flightRequestSchema>

interface FlightRequestFormProps {
  csrfToken: string
}

export function FlightRequestForm({ csrfToken }: FlightRequestFormProps) {
  const router = useRouter()
  const {
    isSubmitting,
    error,
    handleSubmit: handlePortalSubmit,
    resetError,
  } = usePortalForm({
    successRedirect: '/portal/dashboard',
    successMessage: 'flight_request_submitted',
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<FlightRequestFormData>({
    resolver: zodResolver(flightRequestSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first blur
    defaultValues: {
      request_type: 'ADDITIONAL_FLIGHT',
    },
  })

  const requestType = watch('request_type')

  async function onSubmit(data: FlightRequestFormData) {
    // Create FormData for Server Action
    const formData = new FormData()
    formData.append('csrf_token', csrfToken)
    formData.append('request_type', data.request_type)
    formData.append('flight_date', data.flight_date)
    if (data.route) {
      formData.append('route', data.route)
    }
    if (data.flight_number) {
      formData.append('flight_number', data.flight_number)
    }
    formData.append('description', data.description)
    if (data.reason) {
      formData.append('reason', data.reason)
    }

    // Use portal form handler
    await handlePortalSubmit(() => submitFlightRequestAction(formData))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Alert */}
      <FormErrorAlert error={error} onDismiss={resetError} />

      {/* Request Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Request Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register('request_type')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
        >
          <option value="ADDITIONAL_FLIGHT">Additional Flight</option>
          <option value="ROUTE_CHANGE">Route Change</option>
          <option value="SCHEDULE_PREFERENCE">Schedule Preference</option>
          <option value="PICKUP_REQUEST">Pickup Request</option>
        </select>
        {errors.request_type && (
          <p className="mt-1 text-sm text-red-600">{errors.request_type.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {requestType === 'ADDITIONAL_FLIGHT' &&
            'Request to operate additional flights beyond your current schedule'}
          {requestType === 'ROUTE_CHANGE' && 'Request to change routes or destinations'}
          {requestType === 'SCHEDULE_PREFERENCE' && 'Share preferences for future roster planning'}
          {requestType === 'PICKUP_REQUEST' && 'Request to pick up a specific flight or pairing'}
        </p>
      </div>

      {/* Flight Date */}
      <div>
        <label htmlFor="flight_date" className="mb-2 block text-sm font-medium text-gray-700">
          Flight Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="flight_date"
          type="date"
          {...register('flight_date')}
          error={!!errors.flight_date}
          success={touchedFields.flight_date && !errors.flight_date}
          aria-required={true}
          aria-describedby="flight_date_help flight_date_error"
        />
        {errors.flight_date && (
          <p id="flight_date_error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.flight_date.message}
          </p>
        )}
        <p id="flight_date_help" className="mt-1 text-xs text-gray-500">
          {requestType === 'SCHEDULE_PREFERENCE'
            ? 'Approximate date or start of preferred period'
            : 'Date of the requested flight or change'}
        </p>
      </div>

      {/* Optional Flight Details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Route */}
        <div>
          <label htmlFor="route" className="mb-2 block text-sm font-medium text-gray-700">
            Route <span className="text-gray-400">(Optional)</span>
          </label>
          <Input
            id="route"
            type="text"
            {...register('route')}
            placeholder="e.g., POM-HKG, POM-CNS-BNE"
            error={!!errors.route}
            success={touchedFields.route && !errors.route}
            aria-describedby="route_error"
          />
          {errors.route && (
            <p id="route_error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.route.message}
            </p>
          )}
        </div>

        {/* Flight Number */}
        <div>
          <label htmlFor="flight_number" className="mb-2 block text-sm font-medium text-gray-700">
            Flight Number <span className="text-gray-400">(Optional)</span>
          </label>
          <Input
            id="flight_number"
            type="text"
            {...register('flight_number')}
            placeholder="e.g., PX123, PX456"
            error={!!errors.flight_number}
            success={touchedFields.flight_number && !errors.flight_number}
            aria-describedby="flight_number_error"
          />
          {errors.flight_number && (
            <p id="flight_number_error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.flight_number.message}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          {...register('description')}
          rows={5}
          placeholder="Provide detailed information about your request...

Examples:
- Additional Flight: Explain availability, qualifications, and motivation
- Route Change: Specify current vs. desired route and justification
- Schedule Preference: Detail preferred patterns or days off
- Pickup Request: Explain circumstances and flight details"
          error={!!errors.description}
          success={touchedFields.description && !errors.description}
          showCharCount={true}
          maxLength={1000}
          aria-required={true}
          aria-describedby="description_help description_error"
        />
        {errors.description && (
          <p id="description_error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
        <p id="description_help" className="mt-1 text-xs text-gray-500">
          Provide as much detail as possible to help fleet management review your request.
        </p>
      </div>

      {/* Reason (Optional) */}
      <div>
        <label htmlFor="reason" className="mb-2 block text-sm font-medium text-gray-700">
          Additional Comments <span className="text-gray-400">(Optional)</span>
        </label>
        <Textarea
          id="reason"
          {...register('reason')}
          rows={3}
          placeholder="Any additional context, personal circumstances, or supporting information..."
          error={!!errors.reason}
          success={touchedFields.reason && !errors.reason}
          showCharCount={true}
          maxLength={500}
          aria-describedby="reason_error"
        />
        {errors.reason && (
          <p id="reason_error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.reason.message}
          </p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 border-t pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <SubmitButton isSubmitting={isSubmitting}>Submit Flight Request</SubmitButton>
      </div>
    </form>
  )
}
