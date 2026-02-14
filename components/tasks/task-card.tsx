'use client'

/**
 * Task Card Component
 *
 * Displays an individual task with priority, status, assignee, and metadata.
 * Used in both Kanban board and list views.
 *
 * @spec 001-missing-core-features (US5, T085)
 */

import Link from 'next/link'
import type { TaskWithRelations } from '@/lib/services/task-service'

interface TaskCardProps {
  task: TaskWithRelations
  isDragging?: boolean
  onClick?: () => void
}

export default function TaskCard({ task, isDragging = false, onClick }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-[var(--color-status-high)] bg-[var(--color-status-high-bg)]'
      case 'HIGH':
        return 'border-l-[var(--color-status-medium)] bg-[var(--color-status-medium-bg)]'
      case 'MEDIUM':
        return 'border-l-[var(--color-status-medium)] bg-[var(--color-status-medium-bg)]/50'
      case 'LOW':
        return 'border-l-[var(--color-info)] bg-[var(--color-info-bg)]'
      default:
        return 'border-l-border bg-muted'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high-foreground)]'
      case 'HIGH':
        return 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium-foreground)]'
      case 'MEDIUM':
        return 'bg-[var(--color-status-medium-bg)]/70 text-[var(--color-status-medium-foreground)]'
      case 'LOW':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info-foreground)]'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const isOverdue = () => {
    if (!task.due_date || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return false
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(task.due_date)
    return dueDate < today
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const overdue = isOverdue()

  return (
    <div
      className={`group bg-background relative rounded-lg border-l-4 p-4 shadow-sm transition-all hover:shadow-md ${getPriorityColor(
        task.priority
      )} ${isDragging ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Title and Priority Badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/tasks/${task.id}`}
          className="text-foreground hover:text-primary flex-1 font-semibold"
        >
          {task.title}
        </Link>
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityBadgeColor(task.priority)}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Description (truncated) */}
      {task.description && (
        <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{task.description}</p>
      )}

      {/* Metadata Row */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
        {/* Due Date */}
        {task.due_date && (
          <div
            className={`flex items-center gap-1 ${overdue ? 'text-[var(--color-status-high)]' : ''}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className={overdue ? 'font-semibold' : ''}>
              {formatDate(task.due_date)}
              {overdue && ' (Overdue)'}
            </span>
          </div>
        )}

        {/* Assignee */}
        {task.assigned_user && (
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="truncate">{task.assigned_user.name || task.assigned_user.email}</span>
          </div>
        )}

        {/* Category */}
        {task.category && (
          <div className="flex items-center gap-1">
            {task.category.icon && <span>{task.category.icon}</span>}
            <span
              className="truncate"
              style={task.category.color ? { color: task.category.color } : undefined}
            >
              {task.category.name}
            </span>
          </div>
        )}

        {/* Related Pilot */}
        {task.related_pilot && (
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="truncate">
              {task.related_pilot.rank} {task.related_pilot.first_name}{' '}
              {task.related_pilot.last_name}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {(task.tags as string[]).slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
          {(task.tags as string[]).length > 3 && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
              +{(task.tags as string[]).length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar (if set) */}
      {task.progress_percentage !== null && task.progress_percentage > 0 && (
        <div className="mt-3">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Progress</span>
            <span>{task.progress_percentage}%</span>
          </div>
          <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${task.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks indicator */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>
            {task.subtasks.filter((st) => st.status === 'DONE').length}/{task.subtasks.length}{' '}
            subtasks
          </span>
        </div>
      )}

      {/* Quick Actions (visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/dashboard/tasks/${task.id}`}
          className="bg-background text-muted-foreground hover:text-primary rounded-md p-1 shadow-sm"
          title="View details"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
