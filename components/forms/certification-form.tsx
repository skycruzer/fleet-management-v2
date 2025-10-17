/**
 * Unified Certification Form Component
 * Handles both create and edit modes for certification management
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CertificationCreateSchema,
  CertificationUpdateSchema,
  type CertificationCreate,
  type CertificationUpdate,
} from '@/lib/validations/certification-validation'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormSelectWrapper, type SelectOption } from './form-select-wrapper'
import { FormDatePickerWrapper } from './form-date-picker-wrapper'
import { FormTextareaWrapper } from './form-textarea-wrapper'
import { FormFieldWrapper } from './form-field-wrapper'
import { Loader2 } from 'lucide-react'

type CertificationFormMode = 'create' | 'edit'

export interface CertificationFormProps {
  mode: CertificationFormMode
  defaultValues?: Partial<CertificationCreate | CertificationUpdate>
  onSubmit: (data: CertificationCreate | CertificationUpdate) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  pilots?: SelectOption[]
  checkTypes?: SelectOption[]
  showPilotSelect?: boolean
}

export function CertificationForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  pilots = [],
  checkTypes = [],
  showPilotSelect = true,
}: CertificationFormProps) {
  const form = useForm<CertificationCreate | CertificationUpdate>({
    resolver: zodResolver(mode === 'create' ? CertificationCreateSchema : CertificationUpdateSchema),
    defaultValues: defaultValues ?? {
      pilot_id: '',
      check_type_id: '',
      completion_date: null,
      expiry_date: null,
      expiry_roster_period: '',
      notes: '',
    },
  })

  const handleSubmit = async (data: CertificationCreate | CertificationUpdate) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Add New Certification' : 'Edit Certification'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Enter the certification details to create a new record'
            : 'Update the certification information below'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Pilot and Check Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Certification Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showPilotSelect && (
                  <FormSelectWrapper
                    name="pilot_id"
                    label="Pilot"
                    options={pilots}
                    placeholder="Select pilot"
                    required
                    description="Select the pilot for this certification"
                  />
                )}
                <FormSelectWrapper
                  name="check_type_id"
                  label="Check Type"
                  options={checkTypes}
                  placeholder="Select check type"
                  required
                  description="Type of certification or check"
                />
              </div>
            </div>

            {/* Date Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Date Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePickerWrapper
                  name="completion_date"
                  label="Completion Date"
                  disableFuture
                  description="Date when the check was completed"
                />
                <FormDatePickerWrapper
                  name="expiry_date"
                  label="Expiry Date"
                  description="Date when this certification expires"
                />
              </div>

              <FormFieldWrapper
                name="expiry_roster_period"
                label="Expiry Roster Period"
                placeholder="RP12/2025"
                description="Format: RP1/2025 through RP13/2025"
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <FormTextareaWrapper
                name="notes"
                label="Notes"
                placeholder="Add any additional notes or comments..."
                rows={4}
                maxLength={500}
                description="Optional notes about this certification"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Certification' : 'Update Certification'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
