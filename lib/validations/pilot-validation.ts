/**
 * Pilot Validation Schemas
 * Comprehensive Zod validation for pilot CRUD operations
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

import { z } from 'zod'

// ===================================
// ENUMS & CONSTANTS
// ===================================

export const PilotRoleEnum = z.enum(['Captain', 'First Officer'], {
  message: 'Rank must be either "Captain" or "First Officer"',
})

export const CaptainQualificationEnum = z.enum(['line_captain', 'training_captain', 'examiner'], {
  message: 'Invalid captain qualification. Must be line_captain, training_captain, or examiner',
})

// ===================================
// BASE SCHEMAS
// ===================================

/**
 * Employee ID validation: Must be exactly 6 digits
 */
const employeeIdSchema = z
  .string()
  .min(1, 'Employee ID is required')
  .regex(/^\d{6}$/, 'Employee ID must be exactly 6 digits')

/**
 * Name validation: 1-50 characters, letters only
 */
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

/**
 * Optional name validation
 */
const optionalNameSchema = z
  .string()
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .optional()
  .nullable()

/**
 * Date validation: Must be ISO date string
 */
const dateSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO datetime string' })
  .optional()
  .nullable()

/**
 * Passport number validation
 */
const passportNumberSchema = z
  .string()
  .min(5, 'Passport number must be at least 5 characters')
  .max(20, 'Passport number cannot exceed 20 characters')
  .regex(/^[A-Z0-9]+$/, 'Passport number must contain only uppercase letters and numbers')
  .optional()
  .nullable()

/**
 * Nationality validation
 */
const nationalitySchema = z
  .string()
  .min(2, 'Nationality must be at least 2 characters')
  .max(50, 'Nationality cannot exceed 50 characters')
  .optional()
  .nullable()

/**
 * Seniority number validation: 1-999
 */
const seniorityNumberSchema = z
  .number()
  .int('Seniority number must be an integer')
  .min(1, 'Seniority number must be at least 1')
  .max(999, 'Seniority number cannot exceed 999')
  .optional()
  .nullable()

// ===================================
// CAPTAIN QUALIFICATIONS SCHEMA
// ===================================

export const CaptainQualificationsSchema = z.object({
  line_captain: z.boolean().optional().default(false),
  training_captain: z.boolean().optional().default(false),
  examiner: z.boolean().optional().default(false),
  rhs_captain_expiry: dateSchema,
})

export type CaptainQualifications = z.infer<typeof CaptainQualificationsSchema>

// ===================================
// PILOT CREATE SCHEMA
// ===================================

export const PilotCreateSchema = z
  .object({
    employee_id: employeeIdSchema,
    first_name: nameSchema,
    middle_name: optionalNameSchema,
    last_name: nameSchema,
    role: PilotRoleEnum,
    contract_type: z.string().optional().nullable(),
    nationality: nationalitySchema,
    passport_number: passportNumberSchema,
    passport_expiry: dateSchema,
    date_of_birth: dateSchema,
    commencement_date: dateSchema,
    seniority_number: seniorityNumberSchema,
    is_active: z.boolean().default(true),
    captain_qualifications: z.array(CaptainQualificationEnum).optional().nullable(),
  })
  .refine(
    (data) => {
      // If passport number is provided, passport expiry must also be provided
      if (data.passport_number && !data.passport_expiry) {
        return false
      }
      return true
    },
    {
      message: 'Passport expiry date is required when passport number is provided',
      path: ['passport_expiry'],
    }
  )
  .refine(
    (data) => {
      // If date_of_birth is provided, validate age (must be at least 18)
      if (data.date_of_birth) {
        const birthDate = new Date(data.date_of_birth)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        return age >= 18
      }
      return true
    },
    {
      message: 'Pilot must be at least 18 years old',
      path: ['date_of_birth'],
    }
  )
  .refine(
    (data) => {
      // If passport_expiry is provided, it must be in the future
      if (data.passport_expiry) {
        const expiryDate = new Date(data.passport_expiry)
        const today = new Date()
        return expiryDate > today
      }
      return true
    },
    {
      message: 'Passport expiry date must be in the future',
      path: ['passport_expiry'],
    }
  )
  .refine(
    (data) => {
      // If captain qualifications are provided, role must be Captain
      if (data.captain_qualifications && data.captain_qualifications.length > 0) {
        return data.role === 'Captain'
      }
      return true
    },
    {
      message: 'Captain qualifications can only be assigned to Captains',
      path: ['captain_qualifications'],
    }
  )

export type PilotCreate = z.infer<typeof PilotCreateSchema>

// ===================================
// PILOT UPDATE SCHEMA
// ===================================

export const PilotUpdateSchema = z
  .object({
    employee_id: employeeIdSchema.optional(),
    first_name: nameSchema.optional(),
    middle_name: optionalNameSchema,
    last_name: nameSchema.optional(),
    role: PilotRoleEnum.optional(),
    contract_type: z.string().optional().nullable(),
    nationality: nationalitySchema,
    passport_number: passportNumberSchema,
    passport_expiry: dateSchema,
    date_of_birth: dateSchema,
    commencement_date: dateSchema,
    seniority_number: seniorityNumberSchema,
    is_active: z.boolean().optional(),
    captain_qualifications: z.array(CaptainQualificationEnum).optional().nullable(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.passport_number && !data.passport_expiry) {
        return false
      }
      return true
    },
    {
      message: 'Passport expiry date is required when passport number is provided',
      path: ['passport_expiry'],
    }
  )
  .refine(
    (data) => {
      if (data.date_of_birth) {
        const birthDate = new Date(data.date_of_birth)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        return age >= 18
      }
      return true
    },
    {
      message: 'Pilot must be at least 18 years old',
      path: ['date_of_birth'],
    }
  )
  .refine(
    (data) => {
      if (data.passport_expiry) {
        const expiryDate = new Date(data.passport_expiry)
        const today = new Date()
        return expiryDate > today
      }
      return true
    },
    {
      message: 'Passport expiry date must be in the future',
      path: ['passport_expiry'],
    }
  )
  .refine(
    (data) => {
      if (data.captain_qualifications && data.captain_qualifications.length > 0 && data.role) {
        return data.role === 'Captain'
      }
      return true
    },
    {
      message: 'Captain qualifications can only be assigned to Captains',
      path: ['captain_qualifications'],
    }
  )

export type PilotUpdate = z.infer<typeof PilotUpdateSchema>

// ===================================
// PILOT SEARCH SCHEMA
// ===================================

export const PilotSearchSchema = z.object({
  searchTerm: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  filters: z
    .object({
      role: z.enum(['Captain', 'First Officer', 'all']).optional(),
      status: z.enum(['active', 'inactive', 'all']).optional(),
    })
    .optional(),
})

export type PilotSearch = z.infer<typeof PilotSearchSchema>

// ===================================
// PILOT ID SCHEMA
// ===================================

export const PilotIdSchema = z.string().uuid('Pilot ID must be a valid UUID')

export type PilotId = z.infer<typeof PilotIdSchema>

// ===================================
// EMPLOYEE ID CHECK SCHEMA
// ===================================

export const EmployeeIdCheckSchema = z.object({
  employeeId: employeeIdSchema,
  excludePilotId: z.string().uuid().optional(),
})

export type EmployeeIdCheck = z.infer<typeof EmployeeIdCheckSchema>

// ===================================
// SENIORITY CALCULATION SCHEMA
// ===================================

export const SeniorityCalculationSchema = z.object({
  commencementDate: z.string().datetime({ message: 'Must be a valid ISO datetime string' }),
  excludePilotId: z.string().uuid().optional(),
})

export type SeniorityCalculation = z.infer<typeof SeniorityCalculationSchema>
