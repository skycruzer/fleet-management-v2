/**
 * Client Greeting Component
 * Developer: Maurice Rondeau
 *
 * Client component that computes the time-of-day greeting using the
 * browser's local time, avoiding the server UTC mismatch issue.
 */

'use client'

import { useState, useEffect } from 'react'
import { User as UserIcon } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface ClientGreetingProps {
  displayName: string
  role: string
  initials: string
}

export function ClientGreeting({ displayName, role, initials }: ClientGreetingProps) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

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
