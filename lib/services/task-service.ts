/**
 * Task Management Service
 *
 * Service layer for task CRUD operations, assignment, and tracking.
 * Supports Kanban board and list views, subtasks, categories, and time tracking.
 *
 * @spec 001-missing-core-features (US5)
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog } from './audit-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import type { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface TaskWithRelations extends Task {
  assigned_user?: {
    id: string
    email: string
    name: string | null
  } | null
  created_user?: {
    id: string
    email: string
    name: string | null
  } | null
  category?: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
  related_pilot?: {
    id: string
    first_name: string
    last_name: string
    rank: string
  } | null
  subtasks?: Task[]
}

export interface TaskFilters {
  status?: string
  priority?: string
  assignedTo?: string
  createdBy?: string
  categoryId?: string
  relatedPilotId?: string
  relatedMatterId?: string
  dueDateFrom?: Date
  dueDateTo?: Date
  searchQuery?: string
  includeCompleted?: boolean
}

export interface TaskStats {
  totalTasks: number
  todoCount: number
  inProgressCount: number
  doneCount: number
  cancelledCount: number
  overdueCount: number
  byPriority: {
    LOW: number
    MEDIUM: number
    HIGH: number
    URGENT: number
  }
  byCategory: {
    [key: string]: number
  }
}

// Valid task statuses for Kanban board
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

// Valid task priorities
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

/**
 * Get all tasks with optional filtering
 */
export async function getTasks(
  filters?: TaskFilters
): Promise<ServiceResponse<TaskWithRelations[]>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Fallback to admin-session cookie auth
      const adminSession = await getAuthenticatedAdmin()
      if (!adminSession.authenticated) {
        return {
          success: false,
          error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
        }
      }
    }

    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        assigned_user:an_users!tasks_assigned_to_fkey(id, email, name),
        created_user:an_users!tasks_created_by_fkey(id, email, name),
        category:task_categories(id, name, color, icon),
        related_pilot:pilots(id, first_name, last_name, role)
      `
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy)
    }

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters?.relatedPilotId) {
      query = query.eq('related_pilot_id', filters.relatedPilotId)
    }

    if (filters?.relatedMatterId) {
      query = query.eq('related_matter_id', filters.relatedMatterId)
    }

    if (filters?.dueDateFrom) {
      query = query.gte('due_date', filters.dueDateFrom.toISOString())
    }

    if (filters?.dueDateTo) {
      query = query.lte('due_date', filters.dueDateTo.toISOString())
    }

    if (filters?.includeCompleted === false) {
      query = query.neq('status', 'DONE')
    }

    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      }
    }

    return {
      success: true,
      data: data as TaskWithRelations[],
    }
  } catch (error) {
    console.error('Task fetch error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
    }
  }
}

/**
 * Get task by ID with full relations
 */
export async function getTaskById(taskId: string): Promise<ServiceResponse<TaskWithRelations>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Fallback to admin-session cookie auth
      const adminSession = await getAuthenticatedAdmin()
      if (!adminSession.authenticated) {
        return {
          success: false,
          error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
        }
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        assigned_user:an_users!tasks_assigned_to_fkey(id, email, name),
        created_user:an_users!tasks_created_by_fkey(id, email, name),
        category:task_categories(id, name, color, icon),
        related_pilot:pilots(id, first_name, last_name, role)
      `
      )
      .eq('id', taskId)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return {
        success: false,
        error: 'Task not found',
      }
    }

    // Fetch subtasks if this is a parent task
    const { data: subtasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', taskId)
      .order('created_at', { ascending: true })

    return {
      success: true,
      data: {
        ...(data as TaskWithRelations),
        subtasks: subtasks || [],
      },
    }
  } catch (error) {
    console.error('Task fetch error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
    }
  }
}

/**
 * Create new task
 */
export async function createTask(taskData: {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string
  category_id?: string
  due_date?: string
  estimated_hours?: number
  related_pilot_id?: string
  related_matter_id?: string
  parent_task_id?: string
  tags?: string[]
  checklist_items?: Array<{ text: string; completed: boolean }>
  created_by?: string // Optional: pass from API route if using admin-session auth
}): Promise<ServiceResponse<Task>> {
  try {
    // Use admin client to bypass RLS (auth verified at API layer)
    const supabase = createAdminClient()

    // Try to get user from Supabase Auth, but don't require it
    // (admin-session auth is verified at API layer)
    const readSupabase = await createClient()
    const {
      data: { user },
    } = await readSupabase.auth.getUser()

    // Use provided created_by or fall back to Supabase Auth user
    const createdBy = taskData.created_by || user?.id

    if (!createdBy) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const insertData: TaskInsert = {
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      assigned_to: taskData.assigned_to || null,
      category_id: taskData.category_id || null,
      due_date: taskData.due_date || null,
      estimated_hours: taskData.estimated_hours || null,
      related_pilot_id: taskData.related_pilot_id || null,
      related_matter_id: taskData.related_matter_id || null,
      parent_task_id: taskData.parent_task_id || null,
      tags: taskData.tags ? JSON.parse(JSON.stringify(taskData.tags)) : null,
      checklist_items: taskData.checklist_items
        ? JSON.parse(JSON.stringify(taskData.checklist_items))
        : null,
      created_by: createdBy,
      progress_percentage: 0,
    }

    const { data, error } = await supabase.from('tasks').insert(insertData).select().single()

    if (error) {
      console.error('Error creating task:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      }
    }

    // Create audit log
    await createAuditLog({
      action: 'INSERT',
      tableName: 'tasks',
      recordId: data.id,
      newData: data,
      description: `Created task: ${data.title}`,
    })

    return {
      success: true,
      data: data as Task,
    }
  } catch (error) {
    console.error('Task creation error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
    }
  }
}

/**
 * Update existing task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<TaskUpdate>
): Promise<ServiceResponse<Task>> {
  try {
    // Use admin client to bypass RLS (auth verified at API layer)
    const supabase = createAdminClient()

    // Fetch existing task for audit log
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return {
        success: false,
        error: 'Task not found',
      }
    }

    // Auto-set completed_date when status changes to DONE
    if (updates.status === 'DONE' && existingTask.status !== 'DONE') {
      updates.completed_date = new Date().toISOString()
    }

    // Clear completed_date if status is changed away from DONE
    if (updates.status && updates.status !== 'DONE' && existingTask.status === 'DONE') {
      updates.completed_date = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      }
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      tableName: 'tasks',
      recordId: data.id,
      oldData: existingTask,
      newData: data,
      description: `Updated task: ${data.title}`,
    })

    return {
      success: true,
      data: data as Task,
    }
  } catch (error) {
    console.error('Task update error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
    }
  }
}

/**
 * Delete task (and optionally its subtasks)
 */
export async function deleteTask(
  taskId: string,
  deleteSubtasks: boolean = false
): Promise<ServiceResponse> {
  try {
    // Use admin client to bypass RLS (auth verified at API layer)
    const supabase = createAdminClient()

    // Fetch task for audit log
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*, subtasks:tasks!parent_task_id(*)')
      .eq('id', taskId)
      .single()

    if (fetchError || !task) {
      return {
        success: false,
        error: 'Task not found',
      }
    }

    // Check if task has subtasks
    const { count: subtaskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('parent_task_id', taskId)

    if (subtaskCount && subtaskCount > 0 && !deleteSubtasks) {
      return {
        success: false,
        error: 'Cannot delete task with subtasks. Delete subtasks first or set deleteSubtasks=true',
      }
    }

    // Delete subtasks if requested
    if (deleteSubtasks && subtaskCount && subtaskCount > 0) {
      const { error: subtaskDeleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('parent_task_id', taskId)

      if (subtaskDeleteError) {
        console.error('Error deleting subtasks:', subtaskDeleteError)
        return {
          success: false,
          error: 'Failed to delete subtasks',
        }
      }
    }

    // Delete the task
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      }
    }

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      tableName: 'tasks',
      recordId: taskId,
      oldData: task,
      description: `Deleted task: ${task.title}${deleteSubtasks ? ' (with subtasks)' : ''}`,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Task deletion error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
    }
  }
}

/**
 * Get task statistics for dashboard
 */
export async function getTaskStats(filters?: TaskFilters): Promise<ServiceResponse<TaskStats>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Fallback to admin-session cookie auth
      const adminSession = await getAuthenticatedAdmin()
      if (!adminSession.authenticated) {
        return {
          success: false,
          error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
        }
      }
    }

    let query = supabase.from('tasks').select('*', { count: 'exact' })

    // Apply filters if provided
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }
    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    const { data: allTasks, error } = await query

    if (error) {
      console.error('Error fetching task stats:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      }
    }

    const tasks = allTasks || []

    // Count by status
    const todoCount = tasks.filter((t) => t.status === 'TODO').length
    const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length
    const doneCount = tasks.filter((t) => t.status === 'DONE').length
    const cancelledCount = tasks.filter((t) => t.status === 'CANCELLED').length

    // Count overdue tasks (due_date < today AND status !== DONE)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdueCount = tasks.filter((t) => {
      if (!t.due_date || t.status === 'DONE') return false
      const dueDate = new Date(t.due_date)
      return dueDate < today
    }).length

    // Count by priority
    const byPriority = {
      LOW: tasks.filter((t) => t.priority === 'LOW').length,
      MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
      URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
    }

    // Count by category
    const byCategory: { [key: string]: number } = {}
    tasks.forEach((t) => {
      if (t.category_id) {
        byCategory[t.category_id] = (byCategory[t.category_id] || 0) + 1
      }
    })

    return {
      success: true,
      data: {
        totalTasks: tasks.length,
        todoCount,
        inProgressCount,
        doneCount,
        cancelledCount,
        overdueCount,
        byPriority,
        byCategory,
      },
    }
  } catch (error) {
    console.error('Task stats error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
    }
  }
}

/**
 * Get task categories
 */
export async function getTaskCategories(): Promise<
  ServiceResponse<Database['public']['Tables']['task_categories']['Row'][]>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching task categories:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Task categories fetch error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
    }
  }
}
