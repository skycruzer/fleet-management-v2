/**
 * Certification Validation Schemas
 * Comprehensive Zod validation for certification CRUD operations
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

import { z } from 'zod'

// ===================================
// BASE SCHEMAS
// ===================================

/**
 * UUID validation for IDs
 */
const uuidSchema = z.string().uuid('Must be a valid UUID')

/**
 * Date validation: Must be ISO date string
 */
const dateSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO datetime string' })
  .optional()
  .nullable()

/**
 * Required date validation (currently unused)
 */
// const requiredDateSchema = z.string().datetime({ message: 'Must be a valid ISO datetime string' })

/**
 * Roster period validation: Format "RP1/2025" through "RP13/2025"
 */
const rosterPeriodSchema = z
  .string()
  .regex(
    /^RP(1[0-3]|[1-9])\/\d{4}$/,
    'Roster period must be in format "RP1/2025" through "RP13/2025"'
  )
  .optional()
  .nullable()

/**
 * Notes validation: Max 500 characters
 */
const notesSchema = z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable()

// ===================================
// CERTIFICATION CREATE SCHEMA
// ===================================

export const CertificationCreateSchema = z
  .object({
    pilot_id: uuidSchema,
    check_type_id: uuidSchema,
    completion_date: dateSchema,
    expiry_date: dateSchema,
    expiry_roster_period: rosterPeriodSchema,
    notes: notesSchema,
  })
  .refine(
    (data) => {
      // If completion_date is provided, it must be in the past or today
      if (data.completion_date) {
        const completionDate = new Date(data.completion_date)
        const today = new Date()
        today.setHours(23, 59, 59, 999) // End of today
        return completionDate <= today
      }
      return true
    },
    {
      message: 'Completion date cannot be in the future',
      path: ['completion_date'],
    }
  )
  .refine(
    (data) => {
      // If both completion_date and expiry_date are provided, expiry must be after completion
      if (data.completion_date && data.expiry_date) {
        const completionDate = new Date(data.completion_date)
        const expiryDate = new Date(data.expiry_date)
        return expiryDate > completionDate
      }
      return true
    },
    {
      message: 'Expiry date must be after completion date',
      path: ['expiry_date'],
    }
  )

export type CertificationCreate = z.infer<typeof CertificationCreateSchema>

// ===================================
// CERTIFICATION UPDATE SCHEMA
// ===================================

export const CertificationUpdateSchema = z
  .object({
    pilot_id: uuidSchema.optional(),
    check_type_id: uuidSchema.optional(),
    completion_date: dateSchema,
    expiry_date: dateSchema,
    expiry_roster_period: rosterPeriodSchema,
    notes: notesSchema,
  })
  .partial()
  .refine(
    (data) => {
      if (data.completion_date) {
        const completionDate = new Date(data.completion_date)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        return completionDate <= today
      }
      return true
    },
    {
      message: 'Completion date cannot be in the future',
      path: ['completion_date'],
    }
  )
  .refine(
    (data) => {
      if (data.completion_date && data.expiry_date) {
        const completionDate = new Date(data.completion_date)
        const expiryDate = new Date(data.expiry_date)
        return expiryDate > completionDate
      }
      return true
    },
    {
      message: 'Expiry date must be after completion date',
      path: ['expiry_date'],
    }
  )

export type CertificationUpdate = z.infer<typeof CertificationUpdateSchema>

// ===================================
// BATCH UPDATE SCHEMA
// ===================================

export const BatchCertificationUpdateItemSchema = z.object({
  id: uuidSchema,
  updates: CertificationUpdateSchema,
})

export const BatchCertificationUpdateSchema = z
  .array(BatchCertificationUpdateItemSchema)
  .min(1, 'Batch update must contain at least one certification')
  .max(100, 'Batch update cannot exceed 100 certifications')

export type BatchCertificationUpdate = z.infer<typeof BatchCertificationUpdateSchema>

// ===================================
// CERTIFICATION ID SCHEMA
// ===================================

export const CertificationIdSchema = uuidSchema

export type CertificationId = z.infer<typeof CertificationIdSchema>

// ===================================
// PILOT ID FOR CERTIFICATIONS
// ===================================

export const PilotIdForCertificationsSchema = uuidSchema

export type PilotIdForCertifications = z.infer<typeof PilotIdForCertificationsSchema>

// ===================================
// EXPIRING CERTIFICATIONS FILTER
// ===================================

export const ExpiringCertificationsFilterSchema = z.object({
  daysAhead: z
    .number()
    .int('Days ahead must be an integer')
    .min(1, 'Days ahead must be at least 1')
    .max(365, 'Days ahead cannot exceed 365')
    .optional()
    .default(60),
})

export type ExpiringCertificationsFilter = z.infer<typeof ExpiringCertificationsFilterSchema>

// ===================================
// CERTIFICATION STATUS FILTER
// ===================================

export const CertificationStatusEnum = z.enum(['current', 'expiring', 'expired', 'all'], {
  message: 'Status must be one of: current, expiring, expired, all',
})

export const CertificationFilterSchema = z.object({
  status: CertificationStatusEnum.optional(),
  pilotId: uuidSchema.optional(),
  checkTypeId: uuidSchema.optional(),
  category: z.string().max(50, 'Category cannot exceed 50 characters').optional(),
})

export type CertificationFilter = z.infer<typeof CertificationFilterSchema>
