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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { usePortalForm } from '@/lib/hooks/use-portal-form'
import { FormErrorAlert } from '@/components/portal/form-error-alert'
import { SubmitButton } from '@/components/portal/submit-button'
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
import { CheckCircle, Info } from 'lucide-react'
import { getRosterPeriodFromDate, formatRosterPeriodFromObject } from '@/lib/utils/roster-utils'
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
    control,
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
      <Alert className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]">
        <CheckCircle className="h-4 w-4 text-[var(--color-status-low)]" />
        <AlertDescription className="text-[var(--color-status-low)]">
          {requestType} request submitted successfully! Redirecting...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && <FormErrorAlert error={error} onDismiss={resetError} />}

      {/* Request Type Selection */}
      <div className="space-y-1.5">
        <label htmlFor="request_type" className="text-foreground text-sm font-medium">
          Request Type <span className="text-destructive/70 ml-0.5 text-xs">*</span>
        </label>
        <Controller
          name="request_type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="request_type"
                className={errors.request_type ? 'border-destructive' : ''}
                aria-invalid={!!errors.request_type}
              >
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RDO">RDO (Rostered Day Off)</SelectItem>
                <SelectItem value="SDO">SDO (Scheduled Day Off)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.request_type && (
          <p className="text-destructive text-xs font-medium">{errors.request_type.message}</p>
        )}
      </div>

      {/* Request Type Info */}
      <Alert className="border-accent/20 bg-accent/5">
        <Info className="text-accent h-4 w-4" />
        <AlertDescription className="text-sm">
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
        />
        {errors.start_date && (
          <p className="text-destructive text-xs font-medium">{errors.start_date.message}</p>
        )}
      </div>

      {/* End Date (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor="end_date" className="text-foreground text-sm font-medium">
          End Date{' '}
          <span className="text-muted-foreground text-xs">(Optional - defaults to start date)</span>
        </label>
        <Input
          id="end_date"
          type="date"
          {...register('end_date')}
          size="lg"
          error={!!errors.end_date}
        />
        {errors.end_date && (
          <p className="text-destructive text-xs font-medium">{errors.end_date.message}</p>
        )}
      </div>

      {/* Days Count Display */}
      {startDate && (
        <div className="border-accent/20 bg-accent/5 rounded-lg border p-4">
          <p className="text-foreground text-sm font-medium">
            <strong>Request Duration:</strong> {daysCount} day{daysCount !== 1 ? 's' : ''}
          </p>
          {rosterPeriod && (
            <p className="text-muted-foreground mt-1 text-sm">
              <strong>Roster Period:</strong> {formatRosterPeriodFromObject(rosterPeriod)}
            </p>
          )}
        </div>
      )}

      {/* Reason (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor="reason" className="text-foreground text-sm font-medium">
          Reason <span className="text-muted-foreground text-xs">(Optional)</span>
        </label>
        <Textarea
          id="reason"
          {...register('reason')}
          placeholder="Optional: Provide additional context for your request"
          rows={3}
          error={!!errors.reason}
        />
        {errors.reason && (
          <p className="text-destructive text-xs font-medium">{errors.reason.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <SubmitButton isSubmitting={isSubmitting}>
        {isSubmitting ? 'Submitting...' : `Submit ${requestType} Request`}
      </SubmitButton>

      {/* Help Text */}
      <p className="text-muted-foreground text-xs">
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
