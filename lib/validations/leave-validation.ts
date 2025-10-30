/**
 * Leave Request Validation Schemas
 * Comprehensive Zod validation for leave request CRUD operations
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

import { z } from 'zod'

// ===================================
// ENUMS & CONSTANTS
// ===================================

export const LeaveRequestTypeEnum = z.enum(
  ['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'],
  {
    message:
      'Leave type must be one of: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE',
  }
)

export const LeaveRequestStatusEnum = z.enum(['PENDING', 'APPROVED', 'DENIED'], {
  message: 'Status must be one of: PENDING, APPROVED, DENIED',
})

export const RequestMethodEnum = z.enum(['EMAIL', 'ORACLE', 'LEAVE_BIDS', 'SYSTEM'], {
  message: 'Request method must be one of: EMAIL, ORACLE, LEAVE_BIDS, SYSTEM',
})

// ===================================
// BASE SCHEMAS
// ===================================

/**
 * UUID validation for IDs
 */
const uuidSchema = z.string().uuid('Must be a valid UUID')

/**
 * Date validation: Must be ISO date string (YYYY-MM-DD format from HTML date inputs)
 * Will be converted to ISO datetime in the API layer
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format')

/**
 * Roster period validation: Format "RP1/2025" through "RP13/2025"
 */
const rosterPeriodSchema = z
  .string()
  .regex(
    /^RP(1[0-3]|[1-9])\/\d{4}$/,
    'Roster period must be in format "RP1/2025" through "RP13/2025"'
  )

/**
 * Reason validation: Max 500 characters
 */
const reasonSchema = z.string().max(500, 'Reason cannot exceed 500 characters').optional()

/**
 * Review comments validation: Max 500 characters
 */
const reviewCommentsSchema = z
  .string()
  .max(500, 'Review comments cannot exceed 500 characters')
  .optional()

// ===================================
// LEAVE REQUEST CREATE SCHEMA
// ===================================

export const LeaveRequestCreateSchema = z
  .object({
    pilot_id: uuidSchema,
    request_type: LeaveRequestTypeEnum,
    start_date: dateSchema,
    end_date: dateSchema,
    request_date: dateSchema,
    request_method: RequestMethodEnum,
    reason: reasonSchema,
    is_late_request: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      // End date must be after or equal to start date
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      return endDate >= startDate
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Validate reasonable date range (max 90 days)
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 90
    },
    {
      message: 'Leave request cannot exceed 90 days',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Request date must be before or equal to start date
      const requestDate = new Date(data.request_date)
      const startDate = new Date(data.start_date)
      return requestDate <= startDate
    },
    {
      message: 'Request date cannot be after start date',
      path: ['request_date'],
    }
  )
  .refine(
    (data) => {
      // Check if late request flag is set correctly (less than 21 days advance notice)
      const requestDate = new Date(data.request_date)
      const startDate = new Date(data.start_date)
      const daysDiff = Math.ceil(
        (startDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (data.is_late_request) {
        return daysDiff < 21
      }
      return true
    },
    {
      message: 'Late request flag must be set for requests with less than 21 days notice',
      path: ['is_late_request'],
    }
  )

export type LeaveRequestCreate = z.infer<typeof LeaveRequestCreateSchema>

// ===================================
// LEAVE REQUEST UPDATE SCHEMA
// ===================================

export const LeaveRequestUpdateSchema = z
  .object({
    pilot_id: uuidSchema.optional(),
    request_type: LeaveRequestTypeEnum.optional(),
    start_date: dateSchema.optional(),
    end_date: dateSchema.optional(),
    request_date: dateSchema.optional(),
    request_method: RequestMethodEnum.optional(),
    reason: reasonSchema,
    is_late_request: z.boolean().optional(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date)
        const endDate = new Date(data.end_date)
        return endDate >= startDate
      }
      return true
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date)
        const endDate = new Date(data.end_date)
        const daysDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysDiff <= 90
      }
      return true
    },
    {
      message: 'Leave request cannot exceed 90 days',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      if (data.request_date && data.start_date) {
        const requestDate = new Date(data.request_date)
        const startDate = new Date(data.start_date)
        return requestDate <= startDate
      }
      return true
    },
    {
      message: 'Request date cannot be after start date',
      path: ['request_date'],
    }
  )

export type LeaveRequestUpdate = z.infer<typeof LeaveRequestUpdateSchema>

// ===================================
// LEAVE REQUEST STATUS UPDATE SCHEMA
// ===================================

export const LeaveRequestStatusUpdateSchema = z.object({
  requestId: uuidSchema,
  status: z.enum(['APPROVED', 'DENIED']),
  reviewedBy: uuidSchema,
  reviewComments: reviewCommentsSchema,
})

export type LeaveRequestStatusUpdate = z.infer<typeof LeaveRequestStatusUpdateSchema>

// ===================================
// LEAVE REQUEST ID SCHEMA
// ===================================

export const LeaveRequestIdSchema = uuidSchema

export type LeaveRequestId = z.infer<typeof LeaveRequestIdSchema>

// ===================================
// PILOT ID FOR LEAVE REQUESTS
// ===================================

export const PilotIdForLeaveSchema = uuidSchema

export type PilotIdForLeave = z.infer<typeof PilotIdForLeaveSchema>

// ===================================
// ROSTER PERIOD FILTER SCHEMA
// ===================================

export const RosterPeriodFilterSchema = z.object({
  rosterPeriod: rosterPeriodSchema,
})

export type RosterPeriodFilter = z.infer<typeof RosterPeriodFilterSchema>

// ===================================
// LEAVE CONFLICT CHECK SCHEMA
// ===================================

export const LeaveConflictCheckSchema = z.object({
  pilotId: uuidSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  excludeRequestId: uuidSchema.optional(),
})

export type LeaveConflictCheck = z.infer<typeof LeaveConflictCheckSchema>

// ===================================
// LEAVE REQUEST FILTER SCHEMA
// ===================================

export const LeaveRequestFilterSchema = z.object({
  status: LeaveRequestStatusEnum.optional(),
  requestType: LeaveRequestTypeEnum.optional(),
  pilotId: uuidSchema.optional(),
  rosterPeriod: rosterPeriodSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  isLateRequest: z.boolean().optional(),
})

export type LeaveRequestFilter = z.infer<typeof LeaveRequestFilterSchema>
