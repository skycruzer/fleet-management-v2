'use client'

/**
 * Flight Request Submission Page
 *
 * Allows pilots to submit flight requests for additional flights,
 * route changes, and schedule swaps.
 *
 * @spec 001-missing-core-features (US3)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
    value: 'additional_flight',
    label: 'Additional Flight',
    description: 'Request to fly additional sectors',
  },
  { value: 'route_change', label: 'Route Change', description: 'Request to change assigned route' },
  {
    value: 'schedule_swap',
    label: 'Schedule Swap',
    description: 'Request to swap with another pilot',
  },
  { value: 'other', label: 'Other', description: 'Other flight-related requests' },
]

export default function NewFlightRequestPage() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FlightRequestInput>({
    resolver: zodResolver(FlightRequestSchema),
    defaultValues: {
      request_type: 'additional_flight',
      route: '',
      start_date: '',
      end_date: '',
      reason: '',
      additional_details: '',
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
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to submit flight request. Please try again.')
        setIsLoading(false)
        return
      }

      // Show success message
      setSuccess(true)
      setIsLoading(false)

      // Redirect to flight requests list after 2 seconds
      setTimeout(() => {
        router.push('/portal/flight-requests')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <CardTitle className="text-2xl font-bold text-green-600">Request Submitted!</CardTitle>
            <CardDescription>Your flight request has been submitted for review.</CardDescription>
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
            <p className="text-sm text-gray-600">Redirecting to your flight requests...</p>
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
          <h1 className="text-3xl font-bold">Submit Flight Request</h1>
          <p className="mt-1 text-gray-600">
            Request additional flights, route changes, or schedule swaps
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Flight Request Details</CardTitle>
            <CardDescription>
              Provide detailed information about your flight request for management review
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
                onValueChange={(value) => form.setValue('request_type', value as any)}
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
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.request_type && (
                <p className="text-sm text-red-500">{form.formState.errors.request_type.message}</p>
              )}
            </div>

            {/* Route */}
            <div className="space-y-2">
              <Label htmlFor="route">Route *</Label>
              <Input
                id="route"
                placeholder="e.g., POM-LAE or describe the route"
                {...form.register('route')}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Enter route in format "XXX-YYY" (airport codes) or describe the route
              </p>
              {form.formState.errors.route && (
                <p className="text-sm text-red-500">{form.formState.errors.route.message}</p>
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

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you are requesting this flight change..."
                rows={4}
                maxLength={1000}
                {...form.register('reason')}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                {form.watch('reason')?.length || 0}/1000 characters (minimum 10 characters)
              </p>
              {form.formState.errors.reason && (
                <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
              )}
            </div>

            {/* Additional Details (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="additional_details">Additional Details (Optional)</Label>
              <Textarea
                id="additional_details"
                placeholder="Any additional information that supports your request..."
                rows={4}
                maxLength={2000}
                {...form.register('additional_details')}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                {form.watch('additional_details')?.length || 0}/2000 characters
              </p>
              {form.formState.errors.additional_details && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.additional_details.message}
                </p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Flight requests are subject to operational requirements, crew
                availability, and regulatory compliance. Approval is not guaranteed.
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
