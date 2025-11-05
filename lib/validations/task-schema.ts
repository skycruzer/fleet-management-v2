import { z } from 'zod'

/**
 * Task Management Validation Schemas
 *
 * Validates task creation, updates, and Kanban operations.
 */

// Task input schema (create)
export const TaskInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigned_to: z
    .string()
    .uuid('Invalid user ID format')
    .nullable()
    .optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
})

export type TaskInput = z.infer<typeof TaskInputSchema>

// Task update schema
export const TaskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .nullable()
    .optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigned_to: z
    .string()
    .uuid('Invalid user ID format')
    .nullable()
    .optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
})

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>

// Kanban move schema (simplified update for drag-drop)
export const TaskKanbanMoveSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']),
})

export type TaskKanbanMove = z.infer<typeof TaskKanbanMoveSchema>

// Task filters schema
export const TaskFiltersSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  assigned_to: z.string().optional(), // Can be UUID or 'me'
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  tags: z.string().optional(), // Comma-separated tags
  overdue: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type TaskFilters = z.infer<typeof TaskFiltersSchema>
