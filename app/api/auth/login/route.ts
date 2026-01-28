/**
 * Unified Login API Route
 * Developer: Maurice Rondeau
 *
 * POST /api/auth/login — Authenticate with staff_id + password
 * Handles admin, manager, and pilot login via single endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/services/auth-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffId, password } = body

    if (!staffId || !password) {
      return NextResponse.json(
        { success: false, error: 'Staff ID and password are required' },
        { status: 400 }
      )
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await login(staffId, password, { ipAddress, userAgent })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    // Determine redirect based on role
    let redirectUrl = '/dashboard'
    if (result.user?.role === 'pilot') {
      redirectUrl = '/portal/dashboard'
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      mustChangePassword: result.mustChangePassword,
      redirectUrl: result.mustChangePassword ? '/auth/change-password' : redirectUrl,
    })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
