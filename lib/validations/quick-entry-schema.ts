/**
 * Quick Entry Form Validation Schema
 *
 * Validation for admin quick entry form to manually enter pilot requests
 * from email, phone, or Oracle channels.
 *
 * @author Maurice Rondeau
 * @spec Manual request entry via admin interface
 */

import { z } from 'zod'

/**
 * Request category types
 */
export const RequestCategoryEnum = z.enum(['LEAVE', 'FLIGHT', 'LEAVE_BID'], {
  message: 'Please select a request category',
})

/**
 * Submission channel types
 */
export const SubmissionChannelEnum = z.enum(['EMAIL', 'PHONE', 'ORACLE'], {
  message: 'Please select a submission channel',
})

/**
 * Leave request types
 */
export const LeaveTypeEnum = z.enum(
  ['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'],
  {
    message: 'Please select a valid leave type',
  }
)

/**
 * Flight request types
 */
export const FlightTypeEnum = z.enum(['FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'], {
  message: 'Please select a valid flight request type',
})

/**
 * Quick Entry Form Schema
 *
 * Multi-step validation for admin quick entry:
 * - Step 1: Basic info (pilot, category, type, channel)
 * - Step 2: Date selection (start, end, roster period)
 * - Step 3: Additional details (reason, source reference, attachment)
 */
export const QuickEntrySchema = z
  .object({
    // Step 1: Basic Info
    pilot_id: z.string().min(1, 'Please select a pilot').uuid('Invalid pilot selection'),
    request_category: RequestCategoryEnum,
    submission_channel: SubmissionChannelEnum,

    // Request type - conditional based on category
    leave_type: LeaveTypeEnum.optional(),
    flight_type: FlightTypeEnum.optional(),

    // Step 2: Date Selection
    start_date: z
      .string()
      .min(1, 'Start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in format YYYY-MM-DD'),

    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in format YYYY-MM-DD')
      .optional()
      .nullable(),

    // Step 3: Additional Details
    reason: z
      .string()
      .max(2000, 'Reason cannot exceed 2000 characters')
      .optional()
      .nullable(),

    source_reference: z
      .string()
      .max(500, 'Source reference cannot exceed 500 characters')
      .optional()
      .nullable(),

    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If category is LEAVE, leave_type is required
      if (data.request_category === 'LEAVE' && !data.leave_type) {
        return false
      }
      return true
    },
    {
      message: 'Leave type is required for leave requests',
      path: ['leave_type'],
    }
  )
  .refine(
    (data) => {
      // If category is FLIGHT, flight_type is required
      if (data.request_category === 'FLIGHT' && !data.flight_type) {
        return false
      }
      return true
    },
    {
      message: 'Flight type is required for flight requests',
      path: ['flight_type'],
    }
  )
  .refine(
    (data) => {
      // If category is LEAVE or LEAVE_BID, end_date is required
      if (
        (data.request_category === 'LEAVE' || data.request_category === 'LEAVE_BID') &&
        !data.end_date
      ) {
        return false
      }
      return true
    },
    {
      message: 'End date is required for leave requests',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // End date must be on or after start date (if provided)
      if (data.end_date) {
        const startDate = new Date(data.start_date)
        const endDate = new Date(data.end_date)
        return endDate >= startDate
      }
      return true
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Maximum 90 days per request (if end_date provided)
      if (data.end_date) {
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
      message: 'Request duration cannot exceed 90 days',
      path: ['end_date'],
    }
  )

export type QuickEntryFormInput = z.infer<typeof QuickEntrySchema>

/**
 * Helper to determine if request is late (less than 21 days advance notice)
 */
export function isLateRequest(startDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(startDate)
  const daysDiff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return daysDiff < 21
}

/**
 * Helper to get deadline status
 */
export function getDeadlineStatus(startDate: string): {
  status: 'on-time' | 'late' | 'past-deadline'
  daysRemaining: number
  label: string
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(startDate)
  const daysRemaining = Math.ceil(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysRemaining < 0) {
    return {
      status: 'past-deadline',
      daysRemaining: 0,
      label: 'Past deadline - request is for past date',
    }
  } else if (daysRemaining < 21) {
    return {
      status: 'late',
      daysRemaining,
      label: `Late request - only ${daysRemaining} days notice`,
    }
  } else {
    return {
      status: 'on-time',
      daysRemaining,
      label: `On-time - ${daysRemaining} days advance notice`,
    }
  }
}
