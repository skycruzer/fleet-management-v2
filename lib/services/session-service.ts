/**
 * Secure Session Management Service
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * SECURITY: Fixes session fixation vulnerability
 *
 * Implements secure server-side session management for pilot portal:
 * - Cryptographically secure session tokens
 * - Server-side session storage (not cookies)
 * - Automatic expiry and cleanup
 * - Session revocation
 * - Activity tracking
 */

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'

/**
 * Session cookie name
 */
const SESSION_COOKIE_NAME = 'pilot-session'

/**
 * Session duration (24 hours)
 */
const SESSION_DURATION_HOURS = 24

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
 * Generate a cryptographically secure session token
 * Uses 32 bytes (256 bits) of random data
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Create a new pilot session
 * SECURITY: Generates secure token, stores server-side
 */
export async function createPilotSession(
  pilotUserId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Generate secure session token
    const sessionToken = generateSessionToken()

    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS)

    // Create session in database
    const { data, error } = await supabase
      .from('pilot_sessions' as any)
      .insert({
        session_token: sessionToken,
        pilot_user_id: pilotUserId,
        expires_at: expiresAt.toISOString(),
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create pilot session:', error)
      return {
        success: false,
        error: 'Failed to create session',
      }
    }

    // Set session cookie (HTTP-only, secure)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION_HOURS * 60 * 60, // Convert to seconds
    })

    return {
      success: true,
      sessionToken,
    }
  } catch (error) {
    console.error('Error creating pilot session:', error)
    return {
      success: false,
      error: 'Session creation error',
    }
  }
}

/**
 * Validate pilot session
 * SECURITY: Checks token validity, expiry, and active status
 */
export async function validatePilotSession(
  sessionToken?: string
): Promise<SessionValidationResult> {
  try {
    // Get session token from cookie if not provided
    if (!sessionToken) {
      const cookieStore = await cookies()
      const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
      if (!cookieToken) {
        return {
          isValid: false,
          error: 'No session token found',
        }
      }
      sessionToken = cookieToken
    }

    const supabase = await createClient()

    // Validate session using database function
    const { data, error } = await supabase.rpc('validate_pilot_session' as any, {
      token: sessionToken,
    })

    if (error || !data || data.length === 0) {
      return {
        isValid: false,
        error: 'Invalid session',
      }
    }

    const sessionData = data[0]

    // Check if session is valid
    if (!sessionData.is_valid) {
      return {
        isValid: false,
        error: 'Session expired or revoked',
      }
    }

    // Get full session details
    const { data: session, error: sessionError } = await supabase
      .from('pilot_sessions' as any)
      .select('*')
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      return {
        isValid: false,
        error: 'Session not found',
      }
    }

    return {
      isValid: true,
      session: session as unknown as PilotSession,
      userId: (session as any).pilot_user_id,
    }
  } catch (error) {
    console.error('Error validating pilot session:', error)
    return {
      isValid: false,
      error: 'Session validation error',
    }
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
    const supabase = await createClient()

    const { error } = await supabase
      .from('pilot_sessions' as any)
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq('session_token', sessionToken)

    if (error) {
      console.error('Failed to revoke session:', error)
      return {
        success: false,
        error: 'Failed to revoke session',
      }
    }

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)

    return { success: true }
  } catch (error) {
    console.error('Error revoking pilot session:', error)
    return {
      success: false,
      error: 'Session revocation error',
    }
  }
}

/**
 * Revoke all sessions for a pilot user
 * Useful for logout all devices or password reset
 */
export async function revokeAllPilotSessions(
  pilotUserId: string,
  reason: string = 'User logout all devices'
): Promise<{ success: boolean; revokedCount?: number; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('revoke_all_pilot_sessions' as any, {
      user_id: pilotUserId,
      reason,
    })

    if (error) {
      console.error('Failed to revoke all sessions:', error)
      return {
        success: false,
        error: 'Failed to revoke sessions',
      }
    }

    // Clear current session cookie
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)

    return {
      success: true,
      revokedCount: data || 0,
    }
  } catch (error) {
    console.error('Error revoking all pilot sessions:', error)
    return {
      success: false,
      error: 'Session revocation error',
    }
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
 * Extends session by SESSION_DURATION_HOURS
 */
export async function refreshPilotSession(
  sessionToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Calculate new expiry time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS)

    const { error } = await supabase
      .from('pilot_sessions' as any)
      .update({
        expires_at: expiresAt.toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('session_token', sessionToken)
      .eq('is_active', true)

    if (error) {
      console.error('Failed to refresh session:', error)
      return {
        success: false,
        error: 'Failed to refresh session',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error refreshing pilot session:', error)
    return {
      success: false,
      error: 'Session refresh error',
    }
  }
}

/**
 * Cleanup expired sessions
 * Should be run via cron job
 */
export async function cleanupExpiredSessions(): Promise<{
  success: boolean
  deletedCount?: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('cleanup_expired_pilot_sessions' as any)

    if (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return {
        success: false,
        error: 'Cleanup failed',
      }
    }

    return {
      success: true,
      deletedCount: data || 0,
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error)
    return {
      success: false,
      error: 'Cleanup error',
    }
  }
}
