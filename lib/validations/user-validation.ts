/**
 * User Validation Schemas
 * Comprehensive Zod validation for user CRUD operations
 *
 * @version 1.0.0
 * @since 2025-10-18
 */

import { z } from 'zod'

// ===================================
// ENUMS & CONSTANTS
// ===================================

export const UserRoleEnum = z.enum(['Admin', 'Manager', 'User'], {
  message: 'Role must be one of: Admin, Manager, User',
})

// ===================================
// BASE SCHEMAS
// ===================================

/**
 * UUID validation for IDs
 */
const uuidSchema = z.string().uuid('Must be a valid UUID')

/**
 * Email validation
 */
const emailSchema = z.string().email('Must be a valid email address').toLowerCase()

/**
 * Name validation
 */
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

// ===================================
// USER CREATE SCHEMA
// ===================================

export const UserCreateSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: UserRoleEnum,
})

export type UserCreate = z.infer<typeof UserCreateSchema>

// ===================================
// USER UPDATE SCHEMA
// ===================================

export const UserUpdateSchema = z
  .object({
    email: emailSchema.optional(),
    name: nameSchema.optional(),
    role: UserRoleEnum.optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type UserUpdate = z.infer<typeof UserUpdateSchema>

// ===================================
// USER ID SCHEMA
// ===================================

export const UserIdSchema = uuidSchema

export type UserId = z.infer<typeof UserIdSchema>

// ===================================
// USER ROLE FILTER SCHEMA
// ===================================

export const UserRoleFilterSchema = z.object({
  role: UserRoleEnum,
})

export type UserRoleFilter = z.infer<typeof UserRoleFilterSchema>

// ===================================
// BULK USER IMPORT SCHEMA
// ===================================

export const BulkUserImportSchema = z.array(UserCreateSchema).min(1, 'At least one user required')

export type BulkUserImport = z.infer<typeof BulkUserImportSchema>
