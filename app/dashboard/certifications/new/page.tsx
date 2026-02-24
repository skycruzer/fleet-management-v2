/**
 * Add New Certification Page
 * Form for creating new pilot certification records
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import { CertificationCreateSchema } from '@/lib/validations/certification-validation'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import Link from 'next/link'
import { PilotCombobox } from '@/components/ui/pilot-combobox'

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
    control,
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
      // credentials: 'include' ensures the session cookie is sent
      const [pilotsResponse, checkTypesResponse] = await Promise.all([
        fetch('/api/pilots', { credentials: 'include' }),
        fetch('/api/check-types', { credentials: 'include' }),
      ])

      const pilotsData = await pilotsResponse.json()
      const checkTypesData = await checkTypesResponse.json()

      // Pilots API returns { success: true, data: { pilots: [...], count: N } }
      if (pilotsData.success && pilotsData.data?.pilots) {
        setPilots(pilotsData.data.pilots)
      }

      // Check-types API returns { success: true, data: [...] }
      if (checkTypesData.success && Array.isArray(checkTypesData.data)) {
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
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
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
            <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
              <p className="text-destructive text-sm">{error}</p>
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
                      placeholder="Search for a pilot..."
                      aria-invalid={!!errors.pilot_id}
                      aria-describedby={errors.pilot_id ? 'pilot_id-error' : undefined}
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

              {/* Check Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="check_type_id">
                  Check Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="check_type_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id="check_type_id"
                        aria-invalid={!!errors.check_type_id}
                        aria-describedby={errors.check_type_id ? 'check_type_id-error' : undefined}
                        className={errors.check_type_id ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Select a check type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {checkTypes.map((checkType) => (
                          <SelectItem key={checkType.id} value={checkType.id}>
                            {checkType.check_code} - {checkType.check_description}
                            {checkType.category && ` (${checkType.category})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.check_type_id && (
                  <p id="check_type_id-error" className="text-destructive text-sm">
                    {errors.check_type_id.message}
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
              {/* Completion Date */}
              <div className="space-y-2">
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  {...register('completion_date')}
                  aria-invalid={!!errors.completion_date}
                  aria-describedby={errors.completion_date ? 'completion_date-error' : undefined}
                  className={errors.completion_date ? 'border-destructive' : ''}
                />
                {errors.completion_date && (
                  <p id="completion_date-error" className="text-destructive text-sm">
                    {errors.completion_date.message}
                  </p>
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
                  aria-invalid={!!errors.expiry_date}
                  aria-describedby={errors.expiry_date ? 'expiry_date-error' : undefined}
                  className={errors.expiry_date ? 'border-destructive' : ''}
                />
                {errors.expiry_date && (
                  <p id="expiry_date-error" className="text-destructive text-sm">
                    {errors.expiry_date.message}
                  </p>
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
                  aria-invalid={!!errors.expiry_roster_period}
                  aria-describedby={
                    errors.expiry_roster_period ? 'expiry_roster_period-error' : undefined
                  }
                  className={errors.expiry_roster_period ? 'border-destructive' : ''}
                />
                {errors.expiry_roster_period && (
                  <p id="expiry_roster_period-error" className="text-destructive text-sm">
                    {errors.expiry_roster_period.message}
                  </p>
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
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? 'notes-error' : undefined}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:outline-none ${
                  errors.notes ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors.notes && (
                <p id="notes-error" className="text-destructive text-sm">
                  {errors.notes.message}
                </p>
              )}
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
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Creating...</span>
                </span>
              ) : (
                'Create Certification'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
