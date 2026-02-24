/**
 * Submit Leave Request Page
 * Form for pilots to submit leave requests
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeaveRequestCreateSchema } from '@/lib/validations/leave-validation'
import { PilotCombobox } from '@/components/ui/pilot-combobox'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

// Use z.input for form types (before transforms/defaults are applied)
type LeaveRequestFormData = z.input<typeof LeaveRequestCreateSchema>

interface Pilot {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  role: string
}

export default function NewLeaveRequestPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(LeaveRequestCreateSchema),
    defaultValues: {
      request_date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      request_method: 'EMAIL',
      is_late_request: false,
    },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const requestDate = watch('request_date')

  useEffect(() => {
    fetchFormData()
  }, [])

  // Auto-sync end date to start date when start date changes
  useEffect(() => {
    if (startDate && !endDate) {
      setValue('end_date', startDate)
    }
  }, [startDate, endDate, setValue])

  // Auto-calculate late request flag
  useEffect(() => {
    if (requestDate && startDate) {
      const request = new Date(requestDate)
      const start = new Date(startDate)
      const daysDiff = Math.ceil((start.getTime() - request.getTime()) / (1000 * 60 * 60 * 24))
      setValue('is_late_request', daysDiff < 21)
    }
  }, [requestDate, startDate, setValue])

  // Calculate days count
  const calculateDaysCount = (start: string, end: string): number => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Include both start and end dates
  }

  async function fetchFormData() {
    try {
      setLoadingData(true)
      const response = await fetch('/api/pilots')
      const data = await response.json()

      if (data.success) {
        setPilots(data.data.pilots || data.data || [])
      }
    } catch (err) {
      setError('Failed to load form data')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: LeaveRequestFormData) => {
    setIsSubmitting(true)
    setError(null)

    // Send dates as YYYY-MM-DD format (validation expects this format)
    const formattedData = {
      ...data,
      // Dates are already in YYYY-MM-DD format from HTML date inputs
      start_date: data.start_date,
      end_date: data.end_date,
      request_date: data.request_date,
    }
    setConflicts([])

    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create leave request')
      }

      // Check for conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts)
        // Still redirect on success, but show warning
      }

      // Success - redirect to unified requests page
      router.push('/dashboard/requests?tab=leave')
      router.refresh()
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create leave request')
      setIsSubmitting(false)
    }
  }

  // Add error handler for form validation errors
  const onError = (errors: any) => {
    console.error('Form validation errors:', errors)
    setError('Please check all required fields and correct any errors')
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground">Loading form data...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Submit Leave Request</h2>
          <p className="text-muted-foreground mt-1">Request time off from your duty roster</p>
        </div>
        <Link href="/dashboard/requests?tab=leave">
          <Button variant="outline">← Back to Leave Requests</Button>
        </Link>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="border-destructive/20 bg-destructive/5 rounded-lg border p-4"
            >
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Validation Errors Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
              <p className="text-destructive mb-2 text-sm font-medium">
                ⚠️ Please fix the following errors:
              </p>
              <ul className="text-destructive/80 list-inside list-disc space-y-1 text-sm">
                {errors.pilot_id && <li>Pilot selection is required</li>}
                {errors.request_type && <li>Leave type is required</li>}
                {errors.start_date && <li>{errors.start_date.message}</li>}
                {errors.end_date && <li>{errors.end_date.message}</li>}
                {errors.request_date && <li>{errors.request_date.message}</li>}
                {errors.request_method && <li>Request method is required</li>}
                {errors.reason && <li>{errors.reason.message}</li>}
              </ul>
            </div>
          )}

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <div className="border-warning/20 bg-warning/5 rounded-lg border p-4">
              <p className="text-warning mb-2 text-sm font-medium">⚠️ Date Conflict Detected</p>
              <p className="text-warning/80 text-sm">
                You have existing leave requests that overlap with these dates. Manager approval
                required.
              </p>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">Request Details</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Pilot Selection */}
              <div className="space-y-2">
                <Label htmlFor="pilot_id">
                  Pilot <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="pilot_id"
                  control={control}
                  render={({ field }) => (
                    <PilotCombobox
                      pilots={pilots}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a pilot..."
                      className={errors.pilot_id ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.pilot_id && (
                  <p id="pilot_id-error" className="text-destructive text-sm">
                    {errors.pilot_id.message}
                  </p>
                )}
              </div>

              {/* Leave Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="request_type">
                  Leave Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="request_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id="request_type"
                        aria-invalid={!!errors.request_type}
                        aria-describedby={errors.request_type ? 'request_type-error' : undefined}
                        className={errors.request_type ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Select leave type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                        <SelectItem value="SICK">Sick Leave</SelectItem>
                        <SelectItem value="LSL">Long Service Leave</SelectItem>
                        <SelectItem value="LWOP">Leave Without Pay</SelectItem>
                        <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                        <SelectItem value="COMPASSIONATE">Compassionate Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.request_type && (
                  <p id="request_type-error" className="text-destructive text-sm">
                    {errors.request_type.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Date Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Date Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                  aria-invalid={!!errors.start_date}
                  aria-describedby={errors.start_date ? 'start_date-error' : undefined}
                  className={`h-11 ${errors.start_date ? 'border-destructive' : ''}`}
                />
                {errors.start_date && (
                  <p id="start_date-error" className="text-destructive text-sm">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date')}
                  min={startDate || undefined}
                  aria-invalid={!!errors.end_date}
                  aria-describedby={errors.end_date ? 'end_date-error' : undefined}
                  className={`h-11 ${errors.end_date ? 'border-destructive' : ''}`}
                />
                {errors.end_date && (
                  <p id="end_date-error" className="text-destructive text-sm">
                    {errors.end_date.message}
                  </p>
                )}
              </div>

              {/* Days Count (Display Only) */}
              <div className="space-y-2">
                <Label>Days Requested</Label>
                <div className="border-border bg-muted/50 rounded-lg border px-3 py-2">
                  <span className="text-foreground font-medium">
                    {startDate && endDate ? calculateDaysCount(startDate, endDate) : 0} days
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Request Date */}
              <div className="space-y-2">
                <Label htmlFor="request_date">
                  Request Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="request_date"
                  type="date"
                  {...register('request_date')}
                  aria-invalid={!!errors.request_date}
                  aria-describedby={errors.request_date ? 'request_date-error' : undefined}
                  className={`h-11 ${errors.request_date ? 'border-destructive' : ''}`}
                />
                {errors.request_date && (
                  <p id="request_date-error" className="text-destructive text-sm">
                    {errors.request_date.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Date you are submitting this request
                </p>
              </div>

              {/* Request Method */}
              <div className="space-y-2">
                <Label htmlFor="request_method">
                  Request Method <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="request_method"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id="request_method"
                        aria-invalid={!!errors.request_method}
                        aria-describedby={
                          errors.request_method ? 'request_method-error' : undefined
                        }
                        className={errors.request_method ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Select method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                        <SelectItem value="ORACLE">Oracle</SelectItem>
                        <SelectItem value="PILOT_PORTAL">Pilot Portal</SelectItem>
                        <SelectItem value="ADMIN_PORTAL">Admin Portal (This Form)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.request_method && (
                  <p id="request_method-error" className="text-destructive text-sm">
                    {errors.request_method.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Additional Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <textarea
                id="reason"
                {...register('reason')}
                rows={4}
                placeholder="Provide any additional details about this leave request..."
                aria-invalid={!!errors.reason}
                aria-describedby={errors.reason ? 'reason-error' : undefined}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:outline-none ${
                  errors.reason ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors.reason && (
                <p id="reason-error" className="text-destructive text-sm">
                  {errors.reason.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">Maximum 500 characters</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 border-t pt-6">
            <Link href="/dashboard/requests?tab=leave">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Submitting...</span>
                </span>
              ) : (
                'Submit Leave Request'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
