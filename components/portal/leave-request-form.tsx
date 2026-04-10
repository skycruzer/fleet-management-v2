'use client'

/**
 * Leave Request Form Component
 * Client component for submitting leave requests with validation
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: This form uses CSRF token via props for security
 *
 * @version 3.0.0 - 3-table architecture (leave_requests table only)
 * @updated 2025-01-19 - Removed RDO/SDO options (moved to separate form)
 */

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { usePortalForm } from '@/lib/hooks/use-portal-form'
import { FormErrorAlert } from '@/components/portal/form-error-alert'
import { SubmitButton } from '@/components/portal/submit-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle } from 'lucide-react'
import { submitLeaveRequestAction } from '@/app/portal/leave/actions'
import {
  getRosterPeriodFromDate,
  formatRosterPeriodFromObject,
  getAffectedRosterPeriods,
} from '@/lib/utils/roster-utils'
import { useEffect, useState } from 'react'

// Form validation schema (aligned with leave_requests table schema)
const leaveRequestSchema = z
  .object({
    request_type: z.enum(['ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'], {
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
    onSuccess: async () => {
      // Show success message first
      setShowSuccess(true)

      // Wait for user to see success message
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // CRITICAL: Refresh cache BEFORE callback (Next.js 16 requirement)
      router.refresh()
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Hide success and trigger callback
      setShowSuccess(false)
      onSuccess?.()
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
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

  // Auto-sync end date to start date when start date changes
  useEffect(() => {
    if (startDate && !endDate) {
      setValue('end_date', startDate)
    }
  }, [startDate, endDate, setValue])

  // Auto-calculate roster periods from start and end dates
  useEffect(() => {
    if (startDate && endDate) {
      // Get all affected roster periods
      const affectedPeriods = getAffectedRosterPeriods(new Date(startDate), new Date(endDate))
      // Store all roster period codes separated by commas
      const rosterPeriodCodes = affectedPeriods.map((p) => p.code).join(', ')
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
  const affectedRosterPeriods =
    startDate && endDate
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]">
          <CheckCircle className="h-4 w-4 text-[var(--color-status-low)]" />
          <AlertDescription className="text-[var(--color-status-low)]">
            Leave request submitted successfully! Your request is now pending approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      <FormErrorAlert error={error} onDismiss={resetError} />

      {/* Leave Type */}
      <div className="space-y-1.5">
        <label className="text-foreground text-sm font-medium">
          Leave Type <span className="text-destructive/70 ml-0.5 text-xs">*</span>
        </label>
        <Controller
          name="request_type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                className={errors.request_type ? 'border-destructive' : ''}
                aria-invalid={!!errors.request_type}
              >
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                <SelectItem value="SICK">Sick Leave</SelectItem>
                <SelectItem value="LSL">Long Service Leave (LSL)</SelectItem>
                <SelectItem value="LWOP">Leave Without Pay (LWOP)</SelectItem>
                <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                <SelectItem value="COMPASSIONATE">Compassionate Leave</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.request_type && (
          <p className="text-destructive text-xs font-medium">{errors.request_type.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          For RDO or SDO requests, please use the dedicated RDO/SDO Request form
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Start Date */}
        <div className="space-y-1.5">
          <label htmlFor="start_date" className="text-foreground text-sm font-medium">
            Start Date <span className="text-destructive/70 ml-0.5 text-xs">*</span>
          </label>
          <Input
            id="start_date"
            type="date"
            {...register('start_date')}
            size="lg"
            error={!!errors.start_date}
            success={touchedFields.start_date && !errors.start_date}
            aria-required={true}
            aria-describedby="start_date_error"
          />
          {errors.start_date && (
            <p id="start_date_error" className="text-destructive text-xs font-medium" role="alert">
              {errors.start_date.message}
            </p>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label htmlFor="end_date" className="text-foreground text-sm font-medium">
            End Date <span className="text-destructive/70 ml-0.5 text-xs">*</span>
          </label>
          <Input
            id="end_date"
            type="date"
            {...register('end_date')}
            min={startDate || undefined}
            size="lg"
            error={!!errors.end_date}
            success={touchedFields.end_date && !errors.end_date}
            aria-required={true}
            aria-describedby="end_date_error"
          />
          {errors.end_date && (
            <p id="end_date_error" className="text-destructive text-xs font-medium" role="alert">
              {errors.end_date.message}
            </p>
          )}
        </div>
      </div>

      {/* Days Count Display */}
      {daysCount > 0 && (
        <div className="border-accent/20 bg-accent/5 rounded-lg border p-4">
          <p className="text-accent-foreground text-sm font-medium">
            Total Days: <span className="text-accent text-xl font-bold">{daysCount}</span> day
            {daysCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Roster Period - Auto-calculated */}
      <div className="space-y-1.5">
        <label htmlFor="roster_period" className="text-foreground text-sm font-medium">
          Roster Period{affectedRosterPeriods.length > 1 ? 's' : ''}{' '}
          <span className="text-destructive/70 ml-0.5 text-xs">*</span>{' '}
          <span className="text-muted-foreground text-xs font-normal">(Auto-calculated)</span>
        </label>
        <Input
          id="roster_period"
          type="text"
          {...register('roster_period')}
          placeholder="Select start and end dates first"
          readOnly
          disabled
          className="bg-muted cursor-not-allowed"
          aria-required={true}
          aria-describedby="roster_period_help roster_period_error"
        />
        {errors.roster_period && (
          <p id="roster_period_error" className="text-destructive text-xs font-medium" role="alert">
            {errors.roster_period.message}
          </p>
        )}
        {affectedRosterPeriods.length > 0 && (
          <div className="border-accent/20 bg-accent/5 rounded-lg border p-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
              {affectedRosterPeriods.length === 1 ? 'Roster Period' : 'Affected Roster Periods'}
            </p>
            <div className="space-y-1">
              {affectedRosterPeriods.map((period) => (
                <p key={period.code} className="text-foreground text-sm font-medium">
                  {formatRosterPeriodFromObject(period)}
                </p>
              ))}
            </div>
            {affectedRosterPeriods.length > 1 && (
              <p className="text-muted-foreground mt-2 text-xs">
                This leave request spans {affectedRosterPeriods.length} roster periods
              </p>
            )}
            {affectedRosterPeriods.length === 1 && (
              <p className="text-muted-foreground mt-2 text-xs">
                Automatically calculated from your dates
              </p>
            )}
          </div>
        )}
        {affectedRosterPeriods.length === 0 && (
          <p id="roster_period_help" className="text-muted-foreground text-xs">
            The roster period(s) will be automatically calculated when you select dates
          </p>
        )}
      </div>

      {/* Reason (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor="reason" className="text-foreground text-sm font-medium">
          Reason <span className="text-muted-foreground text-xs">(Optional)</span>
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
          <p id="reason_error" className="text-destructive text-xs font-medium" role="alert">
            {errors.reason.message}
          </p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="border-border flex items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <SubmitButton isSubmitting={isSubmitting}>Submit Leave Request</SubmitButton>
      </div>
    </form>
  )
}

// Helper function to get current roster period using official utilities
function getCurrentRosterPeriod(): string {
  return getRosterPeriodFromDate(new Date()).code
}
