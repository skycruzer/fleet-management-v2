/**
 * System Settings API - Individual Setting Operations
 * PUT /api/settings/[id] - Update a specific setting
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { updateSystemSetting } from '@/lib/services/admin-service'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(_request)
    if (csrfError) return csrfError

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // AUTHORIZATION: Admin-only endpoint
    const roleCheck = await requireRole(_request, [UserRole.ADMIN])
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: roleCheck.statusCode }
      )
    }

    const { id } = await params
    const body = await _request.json()
    const { value, description } = body

    // Validate input
    if (value === undefined && !description) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 })
    }

    // Update the setting
    const updated = await updateSystemSetting(id, { value, description })

    // Revalidate all pages that use settings (especially app_title)
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/admin/settings', 'page')

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Setting updated successfully',
    })
  } catch (error) {
    console.error('❌ PUT /api/settings/[id] - Error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'updateSystemSetting',
      settingId: (await params).id,
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
