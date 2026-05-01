import { z } from 'zod'

/**
 * Disciplinary matter validation schema.
 *
 * Severity and status enums must match the DB CHECK constraints
 * (chk_disciplinary_matters_severity_valid, chk_disciplinary_matters_status_valid).
 */

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format')

const optionalDateSchema = dateSchema.optional().nullable()

export const SEVERITY_VALUES = ['low', 'medium', 'high', 'critical'] as const
export const STATUS_VALUES = ['open', 'under_review', 'resolved', 'closed'] as const

export type DisciplinarySeverity = (typeof SEVERITY_VALUES)[number]
export type DisciplinaryStatus = (typeof STATUS_VALUES)[number]

export const CreateDisciplinarySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must not exceed 5000 characters'),
  pilot_id: z.string().uuid('Invalid pilot ID format'),
  incident_date: dateSchema.describe('Date of the incident in YYYY-MM-DD format'),
  incident_type_id: z.string().uuid('Invalid incident type ID format'),
  severity: z.enum(SEVERITY_VALUES, {
    message: `Severity must be one of: ${SEVERITY_VALUES.join(', ')}`,
  }),
  status: z.enum(STATUS_VALUES, {
    message: `Status must be one of: ${STATUS_VALUES.join(', ')}`,
  }),

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
