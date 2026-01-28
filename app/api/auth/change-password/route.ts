/**
 * Change Password API Route
 * Developer: Maurice Rondeau
 *
 * POST /api/auth/change-password — Change user password
 * Used for first-login mandatory change and voluntary changes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSession, changePassword } from '@/lib/services/auth-service'

export async function POST(request: NextRequest) {
  try {
    const session = await validateSession()
    if (!session.isValid || !session.user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { oldPassword, newPassword, confirmPassword } = body

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All password fields are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New passwords do not match' },
        { status: 400 }
      )
    }

    const result = await changePassword(session.user.id, oldPassword, newPassword)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Determine redirect after password change
    const redirectUrl = session.user.role === 'pilot' ? '/portal/dashboard' : '/dashboard'

    return NextResponse.json({
      success: true,
      redirectUrl,
    })
  } catch (error) {
    console.error('Change password API error:', error)
    return NextResponse.json({ success: false, error: 'An error occurred' }, { status: 500 })
  }
}
