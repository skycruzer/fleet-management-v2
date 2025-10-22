import { z } from 'zod'

/**
 * Flight Request Validation Schemas
 *
 * Validates pilot flight request submissions and admin reviews.
 */

// Flight request submission schema
export const FlightRequestSchema = z.object({
  request_type: z.enum(['ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_SWAP', 'OTHER'], {
    required_error: 'Request type is required',
    invalid_type_error: 'Invalid request type',
  }),
  flight_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Flight date must be in YYYY-MM-DD format')
    .refine(
      (date) => {
        const requestDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return requestDate >= today
      },
      { message: 'Flight date cannot be in the past' }
    ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
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
    required_error: 'Review status is required',
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
  flight_date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  flight_date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type FlightRequestFilters = z.infer<typeof FlightRequestFiltersSchema>
