import { z } from 'zod'

/**
 * Flight Request Validation Schemas
 *
 * Validates pilot flight request submissions and admin reviews.
 */

// Flight request submission schema
export const FlightRequestSchema = z.object({
  request_type: z.enum(
    ['REQUEST_FLIGHT', 'REQUEST_DAY_OFF', 'REQUEST_SUBSTITUTE_DAY_OFF', 'REQUEST_OTHER_DUTY'],
    {
      message: 'Request type is required',
    }
  ),
  request_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Request date must be in YYYY-MM-DD format')
    .refine(
      (date) => {
        const requestDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return requestDate >= today
      },
      { message: 'Request date cannot be in the past' }
    ),
  roster_period: z.string().optional(), // Auto-calculated, optional in submission
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  reason: z
    .string()
    .max(1000, 'Reason must be less than 1000 characters')
    .optional(),
})

export type FlightRequestInput = z.infer<typeof FlightRequestSchema>

// Flight request review schema (admin)
export const FlightRequestReviewSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'DENIED'], {
    message: 'Review status is required',
  }),
  reviewer_comments: z
    .string()
    .max(1000, 'Reviewer comments must be less than 1000 characters')
    .optional(),
}).refine(
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
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'DENIED']).optional(),
  pilot_id: z.string().uuid().optional(),
  request_date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  request_date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type FlightRequestFilters = z.infer<typeof FlightRequestFiltersSchema>
