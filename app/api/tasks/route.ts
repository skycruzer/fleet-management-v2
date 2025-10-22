import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask, getTaskStats } from '@/lib/services/task-service'
import { TaskInputSchema } from '@/lib/validations/task-schema'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/tasks
 *
 * Fetch tasks with optional filtering and statistics.
 *
 * Query parameters:
 * - status: Filter by status (TODO, IN_PROGRESS, DONE, CANCELLED)
 * - priority: Filter by priority (LOW, MEDIUM, HIGH, URGENT)
 * - assignedTo: Filter by assigned user ID
 * - createdBy: Filter by creator user ID
 * - categoryId: Filter by category ID
 * - relatedPilotId: Filter by related pilot ID
 * - relatedMatterId: Filter by related matter ID
 * - dueDateFrom: Filter by due date start (ISO string)
 * - dueDateTo: Filter by due date end (ISO string)
 * - searchQuery: Search in title/description
 * - includeCompleted: Include completed tasks (default: true)
 * - stats: Return statistics instead of tasks (stats=true)
 *
 * @spec 001-missing-core-features (US5, T080)
 */
export async function GET(_request: NextRequest) {
  try {
    const searchParams = _request.nextUrl.searchParams

    // Check if stats are requested
    const includeStats = searchParams.get('stats') === 'true'

    if (includeStats) {
      const filters: any = {}

      if (searchParams.get('assignedTo')) {
        filters.assignedTo = searchParams.get('assignedTo')
      }
      if (searchParams.get('createdBy')) {
        filters.createdBy = searchParams.get('createdBy')
      }
      if (searchParams.get('categoryId')) {
        filters.categoryId = searchParams.get('categoryId')
      }

      const statsResult = await getTaskStats(filters)

      if (!statsResult.success) {
        return NextResponse.json({ success: false, error: statsResult.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: statsResult.data }, { status: 200 })
    }

    // Build filters from query params
    const filters: any = {}

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')
    }

    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority')
    }

    if (searchParams.get('assignedTo')) {
      filters.assignedTo = searchParams.get('assignedTo')
    }

    if (searchParams.get('createdBy')) {
      filters.createdBy = searchParams.get('createdBy')
    }

    if (searchParams.get('categoryId')) {
      filters.categoryId = searchParams.get('categoryId')
    }

    if (searchParams.get('relatedPilotId')) {
      filters.relatedPilotId = searchParams.get('relatedPilotId')
    }

    if (searchParams.get('relatedMatterId')) {
      filters.relatedMatterId = searchParams.get('relatedMatterId')
    }

    if (searchParams.get('dueDateFrom')) {
      filters.dueDateFrom = new Date(searchParams.get('dueDateFrom')!)
    }

    if (searchParams.get('dueDateTo')) {
      filters.dueDateTo = new Date(searchParams.get('dueDateTo')!)
    }

    if (searchParams.get('searchQuery')) {
      filters.searchQuery = searchParams.get('searchQuery')
    }

    if (searchParams.get('includeCompleted') === 'false') {
      filters.includeCompleted = false
    }

    // Fetch tasks
    const result = await getTasks(filters)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 *
 * Create a new task.
 *
 * Request body:
 * - title (required): Task title
 * - description: Task description
 * - status: Task status (default: TODO)
 * - priority: Task priority (default: MEDIUM)
 * - assigned_to: Assigned user ID (UUID)
 * - category_id: Category ID (UUID)
 * - due_date: Due date (ISO datetime)
 * - estimated_hours: Estimated hours
 * - related_pilot_id: Related pilot ID (UUID)
 * - related_matter_id: Related matter ID (UUID)
 * - parent_task_id: Parent task ID (UUID) for subtasks
 * - tags: Array of tag strings
 * - checklist_items: Array of {text, completed} objects
 *
 * @spec 001-missing-core-features (US5, T080)
 */
export async function POST(_request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = TaskInputSchema.safeParse(body)

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

    // Create task
    const result = await createTask(validation.data)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('Task POST error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}
