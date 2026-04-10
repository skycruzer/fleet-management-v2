import { z } from 'zod'

/**
 * Disciplinary Action Validation Schemas
 *
 * Developer: Maurice Rondeau
 * Validates disciplinary matter creation and action logging.
 *
 * @updated 2025-01-05 - Added CreateDisciplinarySchema for API validation
 */

// Date validation
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format')

const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format')
  .optional()
  .nullable()

/**
 * Schema for creating a disciplinary matter via POST /api/disciplinary
 * Matches the required fields from the API route
 */
export const CreateDisciplinarySchema = z.object({
  // Required fields
  title: z.string().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must not exceed 5000 characters'),
  pilot_id: z.string().uuid('Invalid pilot ID format'),
  incident_date: dateSchema.describe('Date of the incident in YYYY-MM-DD format'),
  incident_type_id: z.string().uuid('Invalid incident type ID format'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  }),
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'PENDING_ACTION', 'RESOLVED', 'CLOSED'], {
    message: 'Status must be one of: OPEN, UNDER_INVESTIGATION, PENDING_ACTION, RESOLVED, CLOSED',
  }),

  // Optional fields
  assigned_to: z.string().uuid().optional().nullable(),
  aircraft_registration: z.string().max(20).optional().nullable(),
  flight_number: z.string().max(20).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  witnesses: z.any().optional().nullable(),
  evidence_files: z.any().optional().nullable(),
  corrective_actions: z.string().max(2000).optional().nullable(),
  impact_on_operations: z.string().max(1000).optional().nullable(),
  regulatory_notification_required: z.boolean().optional().default(false),
  regulatory_body: z.string().max(100).optional().nullable(),
  notification_date: optionalDateSchema,
  due_date: optionalDateSchema,
})

export type CreateDisciplinaryInput = z.infer<typeof CreateDisciplinarySchema>

// Legacy: Disciplinary matter creation schema (kept for backwards compatibility)
export const DisciplinaryMatterSchema = z.object({
  pilot_id: z.string().uuid('Invalid pilot ID format'),
  matter_type: z.enum(
    ['investigation', 'verbal_warning', 'written_warning', 'suspension', 'other'],
    {
      message: 'Matter type is required',
    }
  ),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  severity: z
    .enum(['low', 'medium', 'high', 'critical'], {
      message: 'Invalid severity level',
    })
    .default('medium'),
})

export type DisciplinaryMatterInput = z.infer<typeof DisciplinaryMatterSchema>

// Disciplinary matter update schema
export const DisciplinaryMatterUpdateSchema = z
  .object({
    matter_type: z
      .enum(['investigation', 'verbal_warning', 'written_warning', 'suspension', 'other'])
      .optional(),
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
    status: z
      .enum(['open', 'under_review', 'resolved', 'closed'], {
        message: 'Invalid status',
      })
      .optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    resolution: z
      .string()
      .min(10, 'Resolution must be at least 10 characters')
      .max(2000, 'Resolution must be less than 2000 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // If status is resolved or closed, resolution is required
      if ((data.status === 'resolved' || data.status === 'closed') && !data.resolution) {
        return false
      }
      return true
    },
    {
      message: 'Resolution is required when matter is marked as resolved or closed',
      path: ['resolution'],
    }
  )

export type DisciplinaryMatterUpdate = z.infer<typeof DisciplinaryMatterUpdateSchema>

// Disciplinary action log schema
export const DisciplinaryActionSchema = z.object({
  action_type: z.enum(
    [
      'investigation_started',
      'evidence_added',
      'interview_conducted',
      'warning_issued',
      'status_updated',
      'resolution_added',
      'matter_closed',
      'comment_added',
      'other',
    ],
    {
      message: 'Action type is required',
    }
  ),
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
  status: z.enum(['open', 'under_review', 'resolved', 'closed']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  matter_type: z
    .enum(['investigation', 'verbal_warning', 'written_warning', 'suspension', 'other'])
    .optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type DisciplinaryMatterFilters = z.infer<typeof DisciplinaryMatterFiltersSchema>
