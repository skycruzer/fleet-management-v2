'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { FormFieldWrapper } from '@/components/forms/form-field-wrapper'
import { FormSelectWrapper, type SelectOption } from '@/components/forms/form-select-wrapper'
import { FormTextareaWrapper } from '@/components/forms/form-textarea-wrapper'
import { FormCheckboxWrapper } from '@/components/forms/form-checkbox-wrapper'
import { FormDatePickerWrapper } from '@/components/forms/form-date-picker-wrapper'
import { SEVERITY_VALUES, STATUS_VALUES } from '@/lib/validations/disciplinary-schema'
import type { DisciplinaryMatterWithRelations } from '@/lib/services/disciplinary-service'

type Pilot = {
  id: string
  first_name: string
  last_name: string
  role: string
  employee_id: string
}
type User = { id: string; email: string; name: string | null }
type IncidentType = { id: string; name: string; description: string }

interface DisciplinaryMatterFormProps {
  matter?: DisciplinaryMatterWithRelations
  pilots?: Pilot[]
  users?: User[]
  incidentTypes?: IncidentType[]
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  title: string
  description: string
  pilot_id: string
  incident_date: string
  incident_type_id: string
  severity: string
  status: string
  assigned_to?: string
  aircraft_registration?: string
  flight_number?: string
  location?: string
  corrective_actions?: string
  impact_on_operations?: string
  regulatory_notification_required?: boolean
  regulatory_body?: string
  notification_date?: string
  due_date?: string
  resolution_notes?: string
}

const SEVERITY_OPTIONS: SelectOption[] = SEVERITY_VALUES.map((value) => ({
  value,
  label: value.replace(/^./, (c) => c.toUpperCase()),
}))

const STATUS_OPTIONS: SelectOption[] = STATUS_VALUES.map((value) => ({
  value,
  label: value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}))

// Radix Select forbids empty string SelectItem values, so we use a sentinel for "no choice"
// and translate it back to '' at submit time.
const UNASSIGNED = '__unassigned__'

function toDateString(value: string | null | undefined): string {
  if (!value) return ''
  return value.includes('T') ? value.split('T')[0] : value
}

export default function DisciplinaryMatterForm({
  matter,
  pilots = [],
  users = [],
  incidentTypes = [],
  onSuccess,
  onCancel,
}: DisciplinaryMatterFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!matter

  const pilotOptions = useMemo<SelectOption[]>(
    () =>
      pilots.map((p) => ({
        value: p.id,
        label: `${p.role} ${p.first_name} ${p.last_name} (${p.employee_id})`,
      })),
    [pilots]
  )

  const userOptions = useMemo<SelectOption[]>(
    () => [
      { value: UNASSIGNED, label: 'Unassigned' },
      ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
    ],
    [users]
  )

  const incidentTypeOptions = useMemo<SelectOption[]>(
    () => incidentTypes.map((t) => ({ value: t.id, label: t.name })),
    [incidentTypes]
  )

  const form = useForm<FormData>({
    defaultValues: isEdit
      ? {
          title: matter.title,
          description: matter.description || '',
          pilot_id: matter.pilot_id,
          incident_date: toDateString(matter.incident_date),
          incident_type_id: matter.incident_type_id,
          severity: matter.severity,
          status: matter.status,
          assigned_to: matter.assigned_to || UNASSIGNED,
          aircraft_registration: matter.aircraft_registration || '',
          flight_number: matter.flight_number || '',
          location: matter.location || '',
          corrective_actions: matter.corrective_actions || '',
          impact_on_operations: matter.impact_on_operations || '',
          regulatory_notification_required: matter.regulatory_notification_required ?? false,
          regulatory_body: matter.regulatory_body || '',
          notification_date: toDateString(matter.notification_date),
          due_date: toDateString(matter.due_date),
          resolution_notes: matter.resolution_notes || '',
        }
      : {
          title: '',
          description: '',
          pilot_id: '',
          incident_date: '',
          incident_type_id: '',
          severity: 'medium',
          status: 'open',
          assigned_to: UNASSIGNED,
          aircraft_registration: '',
          flight_number: '',
          location: '',
          corrective_actions: '',
          impact_on_operations: '',
          regulatory_notification_required: false,
          regulatory_body: '',
          notification_date: '',
          due_date: '',
          resolution_notes: '',
        },
  })

  const regulatoryRequired = form.watch('regulatory_notification_required')

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEdit ? `/api/disciplinary/${matter.id}` : '/api/disciplinary'
      const method = isEdit ? 'PATCH' : 'POST'

      // Convert empty strings + sentinels to null for nullable fields
      const sanitizedData = {
        ...data,
        assigned_to: !data.assigned_to || data.assigned_to === UNASSIGNED ? null : data.assigned_to,
        incident_type_id: data.incident_type_id || null,
        pilot_id: data.pilot_id || null,
        aircraft_registration: data.aircraft_registration || null,
        flight_number: data.flight_number || null,
        location: data.location || null,
        corrective_actions: data.corrective_actions || null,
        impact_on_operations: data.impact_on_operations || null,
        regulatory_body: data.regulatory_body || null,
        notification_date: data.notification_date || null,
        due_date: data.due_date || null,
        resolution_notes: data.resolution_notes || null,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to save matter')
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/disciplinary')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-foreground text-base font-semibold">Incident</h3>
          <FormFieldWrapper
            name="title"
            label="Title"
            placeholder="Brief title of the matter"
            required
          />
          <FormTextareaWrapper
            name="description"
            label="Description"
            placeholder="Detailed description of the incident…"
            rows={4}
            required
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelectWrapper
              name="pilot_id"
              label="Pilot"
              options={pilotOptions}
              placeholder="Select pilot"
              required
            />
            <FormDatePickerWrapper name="incident_date" label="Incident Date" required />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormFieldWrapper
              name="aircraft_registration"
              label="Aircraft Registration"
              placeholder="e.g., P2-PXA"
            />
            <FormFieldWrapper
              name="flight_number"
              label="Flight Number"
              placeholder="e.g., PX101"
            />
            <FormFieldWrapper name="location" label="Location" placeholder="e.g., Port Moresby" />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-foreground text-base font-semibold">Classification</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelectWrapper
              name="incident_type_id"
              label="Incident Type"
              options={incidentTypeOptions}
              placeholder="Select incident type"
              required
            />
            <FormSelectWrapper
              name="severity"
              label="Severity"
              options={SEVERITY_OPTIONS}
              required
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-foreground text-base font-semibold">Investigation</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelectWrapper name="status" label="Status" options={STATUS_OPTIONS} required />
            <FormSelectWrapper
              name="assigned_to"
              label="Assigned To"
              options={userOptions}
              placeholder="Unassigned"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormDatePickerWrapper name="due_date" label="Due Date" />
            <FormDatePickerWrapper name="notification_date" label="Notification Date" />
          </div>
          <FormCheckboxWrapper
            name="regulatory_notification_required"
            label="Regulatory Notification Required"
          />
          {regulatoryRequired && (
            <FormFieldWrapper
              name="regulatory_body"
              label="Regulatory Body"
              placeholder="e.g., PNG CASA"
              description="Authority that must be notified about this matter."
            />
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-foreground text-base font-semibold">Resolution</h3>
          <FormTextareaWrapper
            name="corrective_actions"
            label="Corrective Actions"
            placeholder="Describe corrective actions taken…"
            rows={3}
          />
          <FormTextareaWrapper
            name="impact_on_operations"
            label="Impact on Operations"
            placeholder="Describe impact on operations…"
            rows={3}
          />
          {isEdit && (
            <FormTextareaWrapper
              name="resolution_notes"
              label="Resolution Notes"
              placeholder="Resolution notes…"
              rows={3}
            />
          )}
        </section>

        {error && (
          <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update Matter' : 'Create Matter'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
