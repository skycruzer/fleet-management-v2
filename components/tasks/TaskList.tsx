'use client'

/**
 * Task List Component
 *
 * Displays tasks in a sortable table format with filtering.
 *
 * @spec 001-missing-core-features (US5, T083)
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { TaskWithRelations } from '@/lib/services/task-service'

interface TaskListProps {
  tasks: TaskWithRelations[]
}

type SortField = 'title' | 'priority' | 'status' | 'due_date' | 'created_at'
type SortOrder = 'asc' | 'desc'

// Extracted outside component to avoid "component created during render" error
interface SortIconProps {
  field: SortField
  currentSortField: SortField
  currentSortOrder: SortOrder
}

function SortIcon({ field, currentSortField, currentSortOrder }: SortIconProps) {
  if (currentSortField !== field) {
    return (
      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    )
  }
  return (
    <svg
      className={`h-4 w-4 text-blue-600 transition-transform dark:text-blue-400 ${currentSortOrder === 'desc' ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function TaskList({ tasks }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Sort tasks
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break
        case 'priority':
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        case 'status':
          const statusOrder = { TODO: 1, IN_PROGRESS: 2, IN_REVIEW: 3, DONE: 4, CANCELLED: 5 }
          aVal = statusOrder[a.status as keyof typeof statusOrder] || 0
          bVal = statusOrder[b.status as keyof typeof statusOrder] || 0
          break
        case 'due_date':
          aVal = a.due_date ? new Date(a.due_date).getTime() : 0
          bVal = b.due_date ? new Date(b.due_date).getTime() : 0
          break
        case 'created_at':
          aVal = a.created_at ? new Date(a.created_at).getTime() : 0
          bVal = b.created_at ? new Date(b.created_at).getTime() : 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [tasks, sortField, sortOrder, statusFilter])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'IN_REVIEW':
        return 'bg-primary/10 text-primary-foreground dark:bg-purple-900/20 dark:text-primary'
      case 'DONE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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

  const isOverdue = (task: TaskWithRelations) => {
    if (!task.due_date || task.status === 'DONE' || task.status === 'CANCELLED') {
      return false
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(task.due_date)
    return dueDate < today
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setStatusFilter('TODO')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'TODO'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          To Do ({tasks.filter((t) => t.status === 'TODO').length})
        </button>
        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          In Progress ({tasks.filter((t) => t.status === 'IN_PROGRESS').length})
        </button>
        <button
          onClick={() => setStatusFilter('DONE')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'DONE'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Done ({tasks.filter((t) => t.status === 'DONE').length})
        </button>
        <button
          onClick={() => setStatusFilter('CANCELLED')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'CANCELLED'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Cancelled ({tasks.filter((t) => t.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Task
                  <SortIcon
                    field="title"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon
                    field="status"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priority
                  <SortIcon
                    field="priority"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
              >
                Assignee
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
                onClick={() => handleSort('due_date')}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  <SortIcon
                    field="due_date"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                  />
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {filteredAndSortedTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No tasks found
                </td>
              </tr>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/tasks/${task.id}`} className="block">
                      <div className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="mt-1 line-clamp-1 text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(task.status)}`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadgeColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {task.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {(task.assigned_user.name || task.assigned_user.email)[0].toUpperCase()}
                        </div>
                        <span className="truncate">
                          {task.assigned_user.name || task.assigned_user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {task.due_date ? (
                      <span
                        className={
                          isOverdue(task)
                            ? 'font-semibold text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                        }
                      >
                        {formatDate(task.due_date)}
                        {isOverdue(task) && ' (Overdue)'}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
