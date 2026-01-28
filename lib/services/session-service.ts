/**
 * Secure Session Management Service
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * SECURITY: Fixes session fixation vulnerability
 *
 * Implements secure server-side session management for pilot portal.
 * Now delegates to redis-session-service for Redis-backed sessions
 * with DB audit logging.
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { cookies } from 'next/headers'
import {
  createRedisSession,
  validateRedisSession,
  destroyRedisSession,
  destroyAllUserSessions,
  type RedisSessionResult,
} from '@/lib/services/redis-session-service'

/**
 * Session cookie name
 */
const SESSION_COOKIE_NAME = 'pilot-session'

/**
 * Session token interface
 */
export interface PilotSession {
  id: string
  session_token: string
  pilot_user_id: string
  created_at: string
  expires_at: string
  last_activity_at: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  isValid: boolean
  session?: PilotSession
  userId?: string
  error?: string
}

/**
 * Create a new pilot session
 * SECURITY: Generates secure token, stores in Redis + DB
 */
export async function createPilotSession(
  pilotUserId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  try {
    // Look up pilot user data for Redis session
    const supabase = createServiceRoleClient()
    const { data: pilotUser, error: userError } = await supabase
      .from('pilot_users')
      .select('id, email, first_name, last_name, employee_id')
      .eq('id', pilotUserId)
      .single()

    if (userError || !pilotUser) {
      return { success: false, error: 'Pilot user not found' }
    }

    return await createRedisSession(
      {
        userId: pilotUserId,
        role: 'pilot',
        email: pilotUser.email,
        staffId: pilotUser.employee_id || pilotUser.email,
        name: `${pilotUser.first_name} ${pilotUser.last_name}`,
        pilotId: pilotUserId,
        mustChangePassword: false,
      },
      {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        cookieName: SESSION_COOKIE_NAME,
        dbTable: 'pilot_sessions',
        dbUserIdColumn: 'pilot_user_id',
      }
    )
  } catch (error) {
    console.error('Error creating pilot session:', error)
    return { success: false, error: 'Session creation error' }
  }
}

/**
 * Validate pilot session
 * SECURITY: Checks token validity via Redis (with DB fallback)
 */
export async function validatePilotSession(
  sessionToken?: string
): Promise<SessionValidationResult> {
  // If a specific token was passed, set it as a cookie temporarily
  // (this is rare — most callers don't pass a token)
  if (sessionToken) {
    const cookieStore = await cookies()
    const existingToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (existingToken !== sessionToken) {
      // Token was passed explicitly but doesn't match cookie — validate via DB directly
      return await validatePilotSessionByToken(sessionToken)
    }
  }

  const result: RedisSessionResult = await validateRedisSession(
    SESSION_COOKIE_NAME,
    'pilot_sessions',
    'pilot_user_id'
  )

  if (!result.isValid || !result.data) {
    return { isValid: false, error: result.error }
  }

  // Map RedisSessionData back to PilotSession for backward compatibility
  const pilotSession: PilotSession = {
    id: result.data.sessionId,
    session_token: '',
    pilot_user_id: result.data.userId,
    created_at: result.data.createdAt,
    expires_at: result.data.expiresAt,
    last_activity_at: result.data.lastActivityAt,
    is_active: true,
  }

  return {
    isValid: true,
    session: pilotSession,
    userId: result.data.userId,
  }
}

/**
 * Validate by explicit token (for rare cases where token is passed directly)
 */
async function validatePilotSessionByToken(sessionToken: string): Promise<SessionValidationResult> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase.rpc('validate_pilot_session' as any, {
      token: sessionToken,
    })

    if (error || !data || data.length === 0) {
      return { isValid: false, error: 'Invalid session' }
    }

    const sessionData = data[0]
    if (!sessionData.is_valid) {
      return { isValid: false, error: 'Session expired or revoked' }
    }

    const { data: session, error: sessionError } = await supabase
      .from('pilot_sessions' as any)
      .select('*')
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      return { isValid: false, error: 'Session not found' }
    }

    return {
      isValid: true,
      session: session as unknown as PilotSession,
      userId: (session as any).pilot_user_id,
    }
  } catch (error) {
    console.error('Error validating pilot session by token:', error)
    return { isValid: false, error: 'Session validation error' }
  }
}

/**
 * Revoke a specific pilot session
 */
export async function revokePilotSession(
  sessionToken: string,
  reason: string = 'User logout'
): Promise<{ success: boolean; error?: string }> {
  try {
    await destroyRedisSession(SESSION_COOKIE_NAME, 'pilot_sessions')

    // Also update revocation metadata in DB
    const supabase = createServiceRoleClient()
    await supabase
      .from('pilot_sessions' as any)
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq('session_token', sessionToken)

    return { success: true }
  } catch (error) {
    console.error('Error revoking pilot session:', error)
    return { success: false, error: 'Session revocation error' }
  }
}

/**
 * Revoke all sessions for a pilot user
 */
export async function revokeAllPilotSessions(
  pilotUserId: string,
  reason: string = 'User logout all devices'
): Promise<{ success: boolean; revokedCount?: number; error?: string }> {
  try {
    await destroyAllUserSessions(pilotUserId, 'pilot_sessions', 'pilot_user_id')

    // Also call the DB stored procedure for revocation metadata
    const supabase = createServiceRoleClient()
    const { data } = await supabase.rpc('revoke_all_pilot_sessions' as any, {
      user_id: pilotUserId,
      reason,
    })

    // Clear current session cookie
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)

    return { success: true, revokedCount: data || 0 }
  } catch (error) {
    console.error('Error revoking all pilot sessions:', error)
    return { success: false, error: 'Session revocation error' }
  }
}

/**
 * Get current pilot session
 * Returns null if no valid session
 */
export async function getCurrentPilotSession(): Promise<PilotSession | null> {
  const validation = await validatePilotSession()
  return validation.isValid ? validation.session || null : null
}

/**
 * Refresh session expiry
 * Redis TTL extension is handled automatically by validateRedisSession
 */
export async function refreshPilotSession(
  _sessionToken: string
): Promise<{ success: boolean; error?: string }> {
  // TTL extension is now handled automatically by redis-session-service
  // during validation (throttled to once per 60s).
  return { success: true }
}

/**
 * Cleanup expired sessions
 * Redis handles expiry via TTL. This only cleans DB records.
 */
export async function cleanupExpiredSessions(): Promise<{
  success: boolean
  deletedCount?: number
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('cleanup_expired_pilot_sessions' as any)

    if (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return { success: false, error: 'Cleanup failed' }
    }

    return { success: true, deletedCount: data || 0 }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error)
    return { success: false, error: 'Cleanup error' }
  }
}
