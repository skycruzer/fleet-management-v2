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
      <svg
        className="text-muted-foreground h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
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
      className={`text-primary h-4 w-4 transition-transform ${currentSortOrder === 'desc' ? 'rotate-180' : ''}`}
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
          const statusOrder = { TODO: 1, IN_PROGRESS: 2, IN_REVIEW: 3, COMPLETED: 4, CANCELLED: 5 }
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
        return 'bg-muted text-muted-foreground'
      case 'IN_PROGRESS':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info-foreground)]'
      case 'IN_REVIEW':
        return 'bg-[var(--color-category-simulator-bg)] text-[var(--color-category-simulator)]'
      case 'DONE':
        return 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low-foreground)]'
      case 'CANCELLED':
        return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high-foreground)]'
      default:
        return 'bg-muted text-muted-foreground'
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
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setStatusFilter('TODO')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'TODO'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          To Do ({tasks.filter((t) => t.status === 'TODO').length})
        </button>
        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          In Progress ({tasks.filter((t) => t.status === 'IN_PROGRESS').length})
        </button>
        <button
          onClick={() => setStatusFilter('DONE')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'DONE'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Done ({tasks.filter((t) => t.status === 'DONE').length})
        </button>
        <button
          onClick={() => setStatusFilter('CANCELLED')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'CANCELLED'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Cancelled ({tasks.filter((t) => t.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Table */}
      <div className="border-border bg-background overflow-x-auto rounded-lg border shadow-sm">
        <table className="divide-border min-w-full divide-y">
          <thead className="bg-muted">
            <tr>
              <th
                scope="col"
                className="text-muted-foreground hover:bg-muted/50 cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
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
                className="text-muted-foreground hover:bg-muted/50 cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
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
                className="text-muted-foreground hover:bg-muted/50 cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
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
                className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
              >
                Assignee
              </th>
              <th
                scope="col"
                className="text-muted-foreground hover:bg-muted/50 cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
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
          <tbody className="divide-border bg-background divide-y">
            {filteredAndSortedTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-6 py-12 text-center text-sm">
                  No tasks found
                </td>
              </tr>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/tasks/${task.id}`} className="block">
                      <div className="text-foreground hover:text-primary font-medium">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-muted-foreground mt-1 line-clamp-1 text-sm">
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
                  <td className="text-foreground px-6 py-4 text-sm">
                    {task.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-info-bg)] text-sm font-medium text-[var(--color-info-foreground)]">
                          {(task.assigned_user.name || task.assigned_user.email)[0].toUpperCase()}
                        </div>
                        <span className="truncate">
                          {task.assigned_user.name || task.assigned_user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {task.due_date ? (
                      <span
                        className={
                          isOverdue(task)
                            ? 'font-semibold text-[var(--color-status-high)]'
                            : 'text-foreground'
                        }
                      >
                        {formatDate(task.due_date)}
                        {isOverdue(task) && ' (Overdue)'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="text-primary hover:text-primary/80"
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
