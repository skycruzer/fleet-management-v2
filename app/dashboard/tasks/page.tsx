import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getTasks, getTaskStats } from '@/lib/services/task-service'
import TaskKanban from '@/components/tasks/task-kanban'
import TaskList from '@/components/tasks/task-list'
import Link from 'next/link'
// Force dynamic rendering to prevent static generation at build time
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
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
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
        <div className="rounded-lg bg-[var(--color-destructive-muted)] p-6">
          <p className="text-[var(--color-danger-400)]">
            Failed to load tasks: {tasksResult.error}
          </p>
        </div>
      </div>
    )
  }

  if (!statsResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-[var(--color-destructive-muted)] p-6">
          <p className="text-[var(--color-danger-400)]">
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track tasks across your organization
          </p>
        </div>
        <Link
          href="/dashboard/tasks/new"
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-700)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 focus:outline-none"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Total Tasks</p>
          <p className="text-foreground mt-2 text-3xl font-bold">{stats.totalTasks}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">To Do</p>
          <p className="text-foreground/80 mt-2 text-3xl font-bold">{stats.todoCount}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-info)]">
            {stats.inProgressCount}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-danger-400)]">
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
                ? 'bg-[var(--color-primary-600)] text-white'
                : 'text-foreground/80 bg-muted/30 hover:bg-muted/60'
            }`}
          >
            Kanban Board
          </Link>
          <Link
            href="/dashboard/tasks?view=list"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-[var(--color-primary-600)] text-white'
                : 'text-foreground/80 bg-muted/30 hover:bg-muted/60'
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary-600)] border-t-transparent" />
          </div>
        }
      >
        {view === 'kanban' ? <TaskKanban tasks={tasks} /> : <TaskList tasks={tasks} />}
      </Suspense>
    </div>
  )
}
