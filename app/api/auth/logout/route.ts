/**
 * Authentication Logout API Route
 * Developer: Maurice Rondeau
 *
 * POST /api/auth/logout - Sign out user and clear all sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { destroyRedisSession } from '@/lib/services/redis-session-service'

export async function POST(_request: NextRequest) {
  try {
    // Clear Redis sessions for all cookie types
    await Promise.allSettled([
      destroyRedisSession('fleet-session', 'sessions'),
      destroyRedisSession('admin-session', 'admin_sessions'),
      destroyRedisSession('pilot-session', 'pilot_sessions'),
    ])

    // Also sign out from Supabase Auth (legacy)
    const supabase = createAdminClient()
    await supabase.auth.signOut()

    // Redirect to login
    return NextResponse.redirect(new URL('/auth/login', _request.url))
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.redirect(new URL('/auth/login', _request.url))
  }
}
