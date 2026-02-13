/**
 * Reports Validation Schemas
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Zod schemas for validating report API requests
 */

import { z } from 'zod'

/**
 * Report Type Enum
 * Updated: November 19, 2025 - Added leave-bids, rdo-sdo, and all-requests
 */
export const ReportTypeSchema = z.enum([
  'rdo-sdo',
  'leave',
  'all-requests',
  'flight-requests',
  'certifications',
  'leave-bids',
  'pilot-info',
  'forecast',
])

/**
 * Date Range Schema
 *
 * Accepts both ISO 8601 datetime strings (e.g., "2025-01-01T00:00:00Z")
 * and date-only strings (e.g., "2025-01-01"). The dual format supports
 * both API clients sending full timestamps and UI date pickers sending
 * date-only values.
 */
export const DateRangeSchema = z
  .object({
    startDate: z
      .string()
      .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
      .or(
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
      ),
    endDate: z
      .string()
      .datetime({ message: 'endDate must be a valid ISO 8601 datetime' })
      .or(
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
      ),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return start <= end
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 365 * 2 // Max 2 years
    },
    {
      message: 'Date range cannot exceed 2 years',
      path: ['dateRange'],
    }
  )

/**
 * Report Filters Schema
 * Phase 2.6: Clarified validation logic - date range counts as a valid filter
 * Phase 2.7: Added pagination parameters, made filters optional (no refinement)
 */
export const ReportFiltersSchema = z.object({
  dateRange: DateRangeSchema.optional(),
  status: z
    .array(
      z.enum([
        // pilot_requests workflow statuses
        'DRAFT',
        'SUBMITTED',
        'IN_REVIEW',
        'APPROVED',
        'DENIED',
        'WITHDRAWN',
        // leave_bids statuses
        'PENDING',
        'PROCESSING',
        'REJECTED',
      ])
    )
    .optional(),
  rank: z.array(z.enum(['Captain', 'First Officer'])).optional(),
  rosterPeriod: z.string().optional(),
  rosterPeriods: z.array(z.string()).optional(),
  checkTypes: z.array(z.string().uuid()).optional(),
  categories: z.array(z.string()).optional(), // Filter by certification category
  expiryThreshold: z.number().int().min(0).max(365).optional(),
  // Pagination parameters (used by service layer)
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
  // Pilot Info Report filters
  activeStatus: z.enum(['active', 'inactive', 'all']).optional(),
  qualifications: z.array(z.enum(['line_captain', 'training_captain', 'examiner'])).optional(),
  licenceType: z.array(z.enum(['ATPL', 'CPL'])).optional(),
  // Forecast Report filters
  timeHorizon: z.enum(['2yr', '5yr', '10yr']).optional(),
  forecastSections: z.array(z.enum(['retirement', 'succession', 'shortage'])).optional(),
  // Grouping support for PDF exports and previews
  groupBy: z.array(z.enum(['rosterPeriod', 'rank', 'category'])).optional(),
})

/**
 * Report Preview Request Schema
 * Phase 2.7: Removed problematic .default({}) that conflicted with validation
 */
export const ReportPreviewRequestSchema = z.object({
  reportType: ReportTypeSchema,
  filters: ReportFiltersSchema.optional(),
})

/**
 * Report Export Request Schema
 * Phase 2.7: Removed problematic .default({}) that conflicted with validation
 */
export const ReportExportRequestSchema = z.object({
  reportType: ReportTypeSchema,
  filters: ReportFiltersSchema.optional(),
})

/**
 * Email Recipients Schema (To field)
 */
export const EmailRecipientsSchema = z
  .array(z.string().email({ message: 'Invalid email address format' }))
  .min(1, 'At least one recipient is required')
  .max(20, 'Maximum 20 recipients allowed')

/**
 * CC Recipients Schema (optional, max 10 recipients)
 */
export const CCRecipientsSchema = z
  .array(z.string().email({ message: 'Invalid CC email address format' }))
  .max(10, 'Maximum 10 CC recipients allowed')
  .optional()

/**
 * BCC Recipients Schema (optional, max 10 recipients)
 */
export const BCCRecipientsSchema = z
  .array(z.string().email({ message: 'Invalid BCC email address format' }))
  .max(10, 'Maximum 10 BCC recipients allowed')
  .optional()

/**
 * Report Email Request Schema
 * Phase 2.7: Removed problematic .default({}) that conflicted with validation
 * Phase 5.1: Added CC and BCC support
 */
export const ReportEmailRequestSchema = z.object({
  reportType: ReportTypeSchema,
  filters: ReportFiltersSchema.optional(),
  recipients: EmailRecipientsSchema,
  cc: CCRecipientsSchema,
  bcc: BCCRecipientsSchema,
  subject: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
})

/**
 * Type exports for TypeScript
 */
export type ReportType = z.infer<typeof ReportTypeSchema>
export type DateRange = z.infer<typeof DateRangeSchema>
export type ReportFilters = z.infer<typeof ReportFiltersSchema>
export type ReportPreviewRequest = z.infer<typeof ReportPreviewRequestSchema>
export type ReportExportRequest = z.infer<typeof ReportExportRequestSchema>
export type ReportEmailRequest = z.infer<typeof ReportEmailRequestSchema>
