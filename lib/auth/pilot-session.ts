/**
 * Custom Session Management for Pilot Portal
 * Developer: Maurice Rondeau
 *
 * Handles session creation and validation for bcrypt-authenticated pilots.
 * Now delegates to redis-session-service for Redis-backed sessions.
 * Uses HTTP-only cookies for secure session storage.
 */

import { z } from 'zod'
import { cookies } from 'next/headers'
import { validateRedisSession, type RedisSessionData } from '@/lib/services/redis-session-service'

const SESSION_COOKIE_NAME = 'pilot_session_token'

/**
 * Schema for the legacy JSON session cookie. Validates the actual fields stored
 * by the legacy cookie format (token/pilot_id/pilot_email/expires_at) so that
 * malformed cookies are rejected explicitly rather than failing silently.
 */
const LegacySessionSchema = z.object({
  token: z.string().min(1),
  pilot_id: z.string().min(1),
  pilot_email: z.string().email(),
  expires_at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid expires_at date',
  }),
})

export interface PilotSession {
  id: string
  pilot_id: string
  pilot_email: string
  expires_at: string
}

/**
 * Create a new pilot session
 *
 * Note: This legacy function is kept for backward compatibility.
 * New code should use createPilotSession from session-service.ts instead.
 */
export async function createPilotSession(
  pilotId: string,
  _pilotEmail: string,
  _response?: any
): Promise<string> {
  // Import dynamically to avoid circular dependency
  const { createPilotSession: createSession } = await import('@/lib/services/session-service')

  const result = await createSession(pilotId, {})

  if (!result.success || !result.sessionToken) {
    throw new Error('Failed to create pilot session')
  }

  return result.sessionToken
}

/**
 * Get current pilot session from cookie
 * Now uses Redis validation with DB fallback
 */
export async function getPilotSession(): Promise<PilotSession | null> {
  try {
    // Try the newer pilot-session cookie first (from session-service)
    const cookieStore = await cookies()
    const pilotSessionCookie = cookieStore.get('pilot-session')

    if (pilotSessionCookie?.value) {
      const result = await validateRedisSession('pilot-session', 'pilot_sessions', 'pilot_user_id')

      if (result.isValid && result.data) {
        return mapRedisDataToPilotSession(result.data)
      }
    }

    // Fall back to legacy pilot_session_token cookie (JSON-based)
    const legacyCookie = cookieStore.get(SESSION_COOKIE_NAME)
    if (legacyCookie?.value) {
      return parseLegacyCookie(legacyCookie.value)
    }

    return null
  } catch (error) {
    console.error('Error getting pilot session:', error)
    return null
  }
}

/**
 * Map RedisSessionData to the legacy PilotSession interface
 */
function mapRedisDataToPilotSession(data: RedisSessionData): PilotSession {
  return {
    id: data.sessionId,
    pilot_id: data.userId,
    pilot_email: data.email || '',
    expires_at: data.expiresAt,
  }
}

/**
 * Parse legacy JSON cookie (backward compatibility)
 */
function parseLegacyCookie(cookieValue: string): PilotSession | null {
  try {
    const sessionData = LegacySessionSchema.parse(JSON.parse(cookieValue))
    const expiresAt = new Date(sessionData.expires_at)

    if (expiresAt < new Date()) {
      return null
    }

    return {
      id: sessionData.token,
      pilot_id: sessionData.pilot_id,
      pilot_email: sessionData.pilot_email,
      expires_at: sessionData.expires_at,
    }
  } catch (error) {
    console.warn('Invalid legacy pilot session cookie:', error)
    return null
  }
}

/**
 * Clear pilot session
 */
export async function clearPilotSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  cookieStore.delete('pilot-session')
}

/**
 * Validate session from request (for middleware use)
 */
export function validateSessionFromCookie(cookieValue: string | undefined): PilotSession | null {
  if (!cookieValue) {
    return null
  }

  try {
    const sessionData = LegacySessionSchema.parse(JSON.parse(cookieValue))
    const expiresAt = new Date(sessionData.expires_at)
    if (expiresAt < new Date()) {
      return null
    }

    return {
      id: sessionData.token,
      pilot_id: sessionData.pilot_id,
      pilot_email: sessionData.pilot_email,
      expires_at: sessionData.expires_at,
    }
  } catch (error) {
    console.warn('Invalid legacy pilot session cookie:', error)
    return null
  }
}
