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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PilotLeaveRequestSchema,
  type PilotLeaveRequestInput,
} from '@/lib/validations/pilot-leave-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-[var(--color-status-low)]" />
        <h3 className="text-xl font-bold text-[var(--color-status-low)]">Request Updated!</h3>
        <p className="text-muted-foreground mt-2">
          Your leave request has been updated successfully.
        </p>
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
        <Controller
          name="request_type"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
              <SelectTrigger
                id="request_type"
                className={form.formState.errors.request_type ? 'border-destructive' : ''}
                aria-invalid={!!form.formState.errors.request_type}
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
        {form.formState.errors.request_type && (
          <p className="text-destructive text-sm">{form.formState.errors.request_type.message}</p>
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
          <p className="text-destructive text-sm">{form.formState.errors.start_date.message}</p>
        )}
      </div>

      {/* End Date */}
      <div className="space-y-2">
        <Label htmlFor="end_date">End Date *</Label>
        <Input id="end_date" type="date" {...form.register('end_date')} disabled={isSubmitting} />
        {form.formState.errors.end_date && (
          <p className="text-destructive text-sm">{form.formState.errors.end_date.message}</p>
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
        <p className="text-muted-foreground text-xs">
          {form.watch('reason')?.length || 0}/500 characters
        </p>
        {form.formState.errors.reason && (
          <p className="text-destructive text-sm">{form.formState.errors.reason.message}</p>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> You can only edit requests with SUBMITTED or IN_REVIEW status. Once
          approved or denied, requests cannot be edited.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 border-t pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Request'}
        </Button>
      </div>
    </form>
  )
}
