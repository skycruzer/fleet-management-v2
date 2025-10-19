/**
 * Edit Pilot Page
 * Comprehensive form for updating pilot records
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PilotUpdateSchema } from '@/lib/validations/pilot-validation'
import Link from 'next/link'

type PilotFormData = z.infer<typeof PilotUpdateSchema>

interface Pilot {
  id: string
  employee_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  role: 'Captain' | 'First Officer'
  is_active: boolean
  seniority_number: number | null
  date_of_birth: string | null
  commencement_date: string | null
  nationality: string | null
  passport_number: string | null
  passport_expiry: string | null
  contract_type: string | null
  captain_qualifications: any
}

export default function EditPilotPage() {
  const router = useRouter()
  const params = useParams()
  const pilotId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pilot, setPilot] = useState<Pilot | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PilotFormData>({
    resolver: zodResolver(PilotUpdateSchema),
  })

  const selectedRole = watch('role')

  useEffect(() => {
    if (pilotId) {
      fetchPilotData()
    }
  }, [pilotId])

  async function fetchPilotData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/pilots/${pilotId}`)
      const data = await response.json()

      if (data.success) {
        setPilot(data.data)

        // Parse captain qualifications
        let captainQuals: ('line_captain' | 'training_captain' | 'examiner')[] = []
        if (data.data.captain_qualifications) {
          const quals = data.data.captain_qualifications
          if (Array.isArray(quals)) {
            captainQuals = quals as ('line_captain' | 'training_captain' | 'examiner')[]
          } else if (typeof quals === 'object') {
            if (quals.line_captain) captainQuals.push('line_captain')
            if (quals.training_captain) captainQuals.push('training_captain')
            if (quals.examiner) captainQuals.push('examiner')
          }
        }

        // Format dates to YYYY-MM-DD for input fields
        const formatDateForInput = (dateString: string | null) => {
          if (!dateString) return ''
          return new Date(dateString).toISOString().split('T')[0]
        }

        // Reset form with pilot data
        reset({
          employee_id: data.data.employee_id,
          first_name: data.data.first_name,
          middle_name: data.data.middle_name || '',
          last_name: data.data.last_name,
          role: data.data.role,
          contract_type: data.data.contract_type || '',
          nationality: data.data.nationality || '',
          passport_number: data.data.passport_number || '',
          passport_expiry: formatDateForInput(data.data.passport_expiry),
          date_of_birth: formatDateForInput(data.data.date_of_birth),
          commencement_date: formatDateForInput(data.data.commencement_date),
          is_active: data.data.is_active,
          captain_qualifications: captainQuals,
        })
      } else {
        setError(data.error || 'Failed to fetch pilot data')
      }
    } catch (err) {
      setError('Failed to fetch pilot data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PilotFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert date strings to ISO format if they exist
      const formattedData = {
        ...data,
        passport_expiry: data.passport_expiry ? new Date(data.passport_expiry).toISOString() : null,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString() : null,
        commencement_date: data.commencement_date
          ? new Date(data.commencement_date).toISOString()
          : null,
      }

      const response = await fetch(`/api/pilots/${pilotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update pilot')
      }

      // Success - redirect to pilot detail page
      router.push(`/dashboard/pilots/${pilotId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pilot')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className="animate-spin text-3xl">⏳</span>
            <p className="text-muted-foreground">Loading pilot data...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error && !pilot) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <span className="text-6xl">❌</span>
            <div>
              <h3 className="text-foreground mb-2 text-xl font-bold">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Link href="/dashboard/pilots">
              <Button variant="outline">← Back to Pilots</Button>
            </Link>
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
          <h2 className="text-foreground text-2xl font-bold">Edit Pilot</h2>
          <p className="text-muted-foreground mt-1">
            Update pilot profile for {pilot?.first_name} {pilot?.last_name}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/dashboard/pilots/${pilotId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="employee_id">
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employee_id"
                  type="text"
                  placeholder="e.g., 100001"
                  {...register('employee_id')}
                  className={errors.employee_id ? 'border-red-500' : ''}
                />
                {errors.employee_id && (
                  <p className="text-sm text-red-600">{errors.employee_id.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Must be exactly 6 digits</p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Rank <span className="text-red-500">*</span>
                </Label>
                <select
                  id="role"
                  {...register('role')}
                  className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.role ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="Captain">Captain</option>
                  <option value="First Officer">First Officer</option>
                </select>
                {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="John"
                  {...register('first_name')}
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              {/* Middle Name */}
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  type="text"
                  placeholder="Michael (optional)"
                  {...register('middle_name')}
                  className={errors.middle_name ? 'border-red-500' : ''}
                />
                {errors.middle_name && (
                  <p className="text-sm text-red-600">{errors.middle_name.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Doe"
                  {...register('last_name')}
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Employment Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Contract Type */}
              <div className="space-y-2">
                <Label htmlFor="contract_type">Contract Type</Label>
                <select
                  id="contract_type"
                  {...register('contract_type')}
                  className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select contract type...</option>
                  <option value="Fixed Term">Fixed Term</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              {/* Commencement Date */}
              <div className="space-y-2">
                <Label htmlFor="commencement_date">Commencement Date</Label>
                <Input
                  id="commencement_date"
                  type="date"
                  {...register('commencement_date')}
                  className={errors.commencement_date ? 'border-red-500' : ''}
                />
                {errors.commencement_date && (
                  <p className="text-sm text-red-600">{errors.commencement_date.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Used to calculate seniority</p>
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label htmlFor="is_active">Employment Status</Label>
                <div className="flex h-10 items-center space-x-4">
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="radio"
                      value="true"
                      {...register('is_active', {
                        setValueAs: (v) => v === 'true',
                      })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-card-foreground text-sm font-medium">Active</span>
                  </label>
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="radio"
                      value="false"
                      {...register('is_active', {
                        setValueAs: (v) => v === 'true',
                      })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-card-foreground text-sm font-medium">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register('date_of_birth')}
                  className={errors.date_of_birth ? 'border-red-500' : ''}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-red-600">{errors.date_of_birth.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Must be at least 18 years old</p>
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  type="text"
                  placeholder="e.g., Papua New Guinean"
                  {...register('nationality')}
                  className={errors.nationality ? 'border-red-500' : ''}
                />
                {errors.nationality && (
                  <p className="text-sm text-red-600">{errors.nationality.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Passport Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              Passport Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Passport Number */}
              <div className="space-y-2">
                <Label htmlFor="passport_number">Passport Number</Label>
                <Input
                  id="passport_number"
                  type="text"
                  placeholder="e.g., P1234567"
                  {...register('passport_number')}
                  className={errors.passport_number ? 'border-red-500' : ''}
                />
                {errors.passport_number && (
                  <p className="text-sm text-red-600">{errors.passport_number.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Uppercase letters and numbers only</p>
              </div>

              {/* Passport Expiry */}
              <div className="space-y-2">
                <Label htmlFor="passport_expiry">Passport Expiry Date</Label>
                <Input
                  id="passport_expiry"
                  type="date"
                  {...register('passport_expiry')}
                  className={errors.passport_expiry ? 'border-red-500' : ''}
                />
                {errors.passport_expiry && (
                  <p className="text-sm text-red-600">{errors.passport_expiry.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Required if passport number is provided
                </p>
              </div>
            </div>
          </div>

          {/* Captain Qualifications Section - Only show if Captain */}
          {selectedRole === 'Captain' && (
            <div className="space-y-4">
              <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
                Captain Qualifications
              </h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="qual_line_captain"
                    value="line_captain"
                    {...register('captain_qualifications')}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="qual_line_captain" className="cursor-pointer">
                    Line Captain
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="qual_training_captain"
                    value="training_captain"
                    {...register('captain_qualifications')}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="qual_training_captain" className="cursor-pointer">
                    Training Captain
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="qual_examiner"
                    value="examiner"
                    {...register('captain_qualifications')}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="qual_examiner" className="cursor-pointer">
                    Examiner
                  </Label>
                </div>
              </div>

              {errors.captain_qualifications && (
                <p className="text-sm text-red-600">{errors.captain_qualifications.message}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 border-t pt-6">
            <Link href={`/dashboard/pilots/${pilotId}`}>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Updating...</span>
                </span>
              ) : (
                'Update Pilot'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Help Text */}
      <Card className="border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">Form Tips</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Seniority number will be recalculated if commencement date changes</li>
              <li>Changing role to First Officer will remove captain qualifications</li>
              <li>All changes will be saved to the database immediately</li>
              <li>An audit log entry will be created for this update</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
