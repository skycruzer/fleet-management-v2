'use client'

/**
 * Roster Period Refresher
 *
 * Invisible client component that triggers a page refresh when the
 * current roster period ends. This ensures the server-rendered
 * CompactRosterDisplay re-renders with the new period data.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RosterPeriodRefresherProps {
  periodEndDate: string // ISO string of current period's end date
}

export function RosterPeriodRefresher({ periodEndDate }: RosterPeriodRefresherProps) {
  const router = useRouter()

  useEffect(() => {
    const endDate = new Date(periodEndDate)
    // Period ends at end of day, so next period starts at midnight the next day
    const nextPeriodStart = new Date(endDate)
    nextPeriodStart.setDate(nextPeriodStart.getDate() + 1)
    nextPeriodStart.setHours(0, 0, 0, 0)

    const msUntilTransition = nextPeriodStart.getTime() - Date.now()

    // Only set timer if transition is within 25 hours (avoid huge timeouts)
    if (msUntilTransition <= 0) {
      // Period already ended, refresh immediately
      router.refresh()
      return
    }

    if (msUntilTransition > 25 * 60 * 60 * 1000) {
      // More than 25 hours away — no need for a timer yet.
      // The page will naturally re-render on next visit.
      return
    }

    const timer = setTimeout(() => {
      router.refresh()
    }, msUntilTransition)

    return () => clearTimeout(timer)
  }, [periodEndDate, router])

  return null
}
