import { z } from 'zod'

/**
 * RDO/SDO Request Validation Schemas
 *
 * Validates pilot RDO (Rostered Day Off) and SDO (Scheduled Day Off) request submissions and admin reviews.
 */

// RDO/SDO request submission schema
export const FlightRequestSchema = z
  .object({
    request_type: z.enum(['RDO', 'SDO'], {
      message: 'Request type is required',
    }),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
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
      .optional()
      .or(z.literal(''))
      .transform((val) => {
        // Transform empty strings to undefined for single-day requests
        if (!val || val.trim() === '') return undefined
        return val
      })
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: 'End date must be in YYYY-MM-DD format',
      }),
    roster_period: z.string().optional(), // Auto-calculated, optional in submission
    description: z
      .string()
      .optional()
      .transform((val) => {
        // Transform empty strings to undefined
        if (!val || val.trim() === '') return undefined
        return val
      })
      .refine((val) => !val || val.length >= 10, {
        message: 'Description must be at least 10 characters if provided',
      })
      .refine((val) => !val || val.length <= 2000, {
        message: 'Description must be less than 2000 characters',
      }),
    reason: z.string().max(1000, 'Reason must be less than 1000 characters').optional(),
  })
  .refine(
    (data) => {
      // If end_date provided, it must be >= start_date
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
      // Max duration: 90 days
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

// Input type for forms (before transforms)
export type FlightRequestInput = z.input<typeof FlightRequestSchema>
// Output type for validated data (after transforms)
export type FlightRequestOutput = z.infer<typeof FlightRequestSchema>

// Flight request review schema (admin)
export const FlightRequestReviewSchema = z
  .object({
    status: z.enum(['IN_REVIEW', 'APPROVED', 'DENIED'], {
      message: 'Review status is required',
    }),
    reviewer_comments: z
      .string()
      .max(1000, 'Reviewer comments must be less than 1000 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // If status is DENIED, comments should be provided (not required but recommended)
      if (data.status === 'DENIED' && !data.reviewer_comments) {
        return false
      }
      return true
    },
    {
      message: 'Comments are required when denying a request',
      path: ['reviewer_comments'],
    }
  )

export type FlightRequestReviewInput = z.infer<typeof FlightRequestReviewSchema>

// Query filters schema
export const FlightRequestFiltersSchema = z.object({
  status: z.enum(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED']).optional(),
  pilot_id: z.string().uuid().optional(),
  request_date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  request_date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type FlightRequestFilters = z.infer<typeof FlightRequestFiltersSchema>
