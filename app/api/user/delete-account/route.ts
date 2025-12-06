/**
 * Delete Account API Route
 * Handles account deletion with safety checks
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
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
import { deleteUserAccount } from '@/lib/services/account-deletion-service'

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

    // Use service layer to handle account deletion
    const result = await deleteUserAccount({
      userId: user.id,
      userEmail: user.email || undefined,
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
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account',
      },
      { status: 500 }
    )
  }
}
