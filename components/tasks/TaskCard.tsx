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
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      case 'LOW':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const isOverdue = () => {
    if (!task.due_date || task.status === 'DONE' || task.status === 'CANCELLED') {
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
      className={`group relative rounded-lg border-l-4 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 ${
        getPriorityColor(task.priority)
      } ${isDragging ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Title and Priority Badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/tasks/${task.id}`}
          className="flex-1 font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
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
        <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {task.description}
        </p>
      )}

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
        {/* Due Date */}
        {task.due_date && (
          <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400' : ''}`}>
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
            <span className="truncate">
              {task.assigned_user.full_name || task.assigned_user.email}
            </span>
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
              {task.related_pilot.rank} {task.related_pilot.first_name} {task.related_pilot.last_name}
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
              className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
          {(task.tags as string[]).length > 3 && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              +{(task.tags as string[]).length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar (if set) */}
      {task.progress_percentage !== null && task.progress_percentage > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>{task.progress_percentage}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all dark:bg-blue-500"
              style={{ width: `${task.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks indicator */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>
            {task.subtasks.filter((st) => st.status === 'DONE').length}/{task.subtasks.length} subtasks
          </span>
        </div>
      )}

      {/* Quick Actions (visible on hover) */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/dashboard/tasks/${task.id}`}
          className="rounded-md bg-white p-1 text-gray-600 shadow-sm hover:text-blue-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-blue-400"
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
