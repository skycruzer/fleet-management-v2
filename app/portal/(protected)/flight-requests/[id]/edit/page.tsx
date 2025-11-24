'use client'

/**
 * RDO/SDO Request Edit Page
 *
 * Allows pilots to edit their SUBMITTED RDO/SDO requests.
 *
 * @spec 001-missing-core-features (US3)
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { ArrowLeft, Plane, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const REQUEST_TYPES = [
  {
    value: 'RDO',
    label: 'RDO (Rostered Day Off)',
    description: 'Request a rostered day off',
  },
  {
    value: 'SDO',
    label: 'SDO (Scheduled Day Off)',
    description: 'Request a scheduled day off',
  },
] as const

export default function EditFlightRequestPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [requestData, setRequestData] = useState<any>(null)

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

  // Fetch request data on mount
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setIsFetching(true)
        const response = await fetch('/api/portal/flight-requests')
        const result = await response.json()

        if (!response.ok || !result.success) {
          setError('Failed to load request data')
          setIsFetching(false)
          return
        }

        // Find the specific request
        const request = result.data?.find((r: any) => r.id === requestId)

        if (!request) {
          setError('Request not found')
          setIsFetching(false)
          return
        }

        // Check if request is editable (SUBMITTED only)
        if (request.workflow_status !== 'SUBMITTED') {
          setError('Can only edit submitted requests. This request has already been reviewed or is under review.')
          setIsFetching(false)
          return
        }

        setRequestData(request)

        // Pre-populate form with existing data
        form.reset({
          request_type: request.request_type,
          start_date: request.start_date,
          end_date: request.end_date || '',
          description: request.description || '',
          reason: request.reason || '',
        })

        setIsFetching(false)
      } catch (err) {
        console.error('Fetch request error:', err)
        setError('An unexpected error occurred while loading the request')
        setIsFetching(false)
      }
    }

    fetchRequest()
  }, [requestId, form])

  const onSubmit = async (data: FlightRequestInput) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/portal/flight-requests?id=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to update RDO/SDO request. Please try again.')
        setIsLoading(false)
        return
      }

      // Show success message
      setSuccess(true)
      setIsLoading(false)

      // Refresh cache and redirect to flight requests list after 2 seconds
      setTimeout(() => {
        router.refresh()
        setTimeout(() => {
          router.push('/portal/flight-requests')
        }, 100)
      }, 2000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Show loading state while fetching
  if (isFetching) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-gray-600">Loading request data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if request cannot be edited
  if (error && !requestData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600">Unable to Edit Request</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/portal/flight-requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to RDO/SDO Requests
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <CardTitle className="text-2xl font-bold text-green-600">Request Updated!</CardTitle>
            <CardDescription>Your RDO/SDO request has been updated successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Plane className="h-4 w-4" />
              <AlertDescription>
                The updated request is now awaiting review by fleet management.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">Redirecting to your RDO/SDO requests...</p>
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
          <h1 className="text-3xl font-bold">Edit RDO/SDO Request</h1>
          <p className="mt-1 text-gray-600">
            Update your Rostered Day Off (RDO) or Scheduled Day Off (SDO) request
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>RDO/SDO Request Details</CardTitle>
            <CardDescription>
              Update the information for your RDO/SDO request
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

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register('start_date')}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Select the start date of your RDO/SDO request</p>
              {form.formState.errors.start_date && (
                <p className="text-sm text-red-500">{form.formState.errors.start_date.message}</p>
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
              <p className="text-xs text-gray-500">
                Leave blank for single-day request. For multi-day requests, select the end date (max 90 days)
              </p>
              {form.formState.errors.end_date && (
                <p className="text-sm text-red-500">{form.formState.errors.end_date.message}</p>
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
              <p className="text-xs text-gray-500">
                {form.watch('description')?.length || 0}/2000 characters
                {form.watch('description') && (form.watch('description')?.length ?? 0) < 10 && (form.watch('description')?.length ?? 0) > 0
                  ? ' (minimum 10 characters if provided)'
                  : ''}
              </p>
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
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
              <p className="text-xs text-gray-500">
                {form.watch('reason')?.length || 0}/1000 characters
              </p>
              {form.formState.errors.reason && (
                <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> You can only edit requests with SUBMITTED status. Once reviewed, requests cannot be edited.
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
              {isLoading ? 'Updating...' : 'Update Request'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
