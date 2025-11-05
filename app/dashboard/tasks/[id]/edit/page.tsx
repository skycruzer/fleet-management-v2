/**
 * Task Edit Page
 * Author: Maurice Rondeau
 * Edit existing task with form validation
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTaskById, updateTask } from '@/lib/services/task-service'
import TaskForm from '@/components/tasks/TaskForm'

interface TaskEditPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskEditPage({ params }: TaskEditPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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
