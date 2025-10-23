import { NextRequest, NextResponse } from 'next/server'
import { getTaskById, updateTask, deleteTask } from '@/lib/services/task-service'
import { TaskUpdateSchema } from '@/lib/validations/task-schema'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/tasks/[id]
 *
 * Fetch a single task by ID with full relations.
 *
 * @spec 001-missing-core-features (US5, T081)
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID format' }, { status: 400 })
    }

    // Fetch task
    const result = await getTaskById(taskId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Task not found' ? 404 : 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Task GET [id] error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 *
 * Update an existing task.
 *
 * Request body (all optional):
 * - title: Updated title
 * - description: Updated description
 * - status: Updated status
 * - priority: Updated priority
 * - assigned_to: Updated assignee ID
 * - category_id: Updated category ID
 * - due_date: Updated due date
 * - estimated_hours: Updated estimated hours
 * - actual_hours: Actual hours spent
 * - progress_percentage: Progress (0-100)
 * - related_pilot_id: Updated pilot ID
 * - related_matter_id: Updated matter ID
 * - parent_task_id: Updated parent task ID
 * - tags: Updated tags array
 * - checklist_items: Updated checklist items
 *
 * @spec 001-missing-core-features (US5, T081)
 */
export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID format' }, { status: 400 })
    }

    const body = await _request.json()

    // Validate input
    const validation = TaskUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input. Please check your request.',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Update task
    const result = await updateTask(taskId, validation.data)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Task not found' ? 404 : 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Task PATCH error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 *
 * Delete a task.
 *
 * Query parameters:
 * - deleteSubtasks: Set to 'true' to delete subtasks as well (default: false)
 *
 * @spec 001-missing-core-features (US5, T081)
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID format' }, { status: 400 })
    }

    // Check if deleteSubtasks flag is set
    const deleteSubtasks = _request.nextUrl.searchParams.get('deleteSubtasks') === 'true'

    // Delete task
    const result = await deleteTask(taskId, deleteSubtasks)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Task not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Task DELETE error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}
