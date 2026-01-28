/**
 * Session Validation API Route
 * Developer: Maurice Rondeau
 *
 * GET /api/auth/session — Validate current session
 */

import { NextResponse } from 'next/server'
import { validateSession } from '@/lib/services/auth-service'

export async function GET() {
  try {
    const result = await validateSession()

    if (!result.isValid) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Session validation failed' },
      { status: 500 }
    )
  }
}
