/**
 * Admin Authentication Helper
 * Provides unified authentication check for admin API routes
 * Supports both Supabase Auth and custom admin-session cookie authentication
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.0.0
 * @since 2025-12-28
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminSession } from '@/lib/services/admin-auth-service'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export interface AdminAuthResult {
  authenticated: boolean
  source: 'supabase' | 'admin-session' | null
  userId: string | null
  email: string | null
  role: string | null
}

const ADMIN_ROLES = new Set(['admin', 'manager'])

const UNAUTHENTICATED: AdminAuthResult = {
  authenticated: false,
  source: null,
  userId: null,
  email: null,
  role: null,
}

/**
 * Check if the current request is authenticated as an admin
 * First tries Supabase Auth, then falls back to admin-session cookie.
 *
 * Supabase / DB errors are logged with HIGH severity. We still return an
 * "unauthenticated" result so callers can return 401, but the error is no
 * longer silent — log triage will show DB blips distinct from real auth misses.
 */
export async function getAuthenticatedAdmin(): Promise<AdminAuthResult> {
  // Try Supabase Auth first
  const supabase = await createClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) {
    logError(userErr instanceof Error ? userErr : new Error(String(userErr)), {
      source: 'admin-auth-helper:auth.getUser',
      severity: ErrorSeverity.HIGH,
    })
  }
  const user = userData?.user

  if (user) {
    // Read the credential table with the service role, not the caller's RLS-bound
    // session client — an_users is no longer anon/authenticated-readable.
    const adminSupabase = createAdminClient()
    const { data: adminUser, error: adminErr } = await adminSupabase
      .from('an_users')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    // Distinguish "no row" (PGRST116) from other DB errors — only the latter is logged loud.
    if (adminErr && adminErr.code !== 'PGRST116') {
      logError(new Error(adminErr.message), {
        source: 'admin-auth-helper:an_users(supabase)',
        severity: ErrorSeverity.HIGH,
        metadata: { code: adminErr.code },
      })
    }

    if (!adminUser || !ADMIN_ROLES.has(adminUser.role)) {
      return UNAUTHENTICATED
    }

    return {
      authenticated: true,
      source: 'supabase',
      userId: adminUser.id,
      email: adminUser.email ?? user.email ?? null,
      role: adminUser.role,
    }
  }

  // Fall back to admin-session cookie (bcrypt authentication)
  const adminSession = await validateAdminSession()

  if (adminSession.isValid && adminSession.user) {
    const adminSupabase = createAdminClient()
    const { data: adminUser, error: adminErr } = await adminSupabase
      .from('an_users')
      .select('id, email, role')
      .eq('id', adminSession.user.id)
      .single()

    if (adminErr && adminErr.code !== 'PGRST116') {
      logError(new Error(adminErr.message), {
        source: 'admin-auth-helper:an_users(admin-session)',
        severity: ErrorSeverity.HIGH,
        metadata: { code: adminErr.code },
      })
    }

    if (!adminUser || !ADMIN_ROLES.has(adminUser.role)) {
      return UNAUTHENTICATED
    }

    return {
      authenticated: true,
      source: 'admin-session',
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    }
  }

  return UNAUTHENTICATED
}
