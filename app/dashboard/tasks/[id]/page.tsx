/**
 * Task Detail Page
 * Author: Maurice Rondeau
 * Displays individual task details with full metadata
 */

import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getTaskById } from '@/lib/services/task-service'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, CheckCircle, Clock } from 'lucide-react'

interface TaskDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const { id } = await params
  const taskResult = await getTaskById(id)

  if (!taskResult.success || !taskResult.data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h1 className="text-foreground text-2xl font-bold">Task Not Found</h1>
        <p className="text-muted-foreground mt-2">The task you are looking for does not exist.</p>
        <Link
          href="/dashboard/tasks"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-white hover:bg-[var(--color-primary-700)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
      </div>
    )
  }

  const task = taskResult.data

  const statusColors: Record<string, string> = {
    PENDING: 'bg-[var(--color-warning-muted)] text-[var(--color-warning-500)]',
    IN_PROGRESS: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    COMPLETED: 'bg-[var(--color-success-muted)] text-[var(--color-success-500)]',
    CANCELLED: 'bg-muted text-muted-foreground',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-muted text-muted-foreground',
    MEDIUM: 'bg-[var(--color-warning-muted)] text-[var(--color-warning-500)]',
    HIGH: 'bg-[var(--color-badge-orange-bg)] text-[var(--color-badge-orange)]',
    CRITICAL: 'bg-[var(--color-destructive-muted)] text-[var(--color-danger-500)]',
  }

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED'

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/tasks"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <Link
          href={`/dashboard/tasks/${task.id}/edit`}
          className="rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-white hover:bg-[var(--color-primary-700)]"
        >
          Edit Task
        </Link>
      </div>

      <div className="bg-card overflow-hidden rounded-lg shadow">
        <div className="border-border bg-muted border-b p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
              {task.title}
            </h1>
            <div className="flex flex-wrap gap-2">
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

        <div className="border-border grid grid-cols-1 gap-6 border-b p-6 md:grid-cols-2">
          {task.assigned_to && (
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Assigned To</p>
                <p className="text-foreground font-medium">{task.assigned_to}</p>
              </div>
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Due Date</p>
                <p
                  className={`font-medium ${isOverdue ? 'text-[var(--color-danger-600)]' : 'text-foreground'}`}
                >
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
              <Clock className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Created</p>
                <p className="text-foreground font-medium">
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
              <CheckCircle className="h-5 w-5 text-[var(--color-success-500)]" />
              <div>
                <p className="text-muted-foreground text-sm">Completed</p>
                <p className="text-foreground font-medium">
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
          <h2 className="text-foreground mb-3 text-lg font-semibold">Description</h2>
          {task.description ? (
            <div className="prose text-muted-foreground max-w-none">
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No description provided</p>
          )}
        </div>

        {task.tags && Object.keys(task.tags as object).length > 0 && (
          <div className="border-border bg-muted border-t p-6">
            <h2 className="text-foreground mb-3 text-lg font-semibold">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(task.tags)
                ? (task.tags as string[]).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--color-info-bg)] px-3 py-1 text-sm text-[var(--color-info)]"
                    >
                      {tag}
                    </span>
                  ))
                : Object.entries(task.tags as object).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full bg-[var(--color-info-bg)] px-3 py-1 text-sm text-[var(--color-info)]"
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
