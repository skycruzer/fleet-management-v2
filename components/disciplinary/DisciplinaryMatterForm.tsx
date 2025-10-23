'use client'

/**
 * Disciplinary Matter Form Component
 *
 * Form for creating and editing disciplinary matters with validation.
 *
 * @spec 001-missing-core-features (US6, T099)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { DisciplinaryMatterWithRelations } from '@/lib/services/disciplinary-service'

type Pilot = { id: string; first_name: string; last_name: string; role: string; employee_id: string }
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

  const form = useForm<FormData>({
    defaultValues: isEdit
      ? {
          title: matter.title,
          description: matter.description || '',
          pilot_id: matter.pilot_id,
          incident_date: matter.incident_date ? matter.incident_date.split('T')[0] : '',
          incident_type_id: matter.incident_type_id,
          severity: matter.severity,
          status: matter.status,
          assigned_to: matter.assigned_to || undefined,
          aircraft_registration: matter.aircraft_registration || '',
          flight_number: matter.flight_number || '',
          location: matter.location || '',
          corrective_actions: matter.corrective_actions || '',
          impact_on_operations: matter.impact_on_operations || '',
          regulatory_notification_required: matter.regulatory_notification_required || false,
          regulatory_body: matter.regulatory_body || '',
          notification_date: matter.notification_date ? matter.notification_date.split('T')[0] : '',
          due_date: matter.due_date ? matter.due_date.split('T')[0] : '',
          resolution_notes: matter.resolution_notes || '',
        }
      : {
          title: '',
          description: '',
          pilot_id: '',
          incident_date: '',
          incident_type_id: '',
          severity: 'MODERATE',
          status: 'REPORTED',
          assigned_to: undefined,
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEdit ? `/api/disciplinary/${matter.id}` : '/api/disciplinary'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to save matter')
        return
      }

      // Success
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          {...form.register('title', { required: true })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Brief title of the matter"
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-sm text-red-600">Title is required</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...form.register('description', { required: true })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Detailed description of the incident..."
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">Description is required</p>
        )}
      </div>

      {/* Pilot and Incident Date (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Pilot */}
        <div>
          <label htmlFor="pilot_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pilot <span className="text-red-500">*</span>
          </label>
          <select
            id="pilot_id"
            {...form.register('pilot_id', { required: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select pilot</option>
            {pilots.map((pilot) => (
              <option key={pilot.id} value={pilot.id}>
                {pilot.role} {pilot.first_name} {pilot.last_name} ({pilot.employee_id})
              </option>
            ))}
          </select>
          {form.formState.errors.pilot_id && (
            <p className="mt-1 text-sm text-red-600">Pilot is required</p>
          )}
        </div>

        {/* Incident Date */}
        <div>
          <label htmlFor="incident_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Incident Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="incident_date"
            {...form.register('incident_date', { required: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {form.formState.errors.incident_date && (
            <p className="mt-1 text-sm text-red-600">Incident date is required</p>
          )}
        </div>
      </div>

      {/* Incident Type and Severity (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Incident Type */}
        <div>
          <label htmlFor="incident_type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Incident Type <span className="text-red-500">*</span>
          </label>
          <select
            id="incident_type_id"
            {...form.register('incident_type_id', { required: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select incident type</option>
            {incidentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {form.formState.errors.incident_type_id && (
            <p className="mt-1 text-sm text-red-600">Incident type is required</p>
          )}
        </div>

        {/* Severity */}
        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Severity <span className="text-red-500">*</span>
          </label>
          <select
            id="severity"
            {...form.register('severity', { required: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="MINOR">Minor</option>
            <option value="MODERATE">Moderate</option>
            <option value="SERIOUS">Serious</option>
            <option value="CRITICAL">Critical</option>
          </select>
          {form.formState.errors.severity && (
            <p className="mt-1 text-sm text-red-600">Severity is required</p>
          )}
        </div>
      </div>

      {/* Status and Assigned To (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            {...form.register('status', { required: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="REPORTED">Reported</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="PENDING_DECISION">Pending Decision</option>
            <option value="ACTION_TAKEN">Action Taken</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="APPEALED">Appealed</option>
          </select>
          {form.formState.errors.status && (
            <p className="mt-1 text-sm text-red-600">Status is required</p>
          )}
        </div>

        {/* Assigned To */}
        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign To
          </label>
          <select
            id="assigned_to"
            {...form.register('assigned_to')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flight Details (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Aircraft Registration */}
        <div>
          <label htmlFor="aircraft_registration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Aircraft Registration
          </label>
          <input
            type="text"
            id="aircraft_registration"
            {...form.register('aircraft_registration')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., P2-PXA"
          />
        </div>

        {/* Flight Number */}
        <div>
          <label htmlFor="flight_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Flight Number
          </label>
          <input
            type="text"
            id="flight_number"
            {...form.register('flight_number')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., PX101"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <input
            type="text"
            id="location"
            {...form.register('location')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Port Moresby"
          />
        </div>
      </div>

      {/* Dates (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Due Date */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Due Date
          </label>
          <input
            type="date"
            id="due_date"
            {...form.register('due_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Notification Date */}
        <div>
          <label htmlFor="notification_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notification Date
          </label>
          <input
            type="date"
            id="notification_date"
            {...form.register('notification_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Regulatory Information */}
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="regulatory_notification_required"
            {...form.register('regulatory_notification_required')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <label htmlFor="regulatory_notification_required" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Regulatory Notification Required
          </label>
        </div>
      </div>

      {/* Regulatory Body (if checkbox checked) */}
      {form.watch('regulatory_notification_required') && (
        <div>
          <label htmlFor="regulatory_body" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Regulatory Body
          </label>
          <input
            type="text"
            id="regulatory_body"
            {...form.register('regulatory_body')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., PNG CAA"
          />
        </div>
      )}

      {/* Additional Information (Textareas) */}
      <div className="space-y-4">
        {/* Corrective Actions */}
        <div>
          <label htmlFor="corrective_actions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Corrective Actions
          </label>
          <textarea
            id="corrective_actions"
            {...form.register('corrective_actions')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Describe corrective actions taken..."
          />
        </div>

        {/* Impact on Operations */}
        <div>
          <label htmlFor="impact_on_operations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Impact on Operations
          </label>
          <textarea
            id="impact_on_operations"
            {...form.register('impact_on_operations')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Describe impact on operations..."
          />
        </div>

        {/* Resolution Notes (only for edit) */}
        {isEdit && (
          <div>
            <label htmlFor="resolution_notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Resolution Notes
            </label>
            <textarea
              id="resolution_notes"
              {...form.register('resolution_notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Resolution notes..."
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel || (() => router.back())}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Matter' : 'Create Matter'}
        </button>
      </div>
    </form>
  )
}
