import { z } from 'zod'

/**
 * Pilot Portal Validation Schemas
 *
 * These schemas validate pilot authentication and registration forms.
 * Used with React Hook Form via zodResolver.
 */

// Login Schema
export const PilotLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
})

export type PilotLoginInput = z.infer<typeof PilotLoginSchema>

// Registration Schema
export const PilotRegistrationSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .max(255, 'Email must be less than 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )
      .max(100, 'Password must be less than 100 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be less than 100 characters')
      .regex(
        /^[a-zA-Z\s'-]+$/,
        'First name can only contain letters, spaces, hyphens, and apostrophes'
      ),
    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be less than 100 characters')
      .regex(
        /^[a-zA-Z\s'-]+$/,
        'Last name can only contain letters, spaces, hyphens, and apostrophes'
      ),
    rank: z.enum(['Captain', 'First Officer'], {
      message: 'Rank is required',
    }),
    employee_id: z
      .string()
      .max(50, 'Employee ID must be less than 50 characters')
      .optional()
      .or(z.literal('')), // Allow empty string
    date_of_birth: z
      .string()
      .optional()
      .or(z.literal('')) // Allow empty string
      .refine(
        (date) => {
          if (!date || date === '') return true // Allow empty
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false // Check format
          const dob = new Date(date)
          const today = new Date()
          const age = today.getFullYear() - dob.getFullYear()
          const monthDiff = today.getMonth() - dob.getMonth()
          const finalAge =
            monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age
          return finalAge >= 18 && finalAge <= 100
        },
        { message: 'Date must be in YYYY-MM-DD format and pilot must be 18-100 years old' }
      ),
    phone_number: z
      .string()
      .optional()
      .or(z.literal('')) // Allow empty string
      .refine(
        (phone) => {
          if (!phone || phone === '') return true // Allow empty
          if (phone.length > 20) return false // Check length
          return /^[+\d\s()-]+$/.test(phone) // Check format
        },
        { message: 'Phone number must be valid and less than 20 characters' }
      ),
    address: z
      .string()
      .max(500, 'Address must be less than 500 characters')
      .optional()
      .or(z.literal('')), // Allow empty string
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PilotRegistrationInput = z.infer<typeof PilotRegistrationSchema>

// Registration approval schemas (for admin use)
export const RegistrationApprovalSchema = z
  .object({
    status: z.enum(['APPROVED', 'DENIED'], {
      message: 'Approval status is required',
    }),
    admin_notes: z.string().max(1000, 'Admin notes must be less than 1000 characters').optional(),
    denial_reason: z
      .string()
      .min(10, 'Denial reason must be at least 10 characters')
      .max(500, 'Denial reason must be less than 500 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // If status is DENIED, denial_reason is required
      if (data.status === 'DENIED') {
        return !!data.denial_reason && data.denial_reason.length >= 10
      }
      return true
    },
    {
      message: 'Denial reason is required when denying a registration',
      path: ['denial_reason'],
    }
  )

export type RegistrationApprovalInput = z.infer<typeof RegistrationApprovalSchema>

// Notification update schema
export const NotificationUpdateSchema = z.object({
  read: z.boolean(),
})

export type NotificationUpdateInput = z.infer<typeof NotificationUpdateSchema>
