'use client'

/**
 * Leave Request Edit Form Component
 *
 * Allows pilots to edit their SUBMITTED or IN_REVIEW leave requests.
 *
 * Developer: Maurice Rondeau
 * @spec 001-missing-core-features (US2)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PilotLeaveRequestSchema, type PilotLeaveRequestInput } from '@/lib/validations/pilot-leave-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface LeaveRequest {
  id: string
  request_type: 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE'
  start_date: string
  end_date: string
  reason?: string | null
  workflow_status: string
}

interface LeaveRequestEditFormProps {
  request: LeaveRequest
  onSuccess: () => void
  onCancel: () => void
}

export function LeaveRequestEditForm({ request, onSuccess, onCancel }: LeaveRequestEditFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PilotLeaveRequestInput>({
    resolver: zodResolver(PilotLeaveRequestSchema),
    defaultValues: {
      request_type: request.request_type,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason || '',
    },
  })

  const onSubmit = async (data: PilotLeaveRequestInput) => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/portal/leave-requests?id=${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to update leave request. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Show success message
      setSuccess(true)
      setIsSubmitting(false)

      // Refresh cache and call onSuccess after 2 seconds
      setTimeout(() => {
        router.refresh()
        setTimeout(() => {
          onSuccess()
        }, 100)
      }, 2000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="py-8 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
        <h3 className="text-xl font-bold text-green-600">Request Updated!</h3>
        <p className="mt-2 text-gray-600">Your leave request has been updated successfully.</p>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Leave Type */}
      <div className="space-y-2">
        <Label htmlFor="request_type">Leave Type *</Label>
        <select
          id="request_type"
          {...form.register('request_type')}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="ANNUAL">Annual Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="LSL">Long Service Leave (LSL)</option>
          <option value="LWOP">Leave Without Pay (LWOP)</option>
          <option value="MATERNITY">Maternity Leave</option>
          <option value="COMPASSIONATE">Compassionate Leave</option>
        </select>
        {form.formState.errors.request_type && (
          <p className="text-sm text-red-500">{form.formState.errors.request_type.message}</p>
        )}
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="start_date">Start Date *</Label>
        <Input
          id="start_date"
          type="date"
          {...form.register('start_date')}
          disabled={isSubmitting}
        />
        {form.formState.errors.start_date && (
          <p className="text-sm text-red-500">{form.formState.errors.start_date.message}</p>
        )}
      </div>

      {/* End Date */}
      <div className="space-y-2">
        <Label htmlFor="end_date">End Date *</Label>
        <Input
          id="end_date"
          type="date"
          {...form.register('end_date')}
          disabled={isSubmitting}
        />
        {form.formState.errors.end_date && (
          <p className="text-sm text-red-500">{form.formState.errors.end_date.message}</p>
        )}
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">Reason (Optional)</Label>
        <Textarea
          id="reason"
          placeholder="Provide any additional context or reason for your leave request..."
          rows={4}
          maxLength={500}
          {...form.register('reason')}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500">
          {form.watch('reason')?.length || 0}/500 characters
        </p>
        {form.formState.errors.reason && (
          <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> You can only edit requests with SUBMITTED or IN_REVIEW status. Once approved or denied, requests cannot be edited.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Request'}
        </Button>
      </div>
    </form>
  )
}
