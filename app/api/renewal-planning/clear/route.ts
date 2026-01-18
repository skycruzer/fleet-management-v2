/**
 * API Route: Clear All Renewal Plans
 * DELETE /api/renewal-planning/clear
 *
 * Deletes all existing renewal plans from the database
 * Use with caution - this is a destructive operation
 *
 * Developer: Maurice Rondeau
 * @version 3.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // SECURITY: Rate limiting (strict for destructive operations)
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Verify admin/manager role
    // For Supabase Auth users: trust them as admins (only admins can access dashboard via Supabase Auth)
    // For admin-session users: look up by ID in an_users table
    const supabase = await createClient()

    if (auth.source === 'admin-session') {
      // Admin session - verify role in an_users table
      const { data: adminUser } = await supabase
        .from('an_users')
        .select('role')
        .eq('id', auth.userId!)
        .single()

      if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin or Manager access required' },
          { status: 403 }
        )
      }
    }
    // Supabase Auth users are trusted as admins (dashboard access requires Supabase Auth)

    // Delete all renewal plans
    const { error } = await supabase
      .from('certification_renewal_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'All renewal plans have been cleared',
    })
  } catch (error: any) {
    console.error('Error clearing renewal plans:', error)
    const sanitized = sanitizeError(error, {
      operation: 'clearAllRenewalPlans',
      endpoint: '/api/renewal-planning/clear',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
