/**
 * Published Roster Validation Schema
 *
 * Zod schemas for roster upload validation and API request validation.
 *
 * Developer: Maurice Rondeau
 */

import { z } from 'zod'

/**
 * File upload validation
 * Ensures the file is a PDF and within size limits
 */
export const RosterFileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type === 'application/pdf', {
      message: 'File must be a PDF',
    })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'File size must be less than 10MB',
    }),
  rosterPeriodCode: z
    .string()
    .regex(/^RP\d{2}\/\d{4}$/, {
      message: 'Period code must be in format RP##/YYYY (e.g., RP01/2026)',
    })
    .optional(),
})

/**
 * Roster upload request body
 */
export const RosterUploadRequestSchema = z.object({
  rosterPeriodCode: z
    .string()
    .optional()
    .describe('Optional period code. If not provided, extracted from PDF'),
})

/**
 * Roster filter schema
 */
export const RosterFiltersSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2099).optional(),
  rosterId: z.string().uuid().optional(),
})

/**
 * Roster assignment filter schema
 */
export const RosterAssignmentFiltersSchema = z.object({
  pilotId: z.string().uuid().optional(),
  rank: z.enum(['CAPTAIN', 'FIRST_OFFICER']).optional(),
  activityCode: z.string().max(10).optional(),
})

/**
 * Get roster request schema
 */
export const GetRosterRequestSchema = z.object({
  id: z.string().uuid(),
  filters: RosterAssignmentFiltersSchema.optional(),
})

/**
 * Delete roster request schema
 */
export const DeleteRosterRequestSchema = z.object({
  id: z.string().uuid(),
})

/**
 * Get signed URL request schema
 */
export const GetSignedUrlRequestSchema = z.object({
  rosterId: z.string().uuid(),
  expiresIn: z.number().int().min(1).max(604800).optional().default(3600),
})

/**
 * Type exports for use in API routes
 */
export type RosterFileUpload = z.infer<typeof RosterFileUploadSchema>
export type RosterUploadRequest = z.infer<typeof RosterUploadRequestSchema>
export type RosterFilters = z.infer<typeof RosterFiltersSchema>
export type RosterAssignmentFilters = z.infer<typeof RosterAssignmentFiltersSchema>
export type GetRosterRequest = z.infer<typeof GetRosterRequestSchema>
export type DeleteRosterRequest = z.infer<typeof DeleteRosterRequestSchema>
export type GetSignedUrlRequest = z.infer<typeof GetSignedUrlRequestSchema>
