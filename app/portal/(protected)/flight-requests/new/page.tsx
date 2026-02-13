'use client'

/**
 * RDO/SDO Request Submission Page
 *
 * Allows pilots to submit RDO (Rostered Day Off) and SDO (Substitute Day Off) requests.
 *
 * @spec 001-missing-core-features (US3)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FlightRequestSchema,
  type FlightRequestInput,
} from '@/lib/validations/flight-request-schema'
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
import { ArrowLeft, Plane, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const REQUEST_TYPES = [
  {
    value: 'RDO',
    label: 'RDO (Rostered Day Off)',
    description: 'Request a rostered day off',
  },
  {
    value: 'SDO',
    label: 'SDO (Substitute Day Off)',
    description: 'Request a scheduled day off',
  },
] as const

export default function NewFlightRequestPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FlightRequestInput>({
    resolver: zodResolver(FlightRequestSchema),
    defaultValues: {
      request_type: 'RDO',
      start_date: '',
      end_date: '',
      description: '',
      reason: '',
    },
  })

  const onSubmit = async (data: FlightRequestInput) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/portal/flight-requests', {
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
            : result.error?.message || 'Failed to submit RDO/SDO request. Please try again.'
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
      await queryClient.invalidateQueries({ queryKey: ['flight-requests'] })
      // CRITICAL: Refresh cache BEFORE navigation (Next.js 16 requirement)
      router.refresh()
      await new Promise((resolve) => setTimeout(resolve, 300))
      router.push('/portal/requests?tab=rdo-sdo')
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
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-[var(--color-success-600)]" />
            <CardTitle className="text-2xl font-bold text-[var(--color-success-600)]">
              Request Submitted!
            </CardTitle>
            <CardDescription>Your RDO/SDO request has been submitted for review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Plane className="h-4 w-4" />
              <AlertDescription>
                Fleet management will review your request and notify you of their decision.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-muted-foreground text-sm">Redirecting to your RDO/SDO requests...</p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/flight-requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Submit RDO/SDO Request</h1>
          <p className="text-muted-foreground mt-1">
            Request a Rostered Day Off (RDO) or Substitute Day Off (SDO)
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>RDO/SDO Request Details</CardTitle>
            <CardDescription>
              Provide detailed information about your RDO/SDO request for management review
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Request Type */}
            <div className="space-y-2">
              <Label htmlFor="request_type">Request Type *</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue('request_type', value as FlightRequestInput['request_type'])
                }
                defaultValue={form.getValues('request_type')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-muted-foreground text-xs">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.request_type && (
                <p className="text-sm text-[var(--color-danger-500)]">
                  {form.formState.errors.request_type.message}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register('start_date')}
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                Select the start date of your RDO/SDO request
              </p>
              {form.formState.errors.start_date && (
                <p className="text-sm text-[var(--color-danger-500)]">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register('end_date')}
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                Leave blank for single-day request. For multi-day requests, select the end date (max
                90 days)
              </p>
              {form.formState.errors.end_date && (
                <p className="text-sm text-[var(--color-danger-500)]">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide additional details about your RDO/SDO request (optional)..."
                rows={4}
                maxLength={2000}
                {...form.register('description')}
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                {form.watch('description')?.length || 0}/2000 characters
                {form.watch('description') &&
                (form.watch('description')?.length ?? 0) < 10 &&
                (form.watch('description')?.length ?? 0) > 0
                  ? ' (minimum 10 characters if provided)'
                  : ''}
              </p>
              {form.formState.errors.description && (
                <p className="text-sm text-[var(--color-danger-500)]">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Reason (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Additional reasoning for your request..."
                rows={3}
                maxLength={1000}
                {...form.register('reason')}
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                {form.watch('reason')?.length || 0}/1000 characters
              </p>
              {form.formState.errors.reason && (
                <p className="text-sm text-[var(--color-danger-500)]">
                  {form.formState.errors.reason.message}
                </p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> RDO/SDO requests are subject to operational requirements and
                crew availability. Submit requests at least 21 days in advance for best approval
                chances.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Link href="/portal/flight-requests">
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
