/**
 * Unified Pilot Form Component
 * Handles both create and edit modes for pilot management
 *
 * Developer: Maurice Rondeau
 *
 * DEDUPLICATION: This form uses useDeduplicatedSubmit to prevent
 * duplicate submissions when users rapidly click the submit button.
 *
 * CSRF PROTECTION: This form includes CSRF token protection for all submissions
 *
 * @version 2.1.0
 * @since 2025-10-17
 * @updated 2025-10-27 - Added CSRF protection
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCsrfToken } from '@/lib/providers/csrf-provider'
import { PilotCreateSchema, PilotUpdateSchema, type PilotCreate, type PilotUpdate } from '@/lib/validations/pilot-validation'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldWrapper } from './form-field-wrapper'
import { FormSelectWrapper } from './form-select-wrapper'
import { FormDatePickerWrapper } from './form-date-picker-wrapper'
import { FormCheckboxWrapper } from './form-checkbox-wrapper'
import { useDeduplicatedSubmit } from '@/lib/hooks/use-deduplicated-submit'
import { Loader2 } from 'lucide-react'

type PilotFormMode = 'create' | 'edit'

export interface PilotFormProps {
  mode: PilotFormMode
  defaultValues?: Partial<PilotCreate | PilotUpdate>
  onSubmit: (data: PilotCreate | PilotUpdate) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function PilotForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: PilotFormProps) {
  // CSRF token for form protection
  const { csrfToken, isLoading: csrfLoading } = useCsrfToken()

  const form = useForm<PilotCreate | PilotUpdate>({
    resolver: zodResolver(mode === 'create' ? PilotCreateSchema : PilotUpdateSchema),
    defaultValues: defaultValues ?? {
      employee_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      role: undefined,
      contract_type: '',
      nationality: '',
      passport_number: '',
      passport_expiry: null,
      date_of_birth: null,
      commencement_date: null,
      seniority_number: null,
      is_active: true,
      captain_qualifications: [],
    },
  })

  // Deduplicated submit handler prevents duplicate submissions
  // when users rapidly click the submit button
  const {
    handleSubmit: deduplicatedSubmit,
    isSubmitting,
  } = useDeduplicatedSubmit(
    async (data: PilotCreate | PilotUpdate) => {
      // Note: CSRF token is handled via fetchWithCsrf() in the parent component
      // or via header in API calls. This form passes data to parent onSubmit.
      await onSubmit(data)
    },
    {
      key: mode === 'create' ? 'pilot-form-create' : `pilot-form-edit-${(defaultValues as any)?.id || 'new'}`,
    }
  )

  const rankOptions = [
    { label: 'Captain', value: 'Captain' },
    { label: 'First Officer', value: 'First Officer' },
  ]

  const selectedRole = form.watch('role')
  const showCaptainQualifications = selectedRole === 'Captain'

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Pilot' : 'Edit Pilot'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Enter the pilot details to create a new record'
            : 'Update the pilot information below'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(deduplicatedSubmit)}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FormFieldWrapper
                  name="employee_id"
                  label="Employee ID"
                  placeholder="123456"
                  required
                  description="6-digit employee identification number"
                />
                <FormSelectWrapper
                  name="role"
                  label="Rank"
                  options={rankOptions}
                  placeholder="Select rank"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4">
                <FormFieldWrapper
                  name="first_name"
                  label="First Name"
                  placeholder="John"
                  required
                />
                <FormFieldWrapper
                  name="middle_name"
                  label="Middle Name"
                  placeholder="Michael"
                />
                <FormFieldWrapper
                  name="last_name"
                  label="Last Name"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FormFieldWrapper
                  name="contract_type"
                  label="Contract Type"
                  placeholder="Permanent"
                />
                <FormDatePickerWrapper
                  name="commencement_date"
                  label="Commencement Date"
                  description="Date pilot started with the airline"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FormFieldWrapper
                  name="seniority_number"
                  label="Seniority Number"
                  type="number"
                  placeholder="1"
                  description="Lower number = higher seniority"
                />
                <FormCheckboxWrapper
                  name="is_active"
                  label="Active Status"
                  description="Is this pilot currently active?"
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FormDatePickerWrapper
                  name="date_of_birth"
                  label="Date of Birth"
                  disableFuture
                  description="Pilot must be at least 18 years old"
                />
                <FormFieldWrapper
                  name="nationality"
                  label="Nationality"
                  placeholder="Australian"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FormFieldWrapper
                  name="passport_number"
                  label="Passport Number"
                  placeholder="AB123456"
                  description="Uppercase letters and numbers only"
                />
                <FormDatePickerWrapper
                  name="passport_expiry"
                  label="Passport Expiry"
                  disablePast
                  description="Must be in the future if provided"
                />
              </div>
            </div>

            {/* Captain Qualifications */}
            {showCaptainQualifications && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Captain Qualifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <FormCheckboxWrapper
                    name="captain_qualifications.line_captain"
                    label="Line Captain"
                    description="Qualified to operate as line captain"
                  />
                  <FormCheckboxWrapper
                    name="captain_qualifications.training_captain"
                    label="Training Captain"
                    description="Authorized to conduct training"
                  />
                  <FormCheckboxWrapper
                    name="captain_qualifications.examiner"
                    label="Examiner"
                    description="Authorized to conduct check rides"
                  />
                  <FormDatePickerWrapper
                    name="captain_qualifications.rhs_captain_expiry"
                    label="RHS Captain Expiry"
                    description="Right-hand seat captain currency expiry"
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading || isSubmitting || csrfLoading || !csrfToken}>
              {(isLoading || isSubmitting || csrfLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? mode === 'create' ? 'Creating...' : 'Updating...'
                : csrfLoading
                ? 'Loading...'
                : mode === 'create' ? 'Create Pilot' : 'Update Pilot'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
