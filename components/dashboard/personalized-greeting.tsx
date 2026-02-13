/**
 * Personalized Greeting Component
 * Developer: Maurice Rondeau
 *
 * Server component that fetches user data, paired with a client component
 * that computes the time-of-day greeting using the browser's local time.
 *
 * Data flow: Supabase Auth / Admin Session → user-service → ClientGreeting
 * Part of the Video Buddy-inspired dashboard redesign (Phase 1).
 */

import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/services/admin-auth-service'
import { getUserById } from '@/lib/services/user-service'
import { ClientGreeting } from '@/components/dashboard/client-greeting'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

interface GreetingData {
  displayName: string
  role: string
  initials: string
}

async function getGreetingData(): Promise<GreetingData> {
  const fallback: GreetingData = {
    displayName: '',
    role: 'Admin',
    initials: 'A',
  }

  try {
    // Try Supabase Auth first
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const profile = await getUserById(user.id)
      if (profile) {
        const displayName = profile.name || user.email?.split('@')[0] || ''
        return {
          displayName,
          role: profile.role || 'Admin',
          initials: displayName ? getInitials(displayName) : 'A',
        }
      }
      // User exists in Supabase but not in an_users — use email
      const emailName = user.email?.split('@')[0] || ''
      return {
        displayName: emailName,
        role: 'Admin',
        initials: emailName ? getInitials(emailName) : 'A',
      }
    }

    // Fall back to admin session
    const adminSession = await validateAdminSession()
    if (adminSession.isValid && adminSession.user) {
      const displayName = adminSession.user.name || adminSession.user.email?.split('@')[0] || ''
      return {
        displayName,
        role: adminSession.user.role || 'Admin',
        initials: displayName ? getInitials(displayName) : 'A',
      }
    }
  } catch {
    // Fail silently — greeting is non-critical
  }

  return fallback
}

export async function PersonalizedGreeting() {
  const { displayName, role, initials } = await getGreetingData()

  return <ClientGreeting displayName={displayName} role={role} initials={initials} />
}
