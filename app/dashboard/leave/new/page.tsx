/**
 * Submit Leave Request Page
 * Form for pilots to submit leave requests
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LeaveRequestCreateSchema } from '@/lib/validations/leave-validation'
import Link from 'next/link'

type LeaveRequestFormData = z.infer<typeof LeaveRequestCreateSchema>

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
        setPilots(data.data)
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

    // Convert date strings to ISO datetime strings for API
    const formattedData = {
      ...data,
      start_date: new Date(data.start_date + 'T00:00:00Z').toISOString(),
      end_date: new Date(data.end_date + 'T23:59:59Z').toISOString(),
      request_date: new Date(data.request_date + 'T00:00:00Z').toISOString(),
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
            <span className="animate-spin text-3xl">⏳</span>
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
            <div className="border-destructive/20 rounded-lg border bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Validation Errors Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-medium text-red-900">
                ⚠️ Please fix the following errors:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
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
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="mb-2 text-sm font-medium text-yellow-900">⚠️ Date Conflict Detected</p>
              <p className="text-sm text-yellow-700">
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
                  Pilot <span className="text-red-500">*</span>
                </Label>
                <select
                  id="pilot_id"
                  {...register('pilot_id')}
                  className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.pilot_id ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="">Select a pilot...</option>
                  {pilots.map((pilot) => (
                    <option key={pilot.id} value={pilot.id}>
                      {pilot.employee_id} - {pilot.first_name} {pilot.last_name} ({pilot.role})
                    </option>
                  ))}
                </select>
                {errors.pilot_id && (
                  <p className="text-sm text-red-600">{errors.pilot_id.message}</p>
                )}
              </div>

              {/* Leave Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="request_type">
                  Leave Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="request_type"
                  {...register('request_type')}
                  className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.request_type ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="">Select leave type...</option>
                  <option value="RDO">RDO (Regular Day Off)</option>
                  <option value="SDO">SDO (Scheduled Day Off)</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="LSL">Long Service Leave</option>
                  <option value="LWOP">Leave Without Pay</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="COMPASSIONATE">Compassionate Leave</option>
                </select>
                {errors.request_type && (
                  <p className="text-sm text-red-600">{errors.request_type.message}</p>
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
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                  className={`h-11 ${errors.start_date ? 'border-red-500' : ''}`}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date')}
                  min={startDate || undefined}
                  className={`h-11 ${errors.end_date ? 'border-red-500' : ''}`}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-600">{errors.end_date.message}</p>
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
                  Request Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="request_date"
                  type="date"
                  {...register('request_date')}
                  className={`h-11 ${errors.request_date ? 'border-red-500' : ''}`}
                />
                {errors.request_date && (
                  <p className="text-sm text-red-600">{errors.request_date.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Date you are submitting this request
                </p>
              </div>

              {/* Request Method */}
              <div className="space-y-2">
                <Label htmlFor="request_method">
                  Request Method <span className="text-red-500">*</span>
                </Label>
                <select
                  id="request_method"
                  {...register('request_method')}
                  className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.request_method ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="EMAIL">Email</option>
                  <option value="ORACLE">Oracle</option>
                  <option value="LEAVE_BIDS">Leave Bids</option>
                  <option value="SYSTEM">System (Online Form)</option>
                </select>
                {errors.request_method && (
                  <p className="text-sm text-red-600">{errors.request_method.message}</p>
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
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.reason ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
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
                  <span className="animate-spin">⏳</span>
                  <span>Submitting...</span>
                </span>
              ) : (
                'Submit Leave Request'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Help Text */}
      <Card className="bg-primary/5 border-primary/20 p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">Form Tips</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Select your name, leave type, and date range</li>
              <li>End date must be after or equal to start date</li>
              <li>Requests with less than 21 days advance notice are marked as "late"</li>
              <li>Maximum leave duration is 90 days</li>
              <li>The system will check for date conflicts automatically</li>
              <li>Manager/Admin approval required for all leave requests</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
