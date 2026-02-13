/**
 * Pilot Portal - Change Password API Route
 * Developer: Maurice Rondeau
 *
 * POST /api/portal/change-password
 * Validates session, verifies old password, updates to new password.
 * Sets must_change_password = false after successful change.
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 5 requests per minute per IP (prevents brute force)
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePilotSession } from '@/lib/services/session-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import bcrypt from 'bcryptjs'

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // 1. Validate session
    const session = await validatePilotSession()

    if (!session.isValid || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated. Please log in again.' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Both current and new passwords are required.' },
        { status: 400 }
      )
    }

    // 3. Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    if (newPassword === oldPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from your current password.' },
        { status: 400 }
      )
    }

    // 4. Fetch current password hash from pilot_users
    const supabase = createAdminClient()
    const { data: pilotUser, error: fetchError } = await supabase
      .from('pilot_users')
      .select('id, password_hash')
      .eq('id', session.userId)
      .single()

    if (fetchError || !pilotUser) {
      return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 })
    }

    if (!pilotUser.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Account not configured. Contact your administrator.' },
        { status: 400 }
      )
    }

    // 5. Verify old password
    const oldPasswordMatch = await bcrypt.compare(oldPassword, pilotUser.password_hash)

    if (!oldPasswordMatch) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect.' },
        { status: 401 }
      )
    }

    // 6. Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    const { error: updateError } = await supabase
      .from('pilot_users')
      .update({
        password_hash: newPasswordHash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.userId)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      redirect: '/portal/dashboard',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
})
