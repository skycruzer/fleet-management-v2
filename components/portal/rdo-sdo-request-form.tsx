'use client'

/**
 * RDO/SDO Request Form Component
 * Client component for submitting RDO and SDO requests with validation
 *
 * Developer: Maurice Rondeau
 * Date: January 19, 2025
 *
 * CSRF PROTECTION: This form uses CSRF token via props for security
 *
 * @version 3.0.0 - 3-table architecture
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Info } from 'lucide-react'
import {
  getRosterPeriodFromDate,
  formatRosterPeriodFromObject,
} from '@/lib/utils/roster-utils'
import { useEffect, useState } from 'react'

// Form validation schema
const rdoSdoRequestSchema = z
  .object({
    request_type: z.enum(['RDO', 'SDO'], {
      message: 'Please select request type (RDO or SDO)',
    }),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.end_date) return true // end_date is optional
      const start = new Date(data.start_date)
      const end = new Date(data.end_date)
      return end >= start
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )

type RdoSdoRequestFormData = z.infer<typeof rdoSdoRequestSchema>

interface RdoSdoRequestFormProps {
  csrfToken?: string
  onSuccess?: () => void
}

export function RdoSdoRequestForm({ csrfToken = '', onSuccess }: RdoSdoRequestFormProps) {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const {
    isSubmitting,
    error,
    handleSubmit: handlePortalSubmit,
    resetError,
  } = usePortalForm({
    successRedirect: onSuccess ? undefined : '/portal/dashboard',
    successMessage: 'rdo_sdo_request_submitted',
    onSuccess: (data) => {
      // Show success message first
      setShowSuccess(true)

      // Close dialog and call callback after 2 seconds
      setTimeout(() => {
        setShowSuccess(false)
        if (onSuccess) {
          onSuccess()
        }
      }, 2000)
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<RdoSdoRequestFormData>({
    resolver: zodResolver(rdoSdoRequestSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first blur
    defaultValues: {
      request_type: 'RDO',
    },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const requestType = watch('request_type')

  // Calculate roster period details for display
  const rosterPeriod = startDate ? getRosterPeriodFromDate(new Date(startDate)) : null

  // Calculate days count
  const daysCount =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 1 // Single day if no end date

  async function onSubmit(data: RdoSdoRequestFormData) {
    try {
      // Submit to API endpoint
      const response = await fetch('/api/portal/rdo-sdo-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: data.request_type,
          start_date: data.start_date,
          end_date: data.end_date || data.start_date, // Default to start_date if not provided
          reason: data.reason,
        }),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit RDO/SDO request')
      }

      // Handle success via usePortalForm callback
      await handlePortalSubmit(async () => result)
    } catch (error) {
      console.error('Submit RDO/SDO request error:', error)
      throw error
    }
  }

  if (showSuccess) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {requestType} request submitted successfully! Redirecting...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <FormErrorAlert error={error} onDismiss={resetError} />}

      {/* Request Type Selection */}
      <div className="space-y-2">
        <label htmlFor="request_type" className="block text-sm font-medium text-gray-700">
          Request Type <span className="text-red-500">*</span>
        </label>
        <select
          id="request_type"
          {...register('request_type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="RDO">RDO (Rostered Day Off)</option>
          <option value="SDO">SDO (Scheduled Day Off)</option>
        </select>
        {errors.request_type && (
          <p className="text-sm text-red-600">{errors.request_type.message}</p>
        )}
      </div>

      {/* Request Type Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {requestType === 'RDO' ? (
            <span>
              <strong>RDO (Rostered Day Off):</strong> A rostered day off within your normal roster
              pattern.
            </span>
          ) : (
            <span>
              <strong>SDO (Scheduled Day Off):</strong> A scheduled day off for operational
              requirements.
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Start Date */}
      <div className="space-y-2">
        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
          Start Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="start_date"
          type="date"
          {...register('start_date')}
          className={errors.start_date ? 'border-red-500' : ''}
        />
        {errors.start_date && <p className="text-sm text-red-600">{errors.start_date.message}</p>}
      </div>

      {/* End Date (Optional) */}
      <div className="space-y-2">
        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
          End Date <span className="text-gray-400">(Optional - defaults to start date)</span>
        </label>
        <Input
          id="end_date"
          type="date"
          {...register('end_date')}
          className={errors.end_date ? 'border-red-500' : ''}
        />
        {errors.end_date && <p className="text-sm text-red-600">{errors.end_date.message}</p>}
      </div>

      {/* Days Count Display */}
      {startDate && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Request Duration:</strong> {daysCount} day{daysCount !== 1 ? 's' : ''}
            {rosterPeriod && (
              <>
                <br />
                <strong>Roster Period:</strong> {formatRosterPeriodFromObject(rosterPeriod)}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Reason (Optional) */}
      <div className="space-y-2">
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason <span className="text-gray-400">(Optional)</span>
        </label>
        <Textarea
          id="reason"
          {...register('reason')}
          placeholder="Optional: Provide additional context for your request"
          rows={3}
          className={errors.reason ? 'border-red-500' : ''}
        />
        {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
      </div>

      {/* Submit Button */}
      <SubmitButton isSubmitting={isSubmitting}>
        {isSubmitting ? 'Submitting...' : `Submit ${requestType} Request`}
      </SubmitButton>

      {/* Help Text */}
      <p className="text-sm text-gray-500">
        Your {requestType} request will be submitted for manager review. You'll be notified of the
        decision via email and in your portal dashboard.
      </p>
    </form>
  )
}

// Helper function to get current roster period
function getCurrentRosterPeriod(): string {
  const now = new Date()
  const rosterPeriod = getRosterPeriodFromDate(now)
  return rosterPeriod.code
}
