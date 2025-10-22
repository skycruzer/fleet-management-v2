import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTaskById, getTaskCategories } from '@/lib/services/task-service'
import TaskForm from '@/components/tasks/TaskForm'
import Link from 'next/link'

/**
 * Task Detail/Edit Page (Admin)
 *
 * View and edit task details.
 *
 * @spec 001-missing-core-features (US5)
 */

interface TaskDetailPageProps {
  params: {
    id: string
  }
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.id)) {
    notFound()
  }

  // Fetch task
  const taskResult = await getTaskById(params.id)

  if (!taskResult.success || !taskResult.data) {
    notFound()
  }

  const task = taskResult.data

  // Fetch users for assignment
  const { data: users } = await supabase
    .from('an_users')
    .select('id, email, full_name')
    .order('full_name', { ascending: true })

  // Fetch pilots for task relations
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, rank')
    .order('last_name', { ascending: true })

  // Fetch categories
  const categoriesResult = await getTaskCategories()
  const categories = categoriesResult.success ? categoriesResult.data : []

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'DONE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Tasks
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
            {task.created_at && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Created {new Date(task.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Metadata */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Task Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</p>
            <p className="mt-1 text-gray-900 dark:text-white">
              {task.created_user?.full_name || task.created_user?.email || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned To</p>
            <p className="mt-1 text-gray-900 dark:text-white">
              {task.assigned_user?.full_name || task.assigned_user?.email || 'Unassigned'}
            </p>
          </div>
          {task.category && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
              <p className="mt-1 text-gray-900 dark:text-white">{task.category.name}</p>
            </div>
          )}
          {task.related_pilot && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Related Pilot</p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {task.related_pilot.rank} {task.related_pilot.first_name} {task.related_pilot.last_name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h2>
        <TaskForm task={task} users={users || []} pilots={pilots || []} categories={categories} />
      </div>

      {/* Subtasks Section */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Subtasks ({task.subtasks.length})
          </h2>
          <div className="space-y-2">
            {task.subtasks.map((subtask) => (
              <Link
                key={subtask.id}
                href={`/dashboard/tasks/${subtask.id}`}
                className="flex items-center justify-between rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900/50"
              >
                <span className="text-gray-900 dark:text-white">{subtask.title}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(subtask.status)}`}>
                  {subtask.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
