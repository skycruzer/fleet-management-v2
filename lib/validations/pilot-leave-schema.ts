/**
 * Pilot Portal Leave Request Validation Schema
 *
 * Simplified Zod validation for pilot self-service leave requests.
 * Uses date-only format (YYYY-MM-DD) compatible with HTML date inputs.
 *
 * @spec 001-missing-core-features (US2)
 */

import { z } from 'zod'

/**
 * Leave request types available to pilots
 */
export const PilotLeaveTypeEnum = z.enum(
  ['ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'],
  {
    message: 'Please select a valid leave type. For RDO/SDO, use the dedicated RDO/SDO Request form.',
  }
)

/**
 * Pilot Leave Request Submission Schema
 *
 * Simplified schema for pilot-facing leave request form:
 * - Uses YYYY-MM-DD date format (HTML date input compatible)
 * - Auto-calculates is_late_request
 * - Auto-sets request_date to today
 * - Auto-sets request_method to 'SYSTEM'
 */
export const PilotLeaveRequestSchema = z
  .object({
    request_type: PilotLeaveTypeEnum,
    start_date: z
      .string()
      .min(1, 'Start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in format YYYY-MM-DD')
      .refine(
        (date) => {
          const requestDate = new Date(date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return requestDate >= today
        },
        { message: 'Start date cannot be in the past' }
      ),
    end_date: z
      .string()
      .min(1, 'End date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in format YYYY-MM-DD'),
    // Note: Empty string to null conversion handled in service layer
    reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
    // Medical certificate attachment URL (optional, only for SICK leave)
    source_attachment_url: z.string().url('Invalid attachment URL').nullable().optional(),
  })
  .refine(
    (data) => {
      // End date must be on or after start date
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      return endDate >= startDate
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Maximum 90 days per request
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

// Input type for forms (before transforms)
export type PilotLeaveRequestInput = z.input<typeof PilotLeaveRequestSchema>
// Output type for validated data (after transforms)
export type PilotLeaveRequestOutput = z.infer<typeof PilotLeaveRequestSchema>

/**
 * Pilot Leave Request Cancellation Schema
 */
export const PilotLeaveCancelSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
})

export type PilotLeaveCancelInput = z.infer<typeof PilotLeaveCancelSchema>

/**
 * Helper function to calculate if request is late (less than 21 days advance notice)
 */
export function isLateRequest(startDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(startDate)
  const daysDiff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return daysDiff < 21
}

/**
 * Helper function to get today's date in ISO format for request_date
 */
export function getTodayISO(): string {
  return new Date().toISOString()
}
