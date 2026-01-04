/**
 * Request Update Validation Schemas
 *
 * Validates admin updates to pilot requests (leave, flight, bids).
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

import { z } from 'zod'

/**
 * Schema for updating pilot request fields
 * All fields are optional - only provided fields will be updated
 */
export const RequestUpdateSchema = z
  .object({
    request_type: z
      .enum([
        'ANNUAL',
        'SICK',
        'LSL',
        'LWOP',
        'MATERNITY',
        'COMPASSIONATE',
        'RDO',
        'SDO',
        'FLIGHT_REQUEST',
        'SCHEDULE_CHANGE',
      ])
      .optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    flight_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Flight date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    reason: z.string().max(1000, 'Reason must be less than 1000 characters').optional().nullable(),
    notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional().nullable(),
    source_reference: z
      .string()
      .max(500, 'Source reference must be less than 500 characters')
      .optional()
      .nullable(),
    source_attachment_url: z.string().url('Invalid URL format').optional().nullable(),
  })
  .refine(
    (data) => {
      // If both start_date and end_date are provided, validate that end >= start
      if (data.start_date && data.end_date) {
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
      // At least one field must be provided for an update
      const hasUpdate = Object.values(data).some((value) => value !== undefined)
      return hasUpdate
    },
    {
      message: 'At least one field must be provided for update',
    }
  )

export type RequestUpdateInput = z.infer<typeof RequestUpdateSchema>

/**
 * Schema for status updates (approve/deny)
 */
export const RequestStatusUpdateSchema = z
  .object({
    status: z.enum(['APPROVED', 'DENIED', 'IN_REVIEW', 'WITHDRAWN'], {
      message: 'Valid status is required',
    }),
    comments: z.string().max(1000, 'Comments must be less than 1000 characters').optional(),
  })
  .refine(
    (data) => {
      // Comments required for DENIED status
      if (data.status === 'DENIED' && !data.comments) {
        return false
      }
      return true
    },
    {
      message: 'Comments are required when denying a request',
      path: ['comments'],
    }
  )

export type RequestStatusUpdateInput = z.infer<typeof RequestStatusUpdateSchema>
