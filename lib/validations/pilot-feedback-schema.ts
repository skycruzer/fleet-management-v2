import { z } from 'zod'

/**
 * Pilot Feedback Validation Schemas
 *
 * Simple feedback submission system for pilots to report issues and suggestions
 */

export const FeedbackCategoryEnum = z.enum([
  'operations',
  'training',
  'scheduling',
  'safety',
  'equipment',
  'system',
  'suggestion',
  'other',
])

export type FeedbackCategory = z.infer<typeof FeedbackCategoryEnum>

/**
 * Pilot Feedback Submission Schema
 *
 * Used when pilots submit feedback through the portal
 */
export const PilotFeedbackSchema = z.object({
  category: FeedbackCategoryEnum,
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
  is_anonymous: z.boolean().optional().default(false),
})

export type PilotFeedbackInput = z.infer<typeof PilotFeedbackSchema>

/**
 * Admin Response Schema
 *
 * Used when admin responds to feedback
 */
export const FeedbackResponseSchema = z.object({
  response: z
    .string()
    .min(10, 'Response must be at least 10 characters')
    .max(2000, 'Response must be less than 2000 characters'),
})

export type FeedbackResponseInput = z.infer<typeof FeedbackResponseSchema>

/**
 * Feedback Status Update Schema
 *
 * Used when admin updates feedback status
 */
export const FeedbackStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']),
})

export type FeedbackStatusUpdate = z.infer<typeof FeedbackStatusUpdateSchema>

/**
 * Feedback Filters Schema
 *
 * Used for filtering feedback in admin dashboard
 */
export const FeedbackFiltersSchema = z.object({
  category: FeedbackCategoryEnum.optional(),
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']).optional(),
  pilot_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  search: z.string().max(255).optional(),
})

export type FeedbackFilters = z.infer<typeof FeedbackFiltersSchema>
