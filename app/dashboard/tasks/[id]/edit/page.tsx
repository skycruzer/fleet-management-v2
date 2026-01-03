/**
 * Task Edit Page
 * Author: Maurice Rondeau
 * Edit existing task with form validation
 */

import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getTaskById } from '@/lib/services/task-service'
import TaskForm from '@/components/tasks/TaskForm'

interface TaskEditPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskEditPage({ params }: TaskEditPageProps) {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const { id } = await params
  const taskResult = await getTaskById(id)

  if (!taskResult.success || !taskResult.data) {
    redirect('/dashboard/tasks')
  }

  const task = taskResult.data

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
        <p className="mt-2 text-gray-600">Update task details and save changes.</p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <TaskForm task={task} />
        </div>
      </div>
    </div>
  )
}
