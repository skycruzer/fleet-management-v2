/**
 * Custom Session Management for Pilot Portal
 *
 * Handles session creation and validation for bcrypt-authenticated pilots.
 * Uses HTTP-only cookies for secure session storage.
 */

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

const SESSION_COOKIE_NAME = 'pilot_session_token'
const SESSION_DURATION_DAYS = 7

export interface PilotSession {
  id: string
  pilot_id: string
  pilot_email: string
  expires_at: string
}

/**
 * Create a new pilot session
 *
 * @param pilotId - Pilot user ID
 * @param pilotEmail - Pilot email
 * @param response - NextResponse object to set cookie on (for API routes)
 */
export async function createPilotSession(
  pilotId: string,
  pilotEmail: string,
  response?: any
): Promise<string> {
  // Generate secure session token
  const sessionToken = randomBytes(32).toString('hex')

  // Calculate expiration (7 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  const sessionData = JSON.stringify({
    token: sessionToken,
    pilot_id: pilotId,
    pilot_email: pilotEmail,
    expires_at: expiresAt.toISOString(),
  })

  // Set HTTP-only cookie
  if (response) {
    // API route - set cookie on response object
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionData,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })
  } else {
    // Server Component - use cookies() from next/headers
    const cookieStore = await cookies()
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: sessionData,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })
  }

  return sessionToken
}

/**
 * Get current pilot session from cookie
 */
export async function getPilotSession(): Promise<PilotSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at)
    if (expiresAt < new Date()) {
      // Session expired - clear it
      await clearPilotSession()
      return null
    }

    // Verify pilot still exists and is approved
    const supabase = await createClient()
    const { data: pilot } = await supabase
      .from('pilot_users')
      .select('id, email, registration_approved')
      .eq('id', sessionData.pilot_id)
      .single()

    if (!pilot || pilot.registration_approved !== true) {
      // Pilot not found or not approved - clear session
      await clearPilotSession()
      return null
    }

    return {
      id: sessionData.token,
      pilot_id: sessionData.pilot_id,
      pilot_email: sessionData.pilot_email,
      expires_at: sessionData.expires_at,
    }
  } catch (error) {
    console.error('Error getting pilot session:', error)
    return null
  }
}

/**
 * Clear pilot session
 */
export async function clearPilotSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Validate session from request (for middleware use)
 */
export function validateSessionFromCookie(cookieValue: string | undefined): PilotSession | null {
  if (!cookieValue) {
    return null
  }

  try {
    const sessionData = JSON.parse(cookieValue)

    // Check if session is expired
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
    return null
  }
}
