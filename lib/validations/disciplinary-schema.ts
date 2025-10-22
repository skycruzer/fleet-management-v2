import { z } from 'zod'

/**
 * Disciplinary Action Validation Schemas
 *
 * Validates disciplinary matter creation and action logging.
 */

// Disciplinary matter creation schema
export const DisciplinaryMatterSchema = z.object({
  pilot_id: z
    .string()
    .uuid('Invalid pilot ID format'),
  matter_type: z.enum(['investigation', 'verbal_warning', 'written_warning', 'suspension', 'other'], {
    required_error: 'Matter type is required',
    invalid_type_error: 'Invalid matter type',
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    invalid_type_error: 'Invalid severity level',
  }).default('MEDIUM'),
})

export type DisciplinaryMatterInput = z.infer<typeof DisciplinaryMatterSchema>

// Disciplinary matter update schema
export const DisciplinaryMatterUpdateSchema = z.object({
  matter_type: z.enum(['investigation', 'verbal_warning', 'written_warning', 'suspension', 'other']).optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED'], {
    invalid_type_error: 'Invalid status',
  }).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  resolution: z
    .string()
    .min(10, 'Resolution must be at least 10 characters')
    .max(2000, 'Resolution must be less than 2000 characters')
    .optional(),
}).refine(
  (data) => {
    // If status is RESOLVED or CLOSED, resolution is required
    if ((data.status === 'RESOLVED' || data.status === 'CLOSED') && !data.resolution) {
      return false
    }
    return true
  },
  {
    message: 'Resolution is required when matter is marked as RESOLVED or CLOSED',
    path: ['resolution'],
  }
)

export type DisciplinaryMatterUpdate = z.infer<typeof DisciplinaryMatterUpdateSchema>

// Disciplinary action log schema
export const DisciplinaryActionSchema = z.object({
  action_type: z.enum([
    'investigation_started',
    'evidence_added',
    'interview_conducted',
    'warning_issued',
    'status_updated',
    'resolution_added',
    'matter_closed',
    'comment_added',
    'other',
  ], {
    required_error: 'Action type is required',
  }),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  attachments: z
    .array(z.string().url('Invalid attachment URL'))
    .max(10, 'Maximum 10 attachments allowed')
    .optional(),
})

export type DisciplinaryActionInput = z.infer<typeof DisciplinaryActionSchema>

// Disciplinary matter filters schema
export const DisciplinaryMatterFiltersSchema = z.object({
  pilot_id: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  matter_type: z.enum(['investigation', 'verbal_warning', 'written_warning', 'suspension', 'other']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type DisciplinaryMatterFilters = z.infer<typeof DisciplinaryMatterFiltersSchema>
