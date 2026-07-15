import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TaskCard from '@/components/tasks/task-card'
import TaskList from '@/components/tasks/task-list'
import {
  TaskFiltersSchema,
  TaskFormSchema,
  TaskKanbanMoveSchema,
  TaskUpdateSchema,
} from '@/lib/validations/task-schema'
import type { TaskWithRelations } from '@/lib/services/task-service'

const { createAdminClientMock, createAuditLogMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createAuditLogMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/services/audit-service', () => ({
  createAuditLog: createAuditLogMock,
}))

vi.mock('@/lib/middleware/admin-auth-helper', () => ({
  getAuthenticatedAdmin: vi.fn(),
}))

function makeTask(status: string, overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: crypto.randomUUID(),
    title: `${status} task`,
    description: null,
    category_id: null,
    priority: 'MEDIUM',
    status,
    created_by: crypto.randomUUID(),
    assigned_to: null,
    related_pilot_id: null,
    related_matter_id: null,
    due_date: '2020-01-01T00:00:00.000Z',
    completed_date: null,
    completion_date: null,
    estimated_hours: null,
    actual_hours: null,
    is_recurring: false,
    recurrence_pattern: null,
    parent_task_id: null,
    tags: [],
    attachments: [],
    checklist_items: [],
    progress_percentage: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('task status contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts only statuses allowed by the tasks table constraint', () => {
    const validStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']

    for (const status of validStatuses) {
      expect(TaskFormSchema.shape.status.safeParse(status).success).toBe(true)
      expect(TaskUpdateSchema.shape.status.safeParse(status).success).toBe(true)
      expect(TaskFiltersSchema.shape.status.safeParse(status).success).toBe(true)
    }

    expect(TaskFormSchema.shape.status.safeParse('IN_REVIEW').success).toBe(false)
    expect(TaskUpdateSchema.shape.status.safeParse('IN_REVIEW').success).toBe(false)
    expect(TaskFiltersSchema.shape.status.safeParse('IN_REVIEW').success).toBe(false)
    expect(TaskKanbanMoveSchema.shape.status.safeParse('IN_REVIEW').success).toBe(false)
  })

  it('excludes completed tasks with the database status value', async () => {
    const neq = vi.fn()
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      neq,
      then: (resolve: (value: { data: TaskWithRelations[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    }
    neq.mockReturnValue(query)
    createAdminClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: crypto.randomUUID() } } }) },
      from: vi.fn().mockReturnValue(query),
    })

    const { getTasks } = await import('@/lib/services/task-service')
    await getTasks({ includeCompleted: false })

    expect(neq).toHaveBeenCalledWith('status', 'COMPLETED')
  })

  it('records and clears the completion timestamp on COMPLETED transitions', async () => {
    const update = vi.fn()
    const existingTask = makeTask('IN_PROGRESS')
    const updatedTask = makeTask('COMPLETED')
    const fetchChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingTask, error: null }),
        }),
      }),
      update,
    }
    update.mockImplementation((payload) => ({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { ...updatedTask, ...payload }, error: null }),
        }),
      }),
    }))
    createAdminClientMock.mockReturnValue({ from: vi.fn().mockReturnValue(fetchChain) })
    createAuditLogMock.mockResolvedValue(undefined)

    const { updateTask } = await import('@/lib/services/task-service')
    await updateTask(existingTask.id, { status: 'COMPLETED' })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'COMPLETED', completed_date: expect.any(String) })
    )

    const completedTask = makeTask('COMPLETED', { completed_date: '2026-01-02T00:00:00.000Z' })
    fetchChain.select.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: completedTask, error: null }),
      }),
    })
    await updateTask(completedTask.id, { status: 'IN_PROGRESS' })

    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'IN_PROGRESS', completed_date: null })
    )
  })
})

describe('task status UI', () => {
  it('shows filters for BLOCKED and COMPLETED and does not mark completed work overdue', () => {
    render(<TaskList tasks={[makeTask('BLOCKED'), makeTask('COMPLETED')]} />)

    expect(screen.getByRole('button', { name: 'Blocked (1)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Completed (1)' })).toBeInTheDocument()
    expect(screen.queryByText('(Overdue)')).not.toBeInTheDocument()
  })

  it('counts COMPLETED subtasks', () => {
    const task = makeTask('IN_PROGRESS', {
      subtasks: [makeTask('COMPLETED'), makeTask('TODO')],
    })

    render(<TaskCard task={task} />)

    expect(screen.getByText(/1\/2\s+subtasks/)).toBeInTheDocument()
  })
})
