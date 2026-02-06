/**
 * Pilot Authentication Helper Functions
 *
 * These helpers extract and verify pilot information from Supabase Auth sessions.
 * All pilots now authenticate via Supabase Auth (unified authentication).
 */

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { validateRedisSession } from '@/lib/services/redis-session-service'

/**
 * Pilot user type returned by helper functions
 */
export interface PilotUser {
  id: string
  auth_user_id: string
  pilot_id?: string | null
  email: string
  first_name: string
  last_name: string
  rank: string
  employee_id: string | null
  registration_approved: boolean | null
  last_login_at: string | null
  middle_name?: string | null
  // Contact fields from pilot_users table
  phone_number?: string | null
  address?: string | null
  // Additional profile fields from pilot_users table
  date_of_birth?: string | null
  seniority_number?: number | null
}

/**
 * Get current authenticated pilot (for Server Components)
 *
 * @returns Pilot user object or null if not authenticated/not a pilot
 *
 * @example
 * ```typescript
 * // In a Server Component
 * import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
 *
 * export default async function PilotDashboard() {
 *   const pilot = await getCurrentPilot()
 *
 *   if (!pilot) {
 *     redirect('/portal/login')
 *   }
 *
 *   return <div>Welcome, {pilot.first_name}!</div>
 * }
 * ```
 */
export async function getCurrentPilot(): Promise<PilotUser | null> {
  try {
    const supabase = await createClient()

    // First, check for custom pilot session cookie via Redis
    const cookieStore = await cookies()
    const pilotSessionCookie = cookieStore.get('pilot-session')

    if (pilotSessionCookie?.value) {
      try {
        // Validate via Redis (with DB fallback)
        const sessionResult = await validateRedisSession(
          'pilot-session',
          'pilot_sessions',
          'pilot_user_id'
        )

        if (sessionResult.isValid && sessionResult.data) {
          // Get pilot user from database
          const { data: pilotUser, error } = await supabase
            .from('pilot_users')
            .select('*')
            .eq('id', sessionResult.data.userId)
            .single()

          if (!error && pilotUser && pilotUser.registration_approved === true) {
            return pilotUser as PilotUser
          }
        }
      } catch (cookieError) {
        console.error('Error validating pilot session:', cookieError)
        // Fall through to Supabase Auth check
      }
    }

    // Fall back to Supabase Auth (for legacy pilots with auth_user_id)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get pilot record
    const { data: pilotUser, error } = await supabase
      .from('pilot_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (error || !pilotUser) {
      return null
    }

    // Only return approved pilots
    if (pilotUser.registration_approved !== true) {
      return null
    }

    return pilotUser as PilotUser
  } catch (error) {
    console.error('Error getting current pilot:', error)
    return null
  }
}

/**
 * Get pilot from API request (for API routes)
 *
 * @param request - Next.js API request object
 * @returns Pilot user object or null if not authenticated/not a pilot
 *
 * @example
 * ```typescript
 * // In an API route
 * import { getPilotFromRequest } from '@/lib/auth/pilot-helpers'
 *
 * export async function GET(request: NextRequest) {
 *   const pilot = await getPilotFromRequest(request)
 *
 *   if (!pilot) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *
 *   // Use pilot.id for database queries
 *   const { data } = await supabase
 *     .from('leave_requests')
 *     .select('*')
 *     .eq('pilot_id', pilot.id)
 *
 *   return NextResponse.json({ success: true, data })
 * }
 * ```
 */
export async function getPilotFromRequest(request: NextRequest): Promise<PilotUser | null> {
  try {
    // Create Supabase client for API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // API routes don't modify cookies
          },
          remove(name: string, options: CookieOptions) {
            // API routes don't remove cookies
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get pilot record
    const { data: pilotUser, error } = await supabase
      .from('pilot_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (error || !pilotUser) {
      return null
    }

    // Only return approved pilots
    if (pilotUser.registration_approved !== true) {
      return null
    }

    return pilotUser as PilotUser
  } catch (error) {
    console.error('Error getting pilot from request:', error)
    return null
  }
}

/**
 * Check if current user is an approved pilot
 *
 * @returns Boolean indicating if user is an approved pilot
 *
 * @example
 * ```typescript
 * const isPilot = await isApprovedPilot()
 *
 * if (isPilot) {
 *   // Show pilot-specific UI
 * }
 * ```
 */
export async function isApprovedPilot(): Promise<boolean> {
  const pilot = await getCurrentPilot()
  return pilot !== null
}

/**
 * Get pilot user roles
 *
 * Checks if the current user has pilot and/or admin roles
 *
 * @returns Object with isPilot, isAdmin, isManager flags
 *
 * @example
 * ```typescript
 * const roles = await getPilotUserRoles()
 *
 * if (roles.isPilot && roles.isAdmin) {
 *   // Dual-role user
 * }
 * ```
 */
export async function getPilotUserRoles(): Promise<{
  isPilot: boolean
  isAdmin: boolean
  isManager: boolean
  pilotApproved: boolean
}> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        isPilot: false,
        isAdmin: false,
        isManager: false,
        pilotApproved: false,
      }
    }

    // Check pilot role
    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('registration_approved')
      .eq('auth_user_id', user.id)
      .single()

    // Check admin role
    const { data: adminUser } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    return {
      isPilot: !!pilotUser,
      isAdmin: adminUser?.role === 'admin',
      isManager: adminUser?.role === 'manager',
      pilotApproved: pilotUser?.registration_approved === true,
    }
  } catch (error) {
    console.error('Error getting user roles:', error)
    return {
      isPilot: false,
      isAdmin: false,
      isManager: false,
      pilotApproved: false,
    }
  }
}

/**
 * Update pilot last login timestamp
 *
 * Should be called after successful pilot login
 *
 * @param pilotId - Pilot user ID
 */
export async function updatePilotLastLogin(pilotId: string): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase
      .from('pilot_users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pilotId)
  } catch (error) {
    console.error('Error updating pilot last login:', error)
    // Don't throw - this is non-critical
  }
}
