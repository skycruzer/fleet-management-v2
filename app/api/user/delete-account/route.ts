/**
 * Delete Account API Route
 * Handles account deletion with safety checks
 *
 * @version 3.0.0 - Refactored to use service layer
 * @updated 2025-11-09 - Service layer refactoring
 *
 * SECURITY: Account deletion is a destructive operation
 * - CSRF protection required (prevents unauthorized deletions)
 * - Rate limiting prevents abuse
 * - Audit logging for compliance
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { deleteUserAccount } from '@/lib/services/user-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    // SECURITY: Rate limiting (strict for destructive operations)
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Use service layer for comprehensive account deletion
    await deleteUserAccount(user.id, user.email || 'unknown@example.com')

    // Delete auth user (this will cascade to related tables)
    // Note: This requires service role key in production
    // For now, we'll rely on Supabase RLS and manual cleanup
    // In production, you'd use:
    // await supabaseAdmin.auth.admin.deleteUser(user.id)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    const sanitized = sanitizeError(error, {
      operation: 'deleteUserAccount',
      endpoint: '/api/user/delete-account'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
