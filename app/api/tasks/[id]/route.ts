import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { getTaskById, updateTask, deleteTask } from '@/lib/services/task-service'
import { TaskUpdateSchema } from '@/lib/validations/task-schema'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import {
  verifyRequestAuthorization,
  ResourceType,
} from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/tasks/[id]
 *
 * Fetch a single task by ID with full relations.
 *
 * @spec 001-missing-core-features (US5, T081)
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: taskId } = await params

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
    const sanitized = sanitizeError(error, {
      operation: 'getTaskById',
      taskId: (await params).id
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
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
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 * @spec 001-missing-core-features (US5, T081)
 */
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(_request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { id: taskId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID format' }, { status: 400 })
    }

    // AUTHORIZATION: Verify user owns this task or is Admin/Manager
    const authResult = await verifyRequestAuthorization(
      _request,
      ResourceType.TASK,
      taskId
    )

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
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

    // Revalidate all affected paths to clear Next.js cache
    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/tasks/${taskId}`)
    revalidatePath(`/dashboard/tasks/${taskId}/edit`)

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Task PATCH error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'updateTask',
      taskId: (await params).id
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
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
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 * @spec 001-missing-core-features (US5, T081)
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(_request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { id: taskId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID format' }, { status: 400 })
    }

    // AUTHORIZATION: Verify user owns this task or is Admin/Manager
    const authResult = await verifyRequestAuthorization(
      _request,
      ResourceType.TASK,
      taskId
    )

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
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

    // Revalidate tasks list after deletion
    revalidatePath('/dashboard/tasks')

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Task DELETE error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'deleteTask',
      taskId: (await params).id
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
