'use client'

/**
 * Leave Request Form Component
 * Client component for submitting leave requests with validation
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
import { submitLeaveRequestAction } from '@/app/portal/leave/actions'

interface PilotUser {
  id: string
  first_name: string
  last_name: string
  rank: string
}

// Form validation schema
const leaveRequestSchema = z
  .object({
    request_type: z.enum(['RDO', 'ANNUAL', 'SICK', 'SDO', 'UNPAID'], {
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
  pilotUser: PilotUser
  csrfToken: string
}

export function LeaveRequestForm({ pilotUser, csrfToken }: LeaveRequestFormProps) {
  const router = useRouter()
  const { isSubmitting, error, handleSubmit: handlePortalSubmit, resetError } = usePortalForm({
    successRedirect: '/portal/dashboard',
    successMessage: 'leave_request_submitted',
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first blur
    defaultValues: {
      request_type: 'RDO',
      roster_period: getCurrentRosterPeriod(),
    },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  // Calculate days count
  const daysCount =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 0

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
      {/* Error Alert */}
      <FormErrorAlert error={error} onDismiss={resetError} />

      {/* Leave Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Leave Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register('request_type')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="RDO">RDO (Rostered Day Off)</option>
          <option value="ANNUAL">Annual Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="SDO">SDO (Scheduled Day Off)</option>
          <option value="UNPAID">Unpaid Leave</option>
        </select>
        {errors.request_type && (
          <p className="mt-1 text-sm text-red-600">{errors.request_type.message}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="start_date"
            type="date"
            {...register('start_date')}
            error={!!errors.start_date}
            success={touchedFields.start_date && !errors.start_date}
            aria-required="true"
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
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
            End Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="end_date"
            type="date"
            {...register('end_date')}
            error={!!errors.end_date}
            success={touchedFields.end_date && !errors.end_date}
            aria-required="true"
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">
            Total Days: <span className="text-xl font-bold">{daysCount}</span> day
            {daysCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Roster Period */}
      <div>
        <label htmlFor="roster_period" className="block text-sm font-medium text-gray-700 mb-2">
          Roster Period <span className="text-red-500">*</span>
        </label>
        <Input
          id="roster_period"
          type="text"
          {...register('roster_period')}
          placeholder="e.g., RP12/2025"
          error={!!errors.roster_period}
          success={touchedFields.roster_period && !errors.roster_period}
          aria-required="true"
          aria-describedby="roster_period_help roster_period_error"
        />
        {errors.roster_period && (
          <p id="roster_period_error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.roster_period.message}
          </p>
        )}
        <p id="roster_period_help" className="mt-1 text-xs text-gray-500">
          Format: RPXX/YYYY (e.g., RP12/2025). Use the roster period that covers your leave dates.
        </p>
      </div>

      {/* Reason (Optional) */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
          Reason <span className="text-gray-400">(Optional)</span>
        </label>
        <Textarea
          id="reason"
          {...register('reason')}
          rows={4}
          placeholder="Provide any additional context or reason for your leave request..."
          error={!!errors.reason}
          success={touchedFields.reason && dirtyFields.reason && !errors.reason}
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
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <SubmitButton isSubmitting={isSubmitting}>Submit Leave Request</SubmitButton>
      </div>
    </form>
  )
}

// Helper function to get current roster period
function getCurrentRosterPeriod(): string {
  const today = new Date()
  const year = today.getFullYear()

  // Known anchor: RP12/2025 starts 2025-10-11
  const anchor = new Date('2025-10-11')
  const anchorRP = 12
  const anchorYear = 2025

  // Calculate roster period based on 28-day cycles
  const daysSinceAnchor = Math.floor(
    (today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24)
  )
  const rosterPeriodOffset = Math.floor(daysSinceAnchor / 28)

  let currentRP = anchorRP + rosterPeriodOffset
  let currentYear = anchorYear

  // Handle year rollover (RP13 → RP1 of next year)
  while (currentRP > 13) {
    currentRP -= 13
    currentYear++
  }
  while (currentRP < 1) {
    currentRP += 13
    currentYear--
  }

  return `RP${currentRP.toString().padStart(2, '0')}/${currentYear}`
}
