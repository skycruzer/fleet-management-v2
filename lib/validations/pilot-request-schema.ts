/**
 * Pilot Request Validation Schemas
 * Zod validation for unified pilot request CRUD operations
 *
 * Developer: Maurice Rondeau
 * @version 1.0.0
 * @since 2025-01-05
 */

import { z } from 'zod'

// ===================================
// ENUMS
// ===================================

export const RequestCategoryEnum = z.enum(['LEAVE', 'FLIGHT', 'LEAVE_BID'], {
  message: 'Request category must be one of: LEAVE, FLIGHT, LEAVE_BID',
})

export const SubmissionChannelEnum = z.enum(
  ['PILOT_PORTAL', 'EMAIL', 'PHONE', 'ORACLE', 'ADMIN_PORTAL'],
  {
    message: 'Submission channel must be one of: PILOT_PORTAL, EMAIL, PHONE, ORACLE, ADMIN_PORTAL',
  }
)

export const PilotRankEnum = z.enum(['Captain', 'First Officer'], {
  message: 'Rank must be one of: Captain, First Officer',
})

// Request types - must match RequestType from unified-request-service.ts
export const LeaveRequestTypeEnum = z.enum(
  ['ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'],
  {
    message: 'Leave request type must be one of: ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE',
  }
)

export const FlightRequestTypeEnum = z.enum(
  ['RDO', 'SDO', 'FLIGHT_REQUEST', 'SCHEDULE_CHANGE', 'OFFICE_DAY'],
  {
    message:
      'Flight request type must be one of: RDO, SDO, FLIGHT_REQUEST, SCHEDULE_CHANGE, OFFICE_DAY',
  }
)

export const RequestTypeEnum = z.union([LeaveRequestTypeEnum, FlightRequestTypeEnum], {
  message: 'Request type is required',
})

// ===================================
// BASE SCHEMAS
// ===================================

const uuidSchema = z.string().uuid('Must be a valid UUID')

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format')

// Optional date that transforms null to undefined to match service types
const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format')
  .optional()
  .nullable()
  .transform((val) => val ?? undefined)

// ===================================
// CREATE SCHEMA
// ===================================

/**
 * Schema for creating a new pilot request
 * Used by POST /api/requests
 */
export const CreatePilotRequestSchema = z.object({
  // Required pilot identification
  pilot_id: uuidSchema.describe('UUID of the pilot'),
  employee_number: z.string().min(1, 'Employee number is required'),
  rank: PilotRankEnum,
  name: z.string().min(1, 'Pilot name is required'),

  // Required request details
  request_category: RequestCategoryEnum,
  request_type: RequestTypeEnum,
  submission_channel: SubmissionChannelEnum,
  start_date: dateSchema.describe('Start date in YYYY-MM-DD format'),

  // Optional fields - use transforms to convert null to undefined for service compatibility
  end_date: optionalDateSchema.describe('End date in YYYY-MM-DD format'),
  flight_date: optionalDateSchema.describe('Flight date for flight requests'),
  reason: z
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  submitted_by_admin_id: uuidSchema
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  source_reference: z
    .string()
    .max(255)
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  source_attachment_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
})

export type CreatePilotRequestInput = z.infer<typeof CreatePilotRequestSchema>

// ===================================
// UPDATE SCHEMA
// ===================================

/**
 * Schema for updating a pilot request
 * All fields are optional except id
 */
export const UpdatePilotRequestSchema = z.object({
  request_type: RequestTypeEnum.optional(),
  start_date: dateSchema.optional(),
  end_date: optionalDateSchema,
  flight_date: optionalDateSchema,
  reason: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  source_reference: z.string().max(255).optional().nullable(),
  source_attachment_url: z.string().url().optional().nullable(),
})

export type UpdatePilotRequestInput = z.infer<typeof UpdatePilotRequestSchema>

// ===================================
// FILTER SCHEMA
// ===================================

/**
 * Schema for filtering pilot requests
 * Used by GET /api/requests query parameters
 */
export const PilotRequestFilterSchema = z.object({
  pilot_id: uuidSchema.optional(),
  request_category: RequestCategoryEnum.optional(),
  status: z.string().optional(),
  workflow_status: z.string().optional(),
  submission_channel: SubmissionChannelEnum.optional(),
  start_date_from: dateSchema.optional(),
  start_date_to: dateSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type PilotRequestFilter = z.infer<typeof PilotRequestFilterSchema>
