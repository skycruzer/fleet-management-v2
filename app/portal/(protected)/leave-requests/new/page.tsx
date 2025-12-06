'use client'

/**
 * Leave Request Submission Page
 *
 * Allows pilots to submit new leave requests with date selection
 * and automatic late request flag calculation.
 *
 * @spec 001-missing-core-features (US2)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PilotLeaveRequestSchema,
  type PilotLeaveRequestInput,
} from '@/lib/validations/pilot-leave-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const LEAVE_TYPES = [
  { value: 'RDO', label: 'RDO - Rostered Day Off' },
  { value: 'SDO', label: 'SDO - Scheduled Day Off' },
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'LSL', label: 'Long Service Leave' },
  { value: 'LWOP', label: 'Leave Without Pay' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'COMPASSIONATE', label: 'Compassionate Leave' },
]

export default function NewLeaveRequestPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLateRequest, setIsLateRequest] = useState(false)

  const form = useForm<PilotLeaveRequestInput>({
    resolver: zodResolver(PilotLeaveRequestSchema),
    defaultValues: {
      request_type: 'ANNUAL',
      start_date: '',
      end_date: '',
      reason: '',
    },
  })

  // Check if request is late (less than 21 days advance notice)
  const checkLateRequest = (startDate: string) => {
    if (!startDate) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(startDate)
    const daysDiff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    setIsLateRequest(daysDiff < 21)
  }

  const onSubmit = async (data: PilotLeaveRequestInput) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/portal/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        // Handle error - ensure we display a string, not an object
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || 'Failed to submit leave request. Please try again.'
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      // Show success message
      setSuccess(true)
      setIsLoading(false)

      // Wait for user to see success, then refresh cache and redirect
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // Invalidate TanStack Query cache
      await queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      // CRITICAL: Refresh cache BEFORE navigation (Next.js 16 requirement)
      router.refresh()
      await new Promise((resolve) => setTimeout(resolve, 300))
      router.push('/portal/leave-requests')
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">Request Submitted!</CardTitle>
            <CardDescription>Your leave request has been submitted for review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                You will receive a notification once your request is reviewed by fleet management.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">Redirecting to your leave requests...</p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/leave-requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Submit Leave Request</h1>
          <p className="mt-1 text-gray-600">Request time off from your roster</p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Leave Request Details</CardTitle>
            <CardDescription>Submit your leave request for management approval</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLateRequest && (
              <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  This is a late request (less than 21 days advance notice). Approval is subject to
                  operational requirements.
                </AlertDescription>
              </Alert>
            )}

            {/* Leave Type */}
            <div className="space-y-2">
              <Label htmlFor="request_type">Leave Type *</Label>
              <Select
                onValueChange={(value) => form.setValue('request_type', value as any)}
                defaultValue={form.getValues('request_type')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.request_type && (
                <p className="text-sm text-red-500">{form.formState.errors.request_type.message}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...form.register('start_date')}
                  onChange={(e) => {
                    form.register('start_date').onChange(e)
                    checkLateRequest(e.target.value)
                  }}
                  disabled={isLoading}
                />
                {form.formState.errors.start_date && (
                  <p className="text-sm text-red-500">{form.formState.errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...form.register('end_date')}
                  disabled={isLoading}
                />
                {form.formState.errors.end_date && (
                  <p className="text-sm text-red-500">{form.formState.errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* Reason (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Provide additional context for your leave request..."
                rows={4}
                maxLength={500}
                {...form.register('reason')}
                disabled={isLoading}
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
                <strong>Important:</strong> Leave requests should be submitted at least 21 days in
                advance. Late requests may be denied based on operational requirements.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Link href="/portal/leave-requests">
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
