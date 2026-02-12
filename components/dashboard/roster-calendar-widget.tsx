/**
 * Roster Calendar Widget
 * Developer: Maurice Rondeau
 *
 * Mini monthly calendar for the dashboard showing the current month
 * with roster period dates highlighted. Displays current RP code
 * and days remaining.
 * Part of the Video Buddy-inspired dashboard redesign (Phase 2).
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { getCurrentRosterPeriodObject } from '@/lib/utils/roster-utils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month, 1)
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

function getCalendarGrid(year: number, month: number): Array<Date | null> {
  const days = getDaysInMonth(year, month)
  const firstDay = days[0].getDay()
  // Convert Sunday=0 to Monday-based: Mon=0, Tue=1, ..., Sun=6
  const startPad = firstDay === 0 ? 6 : firstDay - 1

  const grid: Array<Date | null> = []
  // Pad start
  for (let i = 0; i < startPad; i++) grid.push(null)
  // Add days
  for (const day of days) grid.push(day)
  // Pad end to fill last row
  while (grid.length % 7 !== 0) grid.push(null)

  return grid
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const d = date.getTime()
  return d >= start.getTime() && d <= end.getTime()
}

export function RosterCalendarWidget() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = new Date(year, month, now.getDate())

  const currentRP = getCurrentRosterPeriodObject()
  const rpStart = currentRP.startDate
  const rpEnd = currentRP.endDate
  const daysRemaining = Math.max(
    0,
    Math.ceil((rpEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )

  const grid = getCalendarGrid(year, month)
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <Card className="h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Roster Calendar
        </h3>
        <Calendar className="text-muted-foreground/50 h-4 w-4" aria-hidden="true" />
      </div>

      <p className="text-foreground mb-3 text-sm font-semibold">{monthName}</p>

      {/* Day labels */}
      <div role="row" className="mb-1 grid grid-cols-7 gap-0.5">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="text-muted-foreground py-1 text-center text-[10px] font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        role="grid"
        aria-label={`${monthName} calendar with ${currentRP.code} roster period highlighted`}
        className="grid grid-cols-7 gap-0.5"
      >
        {grid.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} role="gridcell" className="aspect-square" />
          }

          const isToday = isSameDay(date, today)
          const isInRP = isWithinRange(date, rpStart, rpEnd)
          const label = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })}${isToday ? ', today' : ''}${isInRP ? `, ${currentRP.code}` : ''}`

          return (
            <div
              key={date.toISOString()}
              role="gridcell"
              aria-label={label}
              aria-current={isToday ? 'date' : undefined}
              className={`flex aspect-square items-center justify-center text-xs ${
                isToday
                  ? 'bg-primary text-primary-foreground rounded-full font-bold'
                  : isInRP
                    ? 'bg-primary/10 text-primary rounded font-semibold'
                    : 'text-muted-foreground'
              }`}
            >
              {date.getDate()}
            </div>
          )
        })}
      </div>

      {/* RP info */}
      <div className="border-border mt-3 border-t pt-3">
        <p className="text-muted-foreground text-xs">
          {currentRP.code} · {daysRemaining} days remaining
        </p>
        <Link
          href="/dashboard/renewal-planning"
          className="text-primary mt-1 inline-block text-xs hover:underline"
        >
          View full calendar →
        </Link>
      </div>
    </Card>
  )
}
