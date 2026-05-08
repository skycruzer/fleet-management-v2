/**
 * Authentication Logout API Route
 * Developer: Maurice Rondeau
 *
 * POST /api/auth/logout - Sign out user and clear all sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { destroyRedisSession } from '@/lib/services/redis-session-service'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export async function POST(_request: NextRequest) {
  try {
    const csrfError = await validateCsrf(_request)
    if (csrfError) return csrfError

    // Clear Redis sessions for all cookie types
    const settled = await Promise.allSettled([
      destroyRedisSession('fleet-session', 'sessions'),
      destroyRedisSession('admin-session', 'admin_sessions'),
      destroyRedisSession('pilot-session', 'pilot_sessions'),
    ])

    // Inspect partial failures — destroyRedisSession returns a result;
    // log loud if redis/db cleanup did not happen so we don't silently
    // leave a session live after a "successful" logout.
    settled.forEach((outcome, idx) => {
      const cookieName = ['fleet-session', 'admin-session', 'pilot-session'][idx]
      if (outcome.status === 'rejected') {
        logError(
          outcome.reason instanceof Error ? outcome.reason : new Error(String(outcome.reason)),
          {
            source: 'logout:destroyRedisSession',
            severity: ErrorSeverity.HIGH,
            metadata: { cookieName },
          }
        )
      } else if (outcome.value.failures.length > 0) {
        logError(new Error('Logout partial failure'), {
          source: 'logout:destroyRedisSession',
          severity: ErrorSeverity.HIGH,
          metadata: { cookieName, failures: outcome.value.failures },
        })
      }
    })

    // Also sign out from Supabase Auth (legacy)
    const supabase = createAdminClient()
    const { error: signOutErr } = await supabase.auth.signOut()
    if (signOutErr) {
      logError(new Error(signOutErr.message), {
        source: 'logout:supabase.signOut',
        severity: ErrorSeverity.HIGH,
      })
    }

    // Redirect to login
    return NextResponse.redirect(new URL('/auth/login', _request.url))
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'logout:catchall',
      severity: ErrorSeverity.HIGH,
    })
    return NextResponse.redirect(new URL('/auth/login', _request.url))
  }
}
