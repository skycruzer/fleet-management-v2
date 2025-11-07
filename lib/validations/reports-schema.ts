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
 */
export const ReportTypeSchema = z.enum(['leave', 'flight-requests', 'certifications'])

/**
 * Date Range Schema
 */
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
}).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return start <= end
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
).refine(
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
  status: z.array(z.enum(['pending', 'approved', 'rejected'])).optional(),
  rank: z.array(z.enum(['Captain', 'First Officer'])).optional(),
  rosterPeriod: z.string().optional(),
  rosterPeriods: z.array(z.string()).optional(),
  checkTypes: z.array(z.string().uuid()).optional(),
  expiryThreshold: z.number().int().min(0).max(365).optional(),
  // Pagination parameters (used by service layer)
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
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
 * Email Recipients Schema
 */
export const EmailRecipientsSchema = z.array(
  z.string().email({ message: 'Invalid email address format' })
).min(1, 'At least one recipient is required').max(20, 'Maximum 20 recipients allowed')

/**
 * Report Email Request Schema
 * Phase 2.7: Removed problematic .default({}) that conflicted with validation
 */
export const ReportEmailRequestSchema = z.object({
  reportType: ReportTypeSchema,
  filters: ReportFiltersSchema.optional(),
  recipients: EmailRecipientsSchema,
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
