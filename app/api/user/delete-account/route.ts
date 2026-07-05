/**
 * Delete Account API Route
 * Handles account deletion with safety checks
 *
 * @version 2.1.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 *
 * SECURITY: Account deletion is a destructive operation
 * - CSRF protection required (prevents unauthorized deletions)
 * - Rate limiting prevents abuse
 * - Audit logging for compliance
 */

import { NextResponse } from 'next/server'
import { authRateLimit } from '@/lib/rate-limit'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { deleteUserAccount } from '@/lib/services/account-deletion-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const DELETE = createAdminRoute(
  {
    operation: 'deleteUserAccount',
    endpoint: '/api/user/delete-account',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ admin }) => {
    try {
      // Use service layer to handle account deletion
      const result = await deleteUserAccount({
        userId: admin.userId,
        userEmail: admin.email || undefined,
        preserveAuditTrail: true,
        anonymizeData: true,
      })

      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        deletedEntities: result.deletedEntities,
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      const s = sanitizeError(error, {
        operation: 'deleteUserAccount',
        endpoint: '/api/user/delete-account',
      })
      return NextResponse.json(
        { success: false, message: s.error },
        { status: s.statusCode || 500 }
      )
    }
  }
)
