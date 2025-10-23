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
    employee_id: z.string().max(50, 'Employee ID must be less than 50 characters').optional(),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
      .optional()
      .refine(
        (date) => {
          if (!date) return true
          const dob = new Date(date)
          const today = new Date()
          const age = today.getFullYear() - dob.getFullYear()
          return age >= 18 && age <= 100
        },
        { message: 'Pilot must be between 18 and 100 years old' }
      ),
    phone_number: z
      .string()
      .max(20, 'Phone number must be less than 20 characters')
      .regex(/^[+\d\s()-]+$/, 'Invalid phone number format')
      .optional(),
    address: z.string().max(500, 'Address must be less than 500 characters').optional(),
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
