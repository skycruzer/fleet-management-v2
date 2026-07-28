import { z } from 'zod'

/**
 * Admin Change Password Schemas
 *
 * Shared by the settings Change Password dialog (client) and
 * POST /api/user/change-password (server). Complexity rules mirror the
 * requirements checklist rendered in the dialog — keep both in sync.
 */

export const AdminPasswordComplexity = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character')

export const ChangeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: AdminPasswordComplexity,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from your current password.',
    path: ['newPassword'],
  })

export type ChangeAdminPasswordInput = z.infer<typeof ChangeAdminPasswordSchema>
