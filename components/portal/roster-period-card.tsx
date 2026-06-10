/**
 * Roster Period Card Component
 *
 * Developer: Maurice Rondeau
 *
 * Displays current and next roster periods for pilot dashboard
 * Features:
 * - Current period with live countdown
 * - Next period with dates
 * - Responsive design
 * - Aviation-themed styling
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CalendarDays } from 'lucide-react'
import {
  getCurrentRosterPeriodObject,
  getNextRosterPeriodObject,
  type RosterPeriod,
} from '@/lib/utils/roster-utils'
import { NextRosterCountdown } from '@/components/shared/next-roster-countdown'

export function RosterPeriodCard() {
  // Initialize periods using lazy initialization
  const [currentPeriod, setCurrentPeriod] = useState<RosterPeriod | null>(() =>
    getCurrentRosterPeriodObject()
  )
  const [nextPeriod, setNextPeriod] = useState<RosterPeriod | null>(() => {
    const current = getCurrentRosterPeriodObject()
    return getNextRosterPeriodObject(current)
  })
  const [daysRemaining, setDaysRemaining] = useState(
    () => getCurrentRosterPeriodObject().daysRemaining
  )

  // Update countdown every hour
  useEffect(() => {
    const interval = setInterval(
      () => {
        const updated = getCurrentRosterPeriodObject()
        setDaysRemaining(updated.daysRemaining)

        // If period changed, update everything
        if (updated.code !== currentPeriod?.code) {
          setCurrentPeriod(updated)
          setNextPeriod(getNextRosterPeriodObject(updated))
        }
      },
      60 * 60 * 1000
    ) // Update every hour

    return () => clearInterval(interval)
  }, [currentPeriod?.code])

  if (!currentPeriod || !nextPeriod) {
    return null
  }

  return (
    <Card className="bg-card overflow-hidden border-2 border-[var(--color-info-border)]">
      {/* Header — primary-foreground so dark mode (white primary) stays legible */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-primary-foreground h-6 w-6" />
          <div>
            <h3 className="text-primary-foreground text-lg font-bold">Roster Period</h3>
            <p className="text-primary-foreground/70 text-xs">28-day operational cycle</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        {/* Current Period */}
        <div className="rounded-lg bg-[var(--color-info-bg)] p-5">
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground mb-3">
            ACTIVE PERIOD
          </Badge>
          <h4 className="text-foreground mb-2 text-3xl font-black">{currentPeriod.code}</h4>
          <p className="text-muted-foreground mb-4 text-sm">
            {new Date(currentPeriod.startDate).toLocaleDateString('en-AU', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {new Date(currentPeriod.endDate).toLocaleDateString('en-AU', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {/* Countdown */}
          <div className="flex items-baseline gap-2">
            <Clock className="h-5 w-5 text-[var(--color-info)]" />
            <span className="text-primary text-4xl font-black">{daysRemaining}</span>
            <span className="text-muted-foreground text-sm font-medium">
              {daysRemaining === 1 ? 'day' : 'days'} remaining
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{
                  width: `${((28 - daysRemaining) / 28) * 100}%`,
                }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {28 - daysRemaining} of 28 days completed
            </p>
          </div>
        </div>

        {/* Next Period */}
        <div className="rounded-lg border-2 border-dashed border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-5">
          <Badge variant="info" className="mb-3">
            NEXT UP
          </Badge>
          <h4 className="text-foreground mb-2 text-3xl font-black">{nextPeriod.code}</h4>
          <p className="text-muted-foreground mb-4 text-sm">
            {new Date(nextPeriod.startDate).toLocaleDateString('en-AU', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {new Date(nextPeriod.endDate).toLocaleDateString('en-AU', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {/* Live countdown to next roster start */}
          <NextRosterCountdown className="rounded-md border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2" />
        </div>
      </div>
    </Card>
  )
}
