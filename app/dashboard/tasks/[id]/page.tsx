/**
 * Task Detail Page
 * Author: Maurice Rondeau
 * Displays individual task details with full metadata
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/services/task-service'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, CheckCircle, Clock } from 'lucide-react'

interface TaskDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
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
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Task Not Found</h1>
        <p className="mt-2 text-gray-600">The task you are looking for does not exist.</p>
        <Link
          href="/dashboard/tasks"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
      </div>
    )
  }

  const task = taskResult.data

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  }

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED'

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <Link
          href={`/dashboard/tasks/${task.id}/edit`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Edit Task
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="mb-4 flex items-start justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <div className="flex gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[task.status] || statusColors.PENDING}`}
              >
                {task.status.replace('_', ' ')}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${priorityColors[task.priority] || priorityColors.MEDIUM}`}
              >
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-b border-gray-200 p-6 md:grid-cols-2">
          {task.assigned_to && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium text-gray-900">{task.assigned_to}</p>
              </div>
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(task.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {isOverdue && <span className="ml-2 text-sm">(Overdue)</span>}
                </p>
              </div>
            </div>
          )}

          {task.created_at && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(task.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {task.completed_date && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="font-medium text-gray-900">
                  {new Date(task.completed_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Description</h2>
          {task.description ? (
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">No description provided</p>
          )}
        </div>

        {task.tags && Object.keys(task.tags as object).length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(task.tags)
                ? (task.tags as string[]).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {tag}
                    </span>
                  ))
                : Object.entries(task.tags as object).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
