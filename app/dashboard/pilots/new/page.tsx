/**
 * Add New Pilot Page
 * Comprehensive form for creating new pilot records
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
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import Link from 'next/link'

type PilotFormData = z.infer<typeof PilotCreateSchema>

interface ContractType {
  id: string
  name: string
  description: string | null
}

export default function NewPilotPage() {
  const router = useRouter()
  const { csrfToken } = useCsrfToken()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [loadingContractTypes, setLoadingContractTypes] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PilotFormData>({
    resolver: zodResolver(PilotCreateSchema),
    defaultValues: {
      is_active: true,
      role: 'First Officer',
    },
  })

  const selectedRole = watch('role')

  // Debug: Log validation errors to console
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('Form validation errors:', errors)
    }
  }, [errors])

  // Fetch contract types on component mount
  useEffect(() => {
    async function fetchContractTypes() {
      try {
        const response = await fetch('/api/contract-types')
        const result = await response.json()

        if (result.success && result.data) {
          setContractTypes(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch contract types:', error)
      } finally {
        setLoadingContractTypes(false)
      }
    }

    fetchContractTypes()
  }, [])

  const onSubmit = async (data: PilotFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/pilots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create pilot')
      }

      // Success - refresh cache BEFORE redirecting (Next.js 16 requirement)
      router.refresh()
      // Wait for cache propagation (increased from 100ms to 500ms)
      await new Promise(resolve => setTimeout(resolve, 500))
      // THEN redirect
      router.push('/dashboard/pilots')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pilot')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Add New Pilot</h2>
          <p className="text-muted-foreground mt-1">Create a new pilot profile</p>
        </div>
        <Link href="/dashboard/pilots">
          <Button variant="outline">← Back to Pilots</Button>
        </Link>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* API Error Message */}
          {error && (
            <div className="border-destructive/20 rounded-lg border bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Validation Errors Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-yellow-800">
                Please fix the following errors:
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    <strong className="capitalize">{field.replace(/_/g, ' ')}:</strong>{' '}
                    {error?.message}
                  </li>
                ))}
              </ul>
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
                  disabled={loadingContractTypes}
                  className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {loadingContractTypes ? 'Loading...' : 'Select contract type...'}
                  </option>
                  {contractTypes.map((ct) => (
                    <option key={ct.id} value={ct.name}>
                      {ct.name}
                    </option>
                  ))}
                </select>
                {errors.contract_type && (
                  <p className="text-sm text-red-600">{errors.contract_type.message}</p>
                )}
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
                      defaultChecked
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
            <Link href="/dashboard/pilots">
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
                'Create Pilot'
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
              <li>
                Fields marked with <span className="text-red-500">*</span> are required
              </li>
              <li>Employee ID must be exactly 6 digits</li>
              <li>Seniority number will be calculated automatically from commencement date</li>
              <li>Captain qualifications are only available for Captains</li>
              <li>Passport expiry must be in the future if passport number is provided</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
