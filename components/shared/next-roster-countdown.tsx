/**
 * Next Roster Countdown
 *
 * Developer: Maurice Rondeau
 *
 * Live ticking countdown to the start of the next 28-day roster period.
 * Shared by the admin dashboard (CompactRosterDisplay) and the pilot
 * portal dashboard (RosterPeriodCard).
 *
 * The countdown math lives in `getNextRosterCountdown()` — this component
 * only renders it and re-ticks every second.
 *
 * SSR note: the value is time-dependent, so it is computed in an effect
 * (not at render) to avoid a server/client hydration mismatch. A skeleton
 * is shown for the first paint until the client mounts.
 */

'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { getNextRosterCountdown, type RosterCountdown } from '@/lib/utils/roster-utils'

/** Zero-pad hours/minutes/seconds to two digits ("9" -> "09"). */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

interface NextRosterCountdownProps {
  /** Optional wrapper classes for spacing within the host card. */
  className?: string
}

export function NextRosterCountdown({ className }: NextRosterCountdownProps) {
  // Start empty: the value depends on `Date.now()`, so computing it during
  // render would differ between server and client. Populate in the effect.
  const [countdown, setCountdown] = useState<RosterCountdown | null>(null)

  useEffect(() => {
    const tick = () => setCountdown(getNextRosterCountdown())
    tick() // paint immediately on mount
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={className}>
      <div className="mb-1 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-[var(--color-info)]" />
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Starts in
        </span>
      </div>
      {countdown ? (
        <p className="font-mono text-2xl font-black tracking-tight text-[var(--color-info)]">
          {countdown.days}d {pad(countdown.hours)}h {pad(countdown.minutes)}m{' '}
          {pad(countdown.seconds)}s
        </p>
      ) : (
        // First-paint skeleton — keeps layout height stable before mount.
        <div className="bg-muted h-8 w-44 animate-pulse rounded" />
      )}
    </div>
  )
}
