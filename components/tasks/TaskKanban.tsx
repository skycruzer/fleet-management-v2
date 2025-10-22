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
import TaskCard from './TaskCard'
import type { TaskWithRelations } from '@/lib/services/task-service'

interface TaskKanbanProps {
  tasks: TaskWithRelations[]
}

type KanbanStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

const KANBAN_COLUMNS: { status: KanbanStatus; title: string; color: string }[] = [
  { status: 'TODO', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { status: 'DONE', title: 'Done', color: 'bg-green-100 dark:bg-green-900/20' },
]

// Sortable Task Card wrapper
function SortableTaskCard({ task }: { task: TaskWithRelations }) {
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
    </div>
  )
}

export default function TaskKanban({ tasks }: TaskKanbanProps) {
  const router = useRouter()
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Filter tasks by Kanban-compatible statuses (exclude CANCELLED)
  const kanbanTasks = tasks.filter((t) =>
    ['TODO', 'IN_PROGRESS', 'DONE'].includes(t.status)
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as KanbanStatus

    // Find the task
    const task = kanbanTasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistically update UI
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Failed to update task:', result.error)
        // Revert will happen on router.refresh()
      }

      // Refresh to get updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsUpdating(false)
    }
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
              <div
                className={`mb-4 rounded-lg p-4 ${column.color}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {column.title}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-1 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Droppable Column */}
              <SortableContext id={column.status} items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                  {columnTasks.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-500">
                      No tasks in {column.title.toLowerCase()}
                    </div>
                  ) : (
                    columnTasks.map((task) => <SortableTaskCard key={task.id} task={task} />)
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
          <div className="rotate-3 scale-105">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-500" />
              <p className="text-gray-900 dark:text-white">Updating task...</p>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}
