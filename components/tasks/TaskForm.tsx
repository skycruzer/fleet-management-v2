'use client'

/**
 * Task Form Component
 *
 * Form for creating and editing tasks with validation.
 *
 * @spec 001-missing-core-features (US5, T084)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { TaskInputSchema, TaskUpdateSchema, type TaskInput, type TaskUpdate } from '@/lib/validations/task-schema'
import type { TaskWithRelations } from '@/lib/services/task-service'
import type { Database } from '@/types/supabase'

type User = { id: string; email: string; name: string | null }
type Pilot = { id: string; first_name: string; last_name: string; role: 'Captain' | 'First Officer' }
type Category = Database['public']['Tables']['task_categories']['Row']

interface TaskFormProps {
  task?: TaskWithRelations
  users?: User[]
  pilots?: Pilot[]
  categories?: Category[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function TaskForm({ task, users = [], onSuccess, onCancel }: TaskFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { csrfToken } = useCsrfToken()

  const isEdit = !!task

  const form = useForm<TaskInput | TaskUpdate>({
    resolver: async (data, context, options) => {
      // Transform empty strings to undefined before validation
      const transformedData = {
        ...data,
        assigned_to: data.assigned_to === '' ? undefined : data.assigned_to,
        due_date: data.due_date === '' ? undefined : data.due_date,
      }

      // Use the appropriate schema based on edit mode
      const schema = isEdit ? TaskUpdateSchema : TaskInputSchema
      return zodResolver(schema)(transformedData, context, options)
    },
    defaultValues: isEdit
      ? {
          title: task.title,
          description: task.description || '',
          status: task.status as any,
          priority: task.priority as any,
          assigned_to: task.assigned_to || undefined,
          due_date: task.due_date ? task.due_date.split('T')[0] : undefined,
          tags: (task.tags as string[]) || [],
        }
      : {
          title: '',
          description: '',
          priority: 'MEDIUM' as any,
          assigned_to: undefined,
          due_date: undefined,
          tags: [],
        },
  })

  const onSubmit = async (data: TaskInput | TaskUpdate) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEdit ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = isEdit ? 'PATCH' : 'POST'

      // Sanitize: Convert empty strings to null for optional fields
      const sanitizedData = {
        ...data,
        assigned_to: data.assigned_to === '' ? null : data.assigned_to,
        due_date: data.due_date === '' ? null : data.due_date,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify(sanitizedData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to save task')
        return
      }

      // Success - refresh cache BEFORE navigating
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
        // Small delay to ensure cache refresh completes
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/dashboard/tasks')
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
          {...form.register('title')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Task title"
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          {...form.register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Describe the task..."
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Priority and Status (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Priority
          </label>
          <select
            id="priority"
            {...form.register('priority')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          {form.formState.errors.priority && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.priority.message}</p>
          )}
        </div>

        {/* Status (only for edit) */}
        {isEdit && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="status"
              {...form.register('status')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {isEdit && 'status' in form.formState.errors && form.formState.errors.status && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.status.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Assignee and Due Date (Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Assignee */}
        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign To
          </label>
          <select
            id="assigned_to"
            {...form.register('assigned_to')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
          {form.formState.errors.assigned_to && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.assigned_to.message}</p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Due Date
          </label>
          <input
            type="date"
            id="due_date"
            {...form.register('due_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {form.formState.errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.due_date.message}</p>
          )}
        </div>
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
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:hover:bg-primary"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}
