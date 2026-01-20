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
    <Card className="border-primary-200 dark:border-primary-800 from-card to-muted/30 overflow-hidden border-2 bg-gradient-to-br">
      {/* Header */}
      <div className="from-primary-600 to-primary-700 bg-gradient-to-r px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-white" />
          <div>
            <h3 className="text-lg font-bold text-white">Roster Period</h3>
            <p className="text-xs text-white/70">28-day operational cycle</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        {/* Current Period */}
        <div className="bg-primary-50 dark:bg-primary-950/30 rounded-lg p-5">
          <Badge className="bg-primary-600 hover:bg-primary-700 mb-3 text-white">
            ACTIVE PERIOD
          </Badge>
          <h4 className="text-primary-900 dark:text-primary-100 mb-2 text-3xl font-black">
            {currentPeriod.code}
          </h4>
          <p className="text-muted-foreground mb-4 text-sm">
            {new Date(currentPeriod.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {new Date(currentPeriod.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {/* Countdown */}
          <div className="flex items-baseline gap-2">
            <Clock className="text-primary-600 h-5 w-5" />
            <span className="text-primary-600 dark:text-primary-400 text-4xl font-black">
              {daysRemaining}
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              {daysRemaining === 1 ? 'day' : 'days'} remaining
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="from-primary-500 to-primary-600 h-full bg-gradient-to-r transition-all duration-500"
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
          <Badge className="mb-3 bg-[var(--color-info)] text-white hover:bg-[var(--color-info)]">
            NEXT UP
          </Badge>
          <h4 className="text-foreground mb-2 text-3xl font-black">{nextPeriod.code}</h4>
          <p className="text-muted-foreground mb-4 text-sm">
            {new Date(nextPeriod.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {new Date(nextPeriod.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          <div className="rounded-md border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2">
            <p className="text-xs font-medium text-[var(--color-info)]">
              Starts in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
