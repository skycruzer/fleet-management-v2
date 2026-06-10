import { NextResponse } from 'next/server'
import { authRateLimit } from '@/lib/rate-limit'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { invalidateTaskCaches } from '@/lib/services/cache-invalidation-helper'
import { getTaskById, updateTask, deleteTask } from '@/lib/services/task-service'
import { TaskUpdateSchema } from '@/lib/validations/task-schema'
import { verifyRequestAuthorization, ResourceType } from '@/lib/middleware/authorization-middleware'

/**
 * GET /api/tasks/[id]
 *
 * Fetch a single task by ID with full relations.
 *
 * @updated 2026-06-10 - SECURITY: added admin authentication (was unauthenticated)
 * @spec 001-missing-core-features (US5, T081)
 */
export const GET = createAdminRoute(
  {
    operation: 'getTaskById',
    endpoint: '/api/tasks/[id]',
    rateLimit: false,
  },
  async ({ params }) => {
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
  }
)

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
 * @version 3.0.0
 * @updated 2025-11-04 - Critical security hardening
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 * @spec 001-missing-core-features (US5, T081)
 */
export const PATCH = createAdminRoute(
  {
    operation: 'updateTask',
    endpoint: '/api/tasks/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, params }) => {
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID format' }, { status: 400 })
    }

    // AUTHORIZATION: Verify user owns this task or is Admin/Manager
    const authResult = await verifyRequestAuthorization(request, ResourceType.TASK, taskId)

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const body = await request.json()

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
    await invalidateTaskCaches(taskId).catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  }
)

/**
 * DELETE /api/tasks/[id]
 *
 * Delete a task.
 *
 * Query parameters:
 * - deleteSubtasks: Set to 'true' to delete subtasks as well (default: false)
 *
 * @version 3.0.0
 * @updated 2025-11-04 - Critical security hardening
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 * @spec 001-missing-core-features (US5, T081)
 */
export const DELETE = createAdminRoute(
  {
    operation: 'deleteTask',
    endpoint: '/api/tasks/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, params }) => {
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID format' }, { status: 400 })
    }

    // AUTHORIZATION: Verify user owns this task or is Admin/Manager
    const authResult = await verifyRequestAuthorization(request, ResourceType.TASK, taskId)

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    // Check if deleteSubtasks flag is set
    const deleteSubtasks = request.nextUrl.searchParams.get('deleteSubtasks') === 'true'

    // Delete task
    const result = await deleteTask(taskId, deleteSubtasks)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Task not found' ? 404 : 400 }
      )
    }

    // Revalidate tasks list after deletion
    await invalidateTaskCaches().catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    )
  }
)
