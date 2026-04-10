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
 * Date validation: Accepts both ISO datetime (2025-01-30T00:00:00.000Z)
 * and simple date (2025-01-30) formats from HTML date inputs
 */
const dateSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true
      // Accept ISO datetime or YYYY-MM-DD format
      const isoDatetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/
      return isoDatetimeRegex.test(val) || simpleDateRegex.test(val)
    },
    { message: 'Must be a valid date (YYYY-MM-DD) or ISO datetime string' }
  )
  .optional()
  .nullable()

// ===================================
// CERTIFICATION CREATE SCHEMA
// ===================================

export const CertificationCreateSchema = z.object({
  pilot_id: uuidSchema,
  check_type_id: uuidSchema,
  expiry_date: dateSchema,
})

export type CertificationCreate = z.infer<typeof CertificationCreateSchema>

// ===================================
// CERTIFICATION UPDATE SCHEMA
// ===================================

export const CertificationUpdateSchema = z.object({
  pilot_id: uuidSchema.optional(),
  check_type_id: uuidSchema.optional(),
  expiry_date: dateSchema,
})

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
