import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTasks, getTaskStats } from '@/lib/services/task-service'
import TaskKanban from '@/components/tasks/TaskKanban'
import TaskList from '@/components/tasks/TaskList'
import Link from 'next/link'
// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'


/**
 * Task Management Dashboard (Admin)
 *
 * Main task management page with Kanban board and list views.
 * Displays task statistics and allows switching between views.
 *
 * @spec 001-missing-core-features (US5, T082, T083)
 */

interface TasksPageProps {
  searchParams: Promise<{
    view?: 'kanban' | 'list'
  }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const view = params.view || 'kanban'

  // Fetch tasks and stats
  const [tasksResult, statsResult] = await Promise.all([
    getTasks({ includeCompleted: true }),
    getTaskStats(),
  ])

  if (!tasksResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">
            Failed to load tasks: {tasksResult.error}
          </p>
        </div>
      </div>
    )
  }

  if (!statsResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">
            Failed to load statistics: {statsResult.error}
          </p>
        </div>
      </div>
    )
  }

  const tasks = tasksResult.data || []
  const stats = statsResult.data || {
    totalTasks: 0,
    todoCount: 0,
    inProgressCount: 0,
    doneCount: 0,
    overdueCount: 0,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and track tasks across your organization
          </p>
        </div>
        <Link
          href="/dashboard/tasks/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {stats.totalTasks}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">To Do</p>
          <p className="mt-2 text-3xl font-bold text-gray-700 dark:text-gray-300">
            {stats.todoCount}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.inProgressCount}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            {stats.overdueCount}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <Link
            href="/dashboard/tasks?view=kanban"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === 'kanban'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Kanban Board
          </Link>
          <Link
            href="/dashboard/tasks?view=list"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            List View
          </Link>
        </div>
      </div>

      {/* Task Views */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-500" />
          </div>
        }
      >
        {view === 'kanban' ? <TaskKanban tasks={tasks} /> : <TaskList tasks={tasks} />}
      </Suspense>
    </div>
  )
}
