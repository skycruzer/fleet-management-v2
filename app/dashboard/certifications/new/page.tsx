/**
 * Add New Certification Page
 * Form for creating new pilot certification records
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
import { CertificationCreateSchema } from '@/lib/validations/certification-validation'
import Link from 'next/link'

type CertificationFormData = z.infer<typeof CertificationCreateSchema>

interface Pilot {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  role: string
}

interface CheckType {
  id: string
  check_code: string
  check_description: string
  category: string | null
}

export default function NewCertificationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CertificationFormData>({
    resolver: zodResolver(CertificationCreateSchema),
  })

  useEffect(() => {
    fetchFormData()
  }, [])

  async function fetchFormData() {
    try {
      setLoadingData(true)

      // Fetch pilots and check types in parallel
      const [pilotsResponse, checkTypesResponse] = await Promise.all([
        fetch('/api/pilots'),
        fetch('/api/check-types'),
      ])

      const pilotsData = await pilotsResponse.json()
      const checkTypesData = await checkTypesResponse.json()

      if (pilotsData.success) {
        setPilots(pilotsData.data)
      }

      if (checkTypesData.success) {
        setCheckTypes(checkTypesData.data)
      }
    } catch (err) {
      setError('Failed to load form data')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: CertificationFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert dates to ISO format if they exist
      const formattedData = {
        ...data,
        completion_date: data.completion_date ? new Date(data.completion_date).toISOString() : null,
        expiry_date: data.expiry_date ? new Date(data.expiry_date).toISOString() : null,
      }

      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create certification')
      }

      // Success - redirect to certifications list
      router.push('/dashboard/certifications')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create certification')
      setIsSubmitting(false)
    }
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
          <h2 className="text-foreground text-2xl font-bold">Add New Certification</h2>
          <p className="text-muted-foreground mt-1">Record a new pilot certification</p>
        </div>
        <Link href="/dashboard/certifications">
          <Button variant="outline">← Back to Certifications</Button>
        </Link>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="border-destructive/20 rounded-lg border bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Certification Details
            </h3>

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

              {/* Check Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="check_type_id">
                  Check Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="check_type_id"
                  {...register('check_type_id')}
                  className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.check_type_id ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="">Select a check type...</option>
                  {checkTypes.map((checkType) => (
                    <option key={checkType.id} value={checkType.id}>
                      {checkType.check_code} - {checkType.check_description}
                      {checkType.category && ` (${checkType.category})`}
                    </option>
                  ))}
                </select>
                {errors.check_type_id && (
                  <p className="text-sm text-red-600">{errors.check_type_id.message}</p>
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
              {/* Completion Date */}
              <div className="space-y-2">
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  {...register('completion_date')}
                  className={errors.completion_date ? 'border-red-500' : ''}
                />
                {errors.completion_date && (
                  <p className="text-sm text-red-600">{errors.completion_date.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Cannot be in the future</p>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  {...register('expiry_date')}
                  className={errors.expiry_date ? 'border-red-500' : ''}
                />
                {errors.expiry_date && (
                  <p className="text-sm text-red-600">{errors.expiry_date.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Must be after completion date</p>
              </div>

              {/* Expiry Roster Period */}
              <div className="space-y-2">
                <Label htmlFor="expiry_roster_period">Expiry Roster Period</Label>
                <Input
                  id="expiry_roster_period"
                  type="text"
                  placeholder="e.g., RP12/2025"
                  {...register('expiry_roster_period')}
                  className={errors.expiry_roster_period ? 'border-red-500' : ''}
                />
                {errors.expiry_roster_period && (
                  <p className="text-sm text-red-600">{errors.expiry_roster_period.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Format: RP1-13/YYYY</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Additional Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                placeholder="Add any additional notes about this certification..."
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.notes ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
              <p className="text-muted-foreground text-xs">Maximum 500 characters</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 border-t pt-6">
            <Link href="/dashboard/certifications">
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
                  <span>Creating...</span>
                </span>
              ) : (
                'Create Certification'
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
              <li>Both pilot and check type are required</li>
              <li>Completion date must be today or in the past</li>
              <li>Expiry date must be after the completion date</li>
              <li>Roster period format: RP1/2025 through RP13/2025</li>
              <li>An audit log entry will be created for this certification</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
