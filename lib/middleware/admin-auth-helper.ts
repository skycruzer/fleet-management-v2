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
import { validateAdminSession } from '@/lib/services/admin-auth-service'

export interface AdminAuthResult {
  authenticated: boolean
  source: 'supabase' | 'admin-session' | null
  userId: string | null
  email: string | null
}

/**
 * Check if the current request is authenticated as an admin
 * First tries Supabase Auth, then falls back to admin-session cookie
 *
 * @returns AdminAuthResult with authentication status and user details
 */
export async function getAuthenticatedAdmin(): Promise<AdminAuthResult> {
  // Try Supabase Auth first
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return {
      authenticated: true,
      source: 'supabase',
      userId: user.id,
      email: user.email ?? null,
    }
  }

  // Fall back to admin-session cookie (bcrypt authentication)
  const adminSession = await validateAdminSession()

  if (adminSession.isValid && adminSession.user) {
    return {
      authenticated: true,
      source: 'admin-session',
      userId: adminSession.user.id,
      email: adminSession.user.email,
    }
  }

  return {
    authenticated: false,
    source: null,
    userId: null,
    email: null,
  }
}
