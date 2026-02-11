/**
 * Add New Pilot Page
 * Comprehensive form for creating new pilot records
 * Developer: Maurice Rondeau
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { useFormUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { PageBreadcrumbs } from '@/components/navigation/page-breadcrumbs'
import Link from 'next/link'
import { User, Briefcase, FileText, Award, Loader2, Mail } from 'lucide-react'

// Use z.input for form types (before transforms/defaults are applied)
type PilotFormData = z.input<typeof PilotCreateSchema>

interface ContractType {
  id: string
  name: string
  description: string | null
}

const CAPTAIN_QUALIFICATIONS = [
  { value: 'line_captain', label: 'Line Captain' },
  { value: 'training_captain', label: 'Training Captain' },
  { value: 'examiner', label: 'Examiner' },
] as const

export default function NewPilotPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { csrfToken } = useCsrfToken()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [loadingContractTypes, setLoadingContractTypes] = useState(true)

  const { register, handleSubmit, watch, formState, control } = useForm<PilotFormData>({
    resolver: zodResolver(PilotCreateSchema),
    defaultValues: {
      is_active: true,
      role: 'First Officer',
      captain_qualifications: [],
    },
    mode: 'onSubmit', // Validate on submit
  })

  const selectedRole = watch('role')

  // Warn about unsaved changes when navigating away
  useFormUnsavedChanges({ formState }, { skipWarning: isSubmitting })

  // Fetch contract types on component mount
  useEffect(() => {
    async function fetchContractTypes() {
      try {
        const response = await fetch('/api/contract-types')
        const result = await response.json()

        if (result.success && result.data) {
          setContractTypes(result.data)
        }
      } catch (err) {
        console.error('Failed to fetch contract types:', err)
      } finally {
        setLoadingContractTypes(false)
      }
    }

    fetchContractTypes()
  }, [])

  // Handle validation errors from react-hook-form
  interface FieldErrorLike {
    message?: string
    root?: { message?: string }
  }

  const onValidationError = (errors: Record<string, FieldErrorLike>) => {
    console.error('Validation errors:', errors)
    setSubmitAttempted(true)

    // Collect all error messages
    const errorMessages: string[] = []

    // Helper to extract error message from any error object
    const extractMessage = (err: FieldErrorLike | string): string | null => {
      if (typeof err === 'string') return err
      if (err?.message) return err.message
      if (err?.root?.message) return err.root.message
      return null
    }

    // Process all errors
    for (const [_field, err] of Object.entries(errors)) {
      const message = extractMessage(err)
      if (message) {
        errorMessages.push(message)
      }
    }

    // Always set an error message
    if (errorMessages.length > 0) {
      setError(errorMessages[0])
    } else {
      setError('Please check the form for errors and try again.')
    }

    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create pilot')
      }

      // Invalidate TanStack Query cache for pilots
      await queryClient.invalidateQueries({ queryKey: ['pilots'] })
      // Success - refresh cache BEFORE redirecting (Next.js 16 requirement)
      router.refresh()
      // Wait for cache propagation (increased from 100ms to 500ms)
      await new Promise((resolve) => setTimeout(resolve, 500))
      // THEN redirect
      router.push('/dashboard/pilots')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pilot')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <PageBreadcrumbs
        items={[
          { label: 'Admin Dashboard', href: '/dashboard' },
          { label: 'Pilots', href: '/dashboard/pilots' },
          { label: 'Add New Pilot' },
        ]}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Add New Pilot</h2>
          <p className="text-muted-foreground mt-1">Create a new pilot profile</p>
        </div>
        <Link href="/dashboard/pilots">
          <Button variant="outline">&larr; Back to Pilots</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
        {/* Error Messages */}
        {(error || formState.errors.root) && (
          <div className="border-destructive/20 rounded-lg border bg-[var(--color-destructive-muted)] p-4">
            <p className="text-sm text-[var(--color-danger-600)]">
              {error || formState.errors.root?.message}
            </p>
          </div>
        )}

        {/* Show all validation errors summary */}
        {submitAttempted && Object.keys(formState.errors).length > 0 && (
          <div className="rounded-lg border border-[var(--color-status-medium-border)] bg-[var(--color-warning-muted)] p-4">
            <p className="text-sm font-medium text-[var(--color-warning-500)]">
              Please fix the following errors:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-[var(--color-warning-500)]">
              {Object.entries(formState.errors).map(([field, err]) => (
                <li key={field}>
                  <strong>{field.replace(/_/g, ' ')}:</strong> {err?.message || `Invalid ${field}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Basic Information Section */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <User className="text-primary h-5 w-5" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Basic Information</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="employee_id">
                  Employee ID <span className="text-[var(--color-danger-500)]">*</span>
                </Label>
                <Input
                  id="employee_id"
                  type="text"
                  placeholder="e.g., 100001"
                  {...register('employee_id')}
                  className={formState.errors.employee_id ? 'border-[var(--color-danger-500)]' : ''}
                />
                {formState.errors.employee_id && (
                  <p className="text-sm text-[var(--color-danger-600)]">
                    {formState.errors.employee_id.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">Must be 4-6 digits</p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Rank <span className="text-[var(--color-danger-500)]">*</span>
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={formState.errors.role ? 'border-[var(--color-danger-500)]' : ''}
                      >
                        <SelectValue placeholder="Select rank..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Captain">Captain</SelectItem>
                        <SelectItem value="First Officer">First Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {formState.errors.role && (
                  <p className="text-sm text-[var(--color-danger-600)]">
                    {formState.errors.role.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-[var(--color-danger-500)]">*</span>
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="John"
                  {...register('first_name')}
                  className={formState.errors.first_name ? 'border-[var(--color-danger-500)]' : ''}
                />
                {formState.errors.first_name && (
                  <p className="text-sm text-[var(--color-danger-600)]">
                    {formState.errors.first_name.message}
                  </p>
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
                  className={formState.errors.middle_name ? 'border-[var(--color-danger-500)]' : ''}
                />
                {formState.errors.middle_name && (
                  <p className="text-sm text-[var(--color-danger-600)]">
                    {formState.errors.middle_name.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-[var(--color-danger-500)]">*</span>
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Doe"
                  {...register('last_name')}
                  className={formState.errors.last_name ? 'border-[var(--color-danger-500)]' : ''}
                />
                {formState.errors.last_name && (
                  <p className="text-sm text-[var(--color-danger-600)]">
                    {formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Employment Information Section */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-status-low)]/10">
              <Briefcase className="h-5 w-5 text-[var(--color-status-low)]" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Employment Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Contract Type */}
            <div className="space-y-2">
              <Label htmlFor="contract_type">Contract Type</Label>
              <Controller
                name="contract_type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled={loadingContractTypes}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingContractTypes ? 'Loading...' : 'Select contract type...'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {contractTypes.map((ct) => (
                        <SelectItem key={ct.id} value={ct.name}>
                          {ct.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {formState.errors.contract_type && (
                <p className="text-sm text-[var(--color-danger-600)]">
                  {formState.errors.contract_type.message}
                </p>
              )}
            </div>

            {/* Commencement Date */}
            <div className="space-y-2">
              <Label htmlFor="commencement_date">Commencement Date</Label>
              <Input
                id="commencement_date"
                type="date"
                {...register('commencement_date')}
                className={
                  formState.errors.commencement_date ? 'border-[var(--color-danger-500)]' : ''
                }
              />
              {formState.errors.commencement_date && (
                <p className="text-sm text-[var(--color-danger-600)]">
                  {formState.errors.commencement_date.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">Used to calculate seniority</p>
            </div>

            {/* Active Status */}
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(v === 'true')}
                    className="flex h-10 items-center space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="active" />
                      <Label htmlFor="active" className="cursor-pointer font-normal">
                        Active
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="inactive" />
                      <Label htmlFor="inactive" className="cursor-pointer font-normal">
                        Inactive
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
          </div>
        </Card>

        {/* Personal Information Section */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <User className="text-primary h-5 w-5" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
                className={formState.errors.date_of_birth ? 'border-[var(--color-danger-500)]' : ''}
              />
              {formState.errors.date_of_birth && (
                <p className="text-sm text-[var(--color-danger-600)]">
                  {formState.errors.date_of_birth.message}
                </p>
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
                className={formState.errors.nationality ? 'border-[var(--color-danger-500)]' : ''}
              />
              {formState.errors.nationality && (
                <p className="text-sm text-[var(--color-danger-600)]">
                  {formState.errors.nationality.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="pilot@example.com (optional)"
              {...register('email')}
              className={formState.errors.email ? 'border-[var(--color-danger-500)]' : ''}
            />
            {formState.errors.email && (
              <p className="text-sm text-[var(--color-danger-600)]">
                {formState.errors.email.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Used for certification renewal reminders
            </p>
          </div>
        </Card>

        {/* Passport Information Section */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-info)]/10">
              <FileText className="h-5 w-5 text-[var(--color-info)]" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Passport Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Passport Number */}
            <div className="space-y-2">
              <Label htmlFor="passport_number">Passport Number</Label>
              <Input
                id="passport_number"
                type="text"
                placeholder="e.g., P1234567"
                {...register('passport_number')}
                className={
                  formState.errors.passport_number ? 'border-[var(--color-danger-500)]' : ''
                }
              />
              {formState.errors.passport_number && (
                <p className="text-sm text-[var(--color-danger-600)]">
                  {formState.errors.passport_number.message}
                </p>
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
                className={
                  formState.errors.passport_expiry ? 'border-[var(--color-danger-500)]' : ''
                }
              />
              {formState.errors.passport_expiry && (
                <p className="text-sm text-[var(--color-danger-600)]">
                  {formState.errors.passport_expiry.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Required if passport number is provided
              </p>
            </div>
          </div>
        </Card>

        {/* Captain Qualifications Section - Only show if Captain */}
        {selectedRole === 'Captain' && (
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-status-medium)]/10">
                <Award className="h-5 w-5 text-[var(--color-status-medium)]" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">Captain Qualifications</h3>
            </div>

            <div className="space-y-3">
              <Controller
                name="captain_qualifications"
                control={control}
                render={({ field }) => (
                  <>
                    {CAPTAIN_QUALIFICATIONS.map((qual) => {
                      const currentValue = (field.value as string[]) || []
                      const isChecked = currentValue.includes(qual.value)
                      return (
                        <div key={qual.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`qual_${qual.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...currentValue, qual.value])
                              } else {
                                field.onChange(currentValue.filter((v: string) => v !== qual.value))
                              }
                            }}
                          />
                          <Label htmlFor={`qual_${qual.value}`} className="cursor-pointer">
                            {qual.label}
                          </Label>
                        </div>
                      )
                    })}
                  </>
                )}
              />
            </div>

            {formState.errors.captain_qualifications && (
              <p className="mt-2 text-sm text-[var(--color-danger-600)]">
                {formState.errors.captain_qualifications.message}
              </p>
            )}
          </Card>
        )}

        {/* Sticky Bottom Action Bar */}
        <div className="bg-background/95 sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t px-4 py-4 backdrop-blur-sm sm:-mx-0 sm:px-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              if (!isSubmitting) {
                router.push('/dashboard/pilots')
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </span>
            ) : (
              'Create Pilot'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
