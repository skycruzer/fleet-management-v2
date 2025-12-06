/**
 * Unified Leave Request Form Component
 * Handles both create and edit modes for leave request management
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: This form includes CSRF token protection for all submissions
 *
 * @version 1.1.0
 * @since 2025-10-17
 * @updated 2025-10-27 - Added CSRF protection
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCsrfToken } from '@/lib/providers/csrf-provider'
import {
  LeaveRequestCreateSchema,
  LeaveRequestUpdateSchema,
  type LeaveRequestCreate,
  type LeaveRequestUpdate,
} from '@/lib/validations/leave-validation'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormSelectWrapper, type SelectOption } from './form-select-wrapper'
import { FormDatePickerWrapper } from './form-date-picker-wrapper'
import { FormTextareaWrapper } from './form-textarea-wrapper'
import { FormCheckboxWrapper } from './form-checkbox-wrapper'
import { Loader2 } from 'lucide-react'

type LeaveRequestFormMode = 'create' | 'edit'

export interface LeaveRequestFormProps {
  mode: LeaveRequestFormMode
  defaultValues?: Partial<LeaveRequestCreate | LeaveRequestUpdate>
  onSubmit: (data: LeaveRequestCreate | LeaveRequestUpdate) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  pilots?: SelectOption[]
  showPilotSelect?: boolean
}

export function LeaveRequestForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  pilots = [],
  showPilotSelect = true,
}: LeaveRequestFormProps) {
  // CSRF token for form protection
  const { csrfToken, isLoading: csrfLoading } = useCsrfToken()

  const form = useForm<LeaveRequestCreate | LeaveRequestUpdate>({
    resolver: zodResolver(
      mode === 'create' ? LeaveRequestCreateSchema : LeaveRequestUpdateSchema
    ),
    defaultValues: defaultValues ?? {
      pilot_id: '',
      request_type: undefined,
      start_date: '',
      end_date: '',
      request_date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      request_method: 'ADMIN_PORTAL',
      reason: '',
      is_late_request: false,
    },
  })

  const handleSubmit = async (data: LeaveRequestCreate | LeaveRequestUpdate) => {
    // Note: CSRF token is handled via fetchWithCsrf() in the parent component
    // or via header in API calls. This form passes data to parent onSubmit.
    await onSubmit(data)
  }

  const leaveTypeOptions: SelectOption[] = [
    { label: 'RDO (Regular Day Off)', value: 'RDO' },
    { label: 'SDO (Special Day Off)', value: 'SDO' },
    { label: 'Annual Leave', value: 'ANNUAL' },
    { label: 'Sick Leave', value: 'SICK' },
    { label: 'Long Service Leave', value: 'LSL' },
    { label: 'Leave Without Pay', value: 'LWOP' },
    { label: 'Maternity Leave', value: 'MATERNITY' },
    { label: 'Compassionate Leave', value: 'COMPASSIONATE' },
  ]

  const requestMethodOptions: SelectOption[] = [
    { label: 'Email', value: 'EMAIL' },
    { label: 'Oracle', value: 'ORACLE' },
    { label: 'Leave Bids', value: 'LEAVE_BIDS' },
    { label: 'System', value: 'SYSTEM' },
  ]

  // Calculate if request is late (less than 21 days notice)
  const startDate = form.watch('start_date')
  const requestDate = form.watch('request_date')

  const calculateIsLate = () => {
    if (!startDate || !requestDate) return false
    const start = new Date(startDate)
    const request = new Date(requestDate)
    const daysDiff = Math.ceil((start.getTime() - request.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff < 21
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Leave Request' : 'Edit Leave Request'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Enter the leave request details to create a new request'
            : 'Update the leave request information below'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Request Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showPilotSelect && (
                  <FormSelectWrapper
                    name="pilot_id"
                    label="Pilot"
                    options={pilots}
                    placeholder="Select pilot"
                    required
                    description="Select the pilot making this request"
                  />
                )}
                <FormSelectWrapper
                  name="request_type"
                  label="Leave Type"
                  options={leaveTypeOptions}
                  placeholder="Select leave type"
                  required
                  description="Type of leave being requested"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelectWrapper
                  name="request_method"
                  label="Request Method"
                  options={requestMethodOptions}
                  placeholder="Select method"
                  required
                  description="How the request was submitted"
                />
                <FormDatePickerWrapper
                  name="request_date"
                  label="Request Date"
                  required
                  description="Date when the request was submitted"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Leave Period</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePickerWrapper
                  name="start_date"
                  label="Start Date"
                  required
                  description="First day of leave"
                />
                <FormDatePickerWrapper
                  name="end_date"
                  label="End Date"
                  required
                  description="Last day of leave (inclusive)"
                />
              </div>

              {calculateIsLate() && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ This is a late request (less than 21 days advance notice)
                  </p>
                </div>
              )}

              <FormCheckboxWrapper
                name="is_late_request"
                label="Mark as Late Request"
                description="Check if this request has less than 21 days advance notice"
              />
            </div>

            {/* Reason */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <FormTextareaWrapper
                name="reason"
                label="Reason"
                placeholder="Provide a reason for this leave request..."
                rows={4}
                maxLength={500}
                description="Optional explanation or justification"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading || csrfLoading || !csrfToken}>
              {(isLoading || csrfLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {csrfLoading
                ? 'Loading...'
                : mode === 'create' ? 'Submit Request' : 'Update Request'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
