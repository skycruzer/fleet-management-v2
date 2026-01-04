'use client'

/**
 * Action Form Component
 *
 * Form for adding new disciplinary actions to a matter.
 *
 * @spec 001-missing-core-features (US6, T101)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

type User = { id: string; email: string; name: string | null }

interface ActionFormProps {
  matterId: string
  users?: User[]
  onSuccess?: () => void
}

interface FormData {
  action_type: string
  action_date: string
  action_time?: string
  description: string
  issued_by: string
  location?: string
  warning_level?: string
  suspension_days?: number
  effective_date?: string
  expiry_date?: string
  appeal_deadline?: string
  follow_up_required?: boolean
  follow_up_date?: string
  action_notes?: string
  status: string
}

export default function ActionForm({ matterId, users = [], onSuccess }: ActionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<FormData>({
    defaultValues: {
      action_type: 'VERBAL_WARNING',
      action_date: new Date().toISOString().split('T')[0],
      action_time: '',
      description: '',
      issued_by: '',
      location: '',
      warning_level: '',
      suspension_days: undefined,
      effective_date: '',
      expiry_date: '',
      appeal_deadline: '',
      follow_up_required: false,
      follow_up_date: '',
      action_notes: '',
      status: 'PENDING',
    },
  })

  const actionType = form.watch('action_type')

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/disciplinary/${matterId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to add action')
        return
      }

      // Success
      setSuccess(true)
      form.reset()

      // Refresh page to show new action
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Action Type and Date (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Action Type */}
        <div>
          <label
            htmlFor="action_type"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Action Type <span className="text-red-500">*</span>
          </label>
          <select
            id="action_type"
            {...form.register('action_type', { required: true })}
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="VERBAL_WARNING">Verbal Warning</option>
            <option value="WRITTEN_WARNING">Written Warning</option>
            <option value="SUSPENSION">Suspension</option>
            <option value="DEMOTION">Demotion</option>
            <option value="TERMINATION">Termination</option>
            <option value="REMEDIAL_TRAINING">Remedial Training</option>
            <option value="COUNSELING">Counseling</option>
            <option value="MONITORING">Monitoring</option>
            <option value="OTHER">Other</option>
          </select>
          {form.formState.errors.action_type && (
            <p className="mt-1 text-sm text-red-600">Action type is required</p>
          )}
        </div>

        {/* Action Date */}
        <div>
          <label
            htmlFor="action_date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Action Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="action_date"
            {...form.register('action_date', { required: true })}
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {form.formState.errors.action_date && (
            <p className="mt-1 text-sm text-red-600">Action date is required</p>
          )}
        </div>
      </div>

      {/* Issued By and Time (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Issued By */}
        <div>
          <label
            htmlFor="issued_by"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Issued By <span className="text-red-500">*</span>
          </label>
          <select
            id="issued_by"
            {...form.register('issued_by', { required: true })}
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
          {form.formState.errors.issued_by && (
            <p className="mt-1 text-sm text-red-600">Issuer is required</p>
          )}
        </div>

        {/* Action Time */}
        <div>
          <label
            htmlFor="action_time"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Time (Optional)
          </label>
          <input
            type="time"
            id="action_time"
            {...form.register('action_time')}
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...form.register('description', { required: true })}
          rows={3}
          className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Describe the action taken..."
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">Description is required</p>
        )}
      </div>

      {/* Location and Status (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            {...form.register('location')}
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Port Moresby"
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Status
          </label>
          <select
            id="status"
            {...form.register('status')}
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Conditional Fields Based on Action Type */}
      {(actionType === 'VERBAL_WARNING' || actionType === 'WRITTEN_WARNING') && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Warning Level */}
          <div>
            <label
              htmlFor="warning_level"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Warning Level
            </label>
            <select
              id="warning_level"
              {...form.register('warning_level')}
              className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select level</option>
              <option value="FIRST">First Warning</option>
              <option value="SECOND">Second Warning</option>
              <option value="FINAL">Final Warning</option>
            </select>
          </div>

          {/* Appeal Deadline */}
          <div>
            <label
              htmlFor="appeal_deadline"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Appeal Deadline
            </label>
            <input
              type="date"
              id="appeal_deadline"
              {...form.register('appeal_deadline')}
              className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      {actionType === 'SUSPENSION' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Suspension Days */}
          <div>
            <label
              htmlFor="suspension_days"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Suspension Days
            </label>
            <input
              type="number"
              id="suspension_days"
              {...form.register('suspension_days', { valueAsNumber: true })}
              className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Number of days"
            />
          </div>

          {/* Effective Date */}
          <div>
            <label
              htmlFor="effective_date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Effective Date
            </label>
            <input
              type="date"
              id="effective_date"
              {...form.register('effective_date')}
              className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label
              htmlFor="expiry_date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Expiry Date
            </label>
            <input
              type="date"
              id="expiry_date"
              {...form.register('expiry_date')}
              className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Follow-up Required */}
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="follow_up_required"
            {...form.register('follow_up_required')}
            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          />
          <label
            htmlFor="follow_up_required"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Follow-up Required
          </label>
        </div>
      </div>

      {/* Follow-up Date (if checkbox checked) */}
      {form.watch('follow_up_required') && (
        <div>
          <label
            htmlFor="follow_up_date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Follow-up Date
          </label>
          <input
            type="date"
            id="follow_up_date"
            {...form.register('follow_up_date')}
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      {/* Action Notes */}
      <div>
        <label
          htmlFor="action_notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Additional Notes
        </label>
        <textarea
          id="action_notes"
          {...form.register('action_notes')}
          rows={3}
          className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Any additional notes or context..."
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">Action added successfully!</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => form.reset()}
          className="focus:ring-primary rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 focus:ring-primary dark:bg-primary dark:hover:bg-primary rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add Action'}
        </button>
      </div>
    </form>
  )
}
