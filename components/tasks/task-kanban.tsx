'use client'

/**
 * Task Kanban Board Component
 *
 * Drag-and-drop Kanban board for task management.
 * Uses @dnd-kit for smooth drag-and-drop interactions.
 *
 * @spec 001-missing-core-features (US5, T082)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './task-card'
import type { TaskWithRelations } from '@/lib/services/task-service'

interface TaskKanbanProps {
  tasks: TaskWithRelations[]
}

type KanbanStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

const KANBAN_COLUMNS: { status: KanbanStatus; title: string; color: string }[] = [
  { status: 'TODO', title: 'To Do', color: 'bg-muted' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: 'bg-[var(--color-info-bg)]' },
  { status: 'COMPLETED', title: 'Completed', color: 'bg-[var(--color-status-low-bg)]' },
]

// Sortable Task Card wrapper
function SortableTaskCard({
  task,
  onStatusChange,
}: {
  task: TaskWithRelations
  onStatusChange: (taskId: string, newStatus: KanbanStatus) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
      <select
        aria-label="Change task status"
        value={task.status}
        onChange={(e) => {
          e.stopPropagation()
          onStatusChange(task.id, e.target.value as KanbanStatus)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-muted-foreground bg-muted border-border mt-1 w-full rounded border px-1.5 py-0.5 text-xs"
      >
        {KANBAN_COLUMNS.map((col) => (
          <option key={col.status} value={col.status}>
            {col.title}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function TaskKanban({ tasks }: TaskKanbanProps) {
  const router = useRouter()
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Filter tasks by Kanban-compatible statuses (exclude CANCELLED and BLOCKED)
  const kanbanTasks = tasks.filter((t) =>
    ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(t.status)
  ) as (TaskWithRelations & { status: KanbanStatus })[]

  // Group tasks by status
  const tasksByStatus = KANBAN_COLUMNS.reduce(
    (acc, column) => {
      acc[column.status] = kanbanTasks.filter((task) => task.status === column.status)
      return acc
    },
    {} as Record<KanbanStatus, typeof kanbanTasks>
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = kanbanTasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: KanbanStatus) => {
    const task = kanbanTasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Failed to update task:', result.error)
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as KanbanStatus

    await updateTaskStatus(taskId, newStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.status] || []
          const taskIds = columnTasks.map((t) => t.id)

          return (
            <div key={column.status} className="flex min-h-[600px] flex-col">
              {/* Column Header */}
              <div className={`mb-4 rounded-lg p-4 ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground text-lg font-semibold">{column.title}</h3>
                  <span className="bg-background text-muted-foreground rounded-full px-2 py-1 text-sm font-medium">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Droppable Column */}
              <SortableContext
                id={column.status}
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="border-border bg-muted/50 flex-1 space-y-3 rounded-lg border-2 border-dashed p-4">
                  {columnTasks.length === 0 ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
                      No tasks in {column.title.toLowerCase()}
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTaskStatus}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="scale-105 rotate-3">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-background rounded-lg p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-foreground">Updating task...</p>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}
