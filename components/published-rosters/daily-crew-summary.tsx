// Maurice Rondeau — Daily Crew Summary
'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { RosterAssignmentRow } from './types'
import { isToday } from './roster-date-utils'

interface DailyCrewSummaryProps {
  assignments: Pick<RosterAssignmentRow, 'rank' | 'day_number' | 'activity_code'>[]
  periodStartDate: string
  compact?: boolean
}

// Codes that mean a pilot is NOT available (day off, leave, medical)
const OFF_CODES = new Set(['DO', 'RDO', 'SDO', 'A_L', 'LSL', 'DO_MEDF', 'DO_MEDI', 'DO_MEDX'])

export function DailyCrewSummary({ assignments, periodStartDate, compact }: DailyCrewSummaryProps) {
  const properSummary = useMemo(() => {
    const days = Array.from({ length: 28 }, (_, i) => i + 1)

    return days.map((d) => {
      const dayAssignments = assignments.filter((a) => a.day_number === d)
      const captains = dayAssignments.filter((a) => a.rank === 'CAPTAIN')
      const fos = dayAssignments.filter((a) => a.rank === 'FIRST_OFFICER')
      const captainOnDuty = captains.filter((a) => !OFF_CODES.has(a.activity_code)).length
      const foOnDuty = fos.filter((a) => !OFF_CODES.has(a.activity_code)).length

      return {
        day: d,
        captainOnDuty,
        captainTotal: captains.length,
        foOnDuty,
        foTotal: fos.length,
      }
    })
  }, [assignments])

  return (
    <div className="bg-card overflow-x-auto rounded-lg border">
      <table
        className={cn(
          'border-collapse text-xs',
          compact ? 'w-full table-fixed' : 'w-max min-w-full'
        )}
      >
        <tbody>
          <tr className="border-b">
            <td
              className={cn(
                'bg-card text-muted-foreground sticky left-0 z-10 px-2 py-1.5 font-medium',
                !compact && 'min-w-[140px]'
              )}
            >
              CPT on duty
            </td>
            {properSummary.map((s) => {
              const today = isToday(periodStartDate, s.day)
              const isWeekBoundary = s.day > 1 && s.day % 7 === 1

              return (
                <td
                  key={s.day}
                  className={cn(
                    'px-0.5 py-1.5 text-center font-mono',
                    !compact && 'min-w-[52px]',
                    today && 'bg-blue-500/10',
                    isWeekBoundary && 'border-l-border border-l-2',
                    s.captainOnDuty < 10 && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {s.captainOnDuty}/{s.captainTotal}
                </td>
              )
            })}
          </tr>
          <tr>
            <td
              className={cn(
                'bg-card text-muted-foreground sticky left-0 z-10 px-2 py-1.5 font-medium',
                !compact && 'min-w-[140px]'
              )}
            >
              F/O on duty
            </td>
            {properSummary.map((s) => {
              const today = isToday(periodStartDate, s.day)
              const isWeekBoundary = s.day > 1 && s.day % 7 === 1

              return (
                <td
                  key={s.day}
                  className={cn(
                    'px-0.5 py-1.5 text-center font-mono',
                    !compact && 'min-w-[52px]',
                    today && 'bg-blue-500/10',
                    isWeekBoundary && 'border-l-border border-l-2',
                    s.foOnDuty < 10 && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {s.foOnDuty}/{s.foTotal}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
