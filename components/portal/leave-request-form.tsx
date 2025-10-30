'use client'

/**
 * Leave Request Form Component
 * Client component for submitting leave requests with validation
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: This form uses CSRF token via props for security
 *
 * @version 1.1.0
 * @updated 2025-10-27 - Added developer attribution
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
import { CheckCircle } from 'lucide-react'
import { submitLeaveRequestAction } from '@/app/portal/leave/actions'
import { getRosterPeriodFromDate, formatRosterPeriodFromObject, getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import { useEffect, useState } from 'react'

// Form validation schema
const leaveRequestSchema = z
  .object({
    request_type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'], {
      message: 'Please select a leave type',
    }),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    roster_period: z.string().min(1, 'Roster period is required'),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date)
      const end = new Date(data.end_date)
      return end >= start
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>

interface LeaveRequestFormProps {
  csrfToken?: string
  onSuccess?: () => void
}

export function LeaveRequestForm({ csrfToken = '', onSuccess }: LeaveRequestFormProps) {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const {
    isSubmitting,
    error,
    handleSubmit: handlePortalSubmit,
    resetError,
  } = usePortalForm({
    successRedirect: onSuccess ? undefined : '/portal/dashboard',
    successMessage: 'leave_request_submitted',
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
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first blur
    defaultValues: {
      request_type: 'ANNUAL',
      roster_period: getCurrentRosterPeriod(),
    },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  // Auto-calculate roster periods from start and end dates
  useEffect(() => {
    if (startDate && endDate) {
      // Get all affected roster periods
      const affectedPeriods = getAffectedRosterPeriods(new Date(startDate), new Date(endDate))
      // Store all roster period codes separated by commas
      const rosterPeriodCodes = affectedPeriods.map(p => p.code).join(', ')
      setValue('roster_period', rosterPeriodCodes)
    } else if (startDate) {
      // If only start date, use that roster period
      const rosterPeriod = getRosterPeriodFromDate(new Date(startDate))
      setValue('roster_period', rosterPeriod.code)
    }
  }, [startDate, endDate, setValue])

  // Calculate days count
  const daysCount =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 0

  // Get roster period details for display
  const affectedRosterPeriods = startDate && endDate
    ? getAffectedRosterPeriods(new Date(startDate), new Date(endDate))
    : startDate
    ? [getRosterPeriodFromDate(new Date(startDate))]
    : []

  async function onSubmit(data: LeaveRequestFormData) {
    // Create FormData for Server Action
    const formData = new FormData()
    formData.append('csrf_token', csrfToken)
    formData.append('request_type', data.request_type)
    formData.append('start_date', data.start_date)
    formData.append('end_date', data.end_date)
    formData.append('roster_period', data.roster_period)
    formData.append('days_count', daysCount.toString())
    if (data.reason) {
      formData.append('reason', data.reason)
    }

    // Use portal form handler
    await handlePortalSubmit(() => submitLeaveRequestAction(formData))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Leave request submitted successfully! Your request is now pending approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      <FormErrorAlert error={error} onDismiss={resetError} />

      {/* Leave Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Leave Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register('request_type')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary"
        >
          <option value="ANNUAL">Annual Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="UNPAID">Unpaid Leave</option>
          <option value="LSL">Long Service Leave</option>
          <option value="LWOP">Leave Without Pay</option>
          <option value="MATERNITY">Maternity Leave</option>
          <option value="COMPASSIONATE">Compassionate Leave</option>
        </select>
        {errors.request_type && (
          <p className="mt-1 text-sm text-red-600">{errors.request_type.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          For RDO or SDO requests, use the Flight Request / RDO / SDO form instead
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Start Date */}
        <div>
          <label htmlFor="start_date" className="mb-2 block text-sm font-medium text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="start_date"
            type="date"
            {...register('start_date')}
            error={!!errors.start_date}
            success={touchedFields.start_date && !errors.start_date}
            aria-required={true}
            aria-describedby="start_date_error"
          />
          {errors.start_date && (
            <p id="start_date_error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.start_date.message}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="end_date" className="mb-2 block text-sm font-medium text-gray-700">
            End Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="end_date"
            type="date"
            {...register('end_date')}
            error={!!errors.end_date}
            success={touchedFields.end_date && !errors.end_date}
            aria-required={true}
            aria-describedby="end_date_error"
          />
          {errors.end_date && (
            <p id="end_date_error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.end_date.message}
            </p>
          )}
        </div>
      </div>

      {/* Days Count Display */}
      {daysCount > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            Total Days: <span className="text-xl font-bold">{daysCount}</span> day
            {daysCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Roster Period - Auto-calculated */}
      <div>
        <label htmlFor="roster_period" className="mb-2 block text-sm font-medium text-gray-700">
          Roster Period{affectedRosterPeriods.length > 1 ? 's' : ''} <span className="text-red-500">*</span>{' '}
          <span className="text-xs font-normal text-gray-500">(Auto-calculated)</span>
        </label>
        <Input
          id="roster_period"
          type="text"
          {...register('roster_period')}
          placeholder="Select start and end dates first"
          readOnly
          disabled
          className="cursor-not-allowed bg-gray-100"
          aria-required={true}
          aria-describedby="roster_period_help roster_period_error"
        />
        {errors.roster_period && (
          <p id="roster_period_error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.roster_period.message}
          </p>
        )}
        {affectedRosterPeriods.length > 0 && (
          <div className="mt-2 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
            <p className="mb-2 text-xs font-semibold text-cyan-900">
              {affectedRosterPeriods.length === 1 ? '📅 Roster Period:' : '📅 Affected Roster Periods:'}
            </p>
            <div className="space-y-1">
              {affectedRosterPeriods.map((period) => (
                <p key={period.code} className="text-sm font-medium text-cyan-900">
                  {formatRosterPeriodFromObject(period)}
                </p>
              ))}
            </div>
            {affectedRosterPeriods.length > 1 && (
              <p className="mt-2 text-xs text-cyan-700">
                ⚠️ This leave request spans {affectedRosterPeriods.length} roster periods
              </p>
            )}
            {affectedRosterPeriods.length === 1 && (
              <p className="mt-2 text-xs text-cyan-700">
                This roster period is automatically calculated from your dates
              </p>
            )}
          </div>
        )}
        {affectedRosterPeriods.length === 0 && (
          <p id="roster_period_help" className="mt-1 text-xs text-gray-500">
            The roster period(s) will be automatically calculated when you select dates
          </p>
        )}
      </div>

      {/* Reason (Optional) */}
      <div>
        <label htmlFor="reason" className="mb-2 block text-sm font-medium text-gray-700">
          Reason <span className="text-gray-400">(Optional)</span>
        </label>
        <Textarea
          id="reason"
          {...register('reason')}
          rows={4}
          placeholder="Provide any additional context or reason for your leave request..."
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
        <SubmitButton isSubmitting={isSubmitting}>Submit Leave Request</SubmitButton>
      </div>
    </form>
  )
}

// Helper function to get current roster period using official utilities
function getCurrentRosterPeriod(): string {
  return getRosterPeriodFromDate(new Date()).code
}
