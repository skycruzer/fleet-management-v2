/**
 * Personalized Greeting Component
 * Developer: Maurice Rondeau
 *
 * Server component that displays a personalized time-of-day greeting
 * with the admin user's name, role badge, and avatar/initials.
 * Falls back gracefully when profile data is unavailable.
 *
 * Data flow: Supabase Auth / Admin Session → user-service → render
 * Part of the Video Buddy-inspired dashboard redesign (Phase 1).
 */

import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/services/admin-auth-service'
import { getUserById } from '@/lib/services/user-service'
import { User as UserIcon } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

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
  const greeting = getGreeting()
  const { displayName, role, initials } = await getGreetingData()

  return (
    <div className="flex items-center gap-4">
      {/* Avatar / Initials */}
      <div
        role="img"
        aria-label={`User avatar${initials ? `, initials ${initials}` : ''}`}
        className="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
      >
        {initials ? (
          <span className="text-primary text-lg font-semibold">{initials}</span>
        ) : (
          <UserIcon className="text-primary h-6 w-6" aria-hidden="true" />
        )}
      </div>

      {/* Greeting Text */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          {greeting}
          {displayName ? `, ${displayName}` : ''}
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {role}
          {' \u00B7 '}
          Here&apos;s your fleet overview
        </p>
      </div>
    </div>
  )
}
