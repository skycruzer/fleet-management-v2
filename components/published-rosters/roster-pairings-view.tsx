// Maurice Rondeau — Roster Pairings View
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RosterAssignmentRow, ActivityCodeInfo } from './types'
import { isToday, getDateLabelWithWeekday } from './roster-date-utils'

interface RosterPairingsViewProps {
  assignments: RosterAssignmentRow[]
  activityCodeMap: Map<string, ActivityCodeInfo>
  periodStartDate: string
  searchQuery: string
  activityFilter: string[]
}

interface CrewGroup {
  code: string
  codeName: string
  category: string
  captains: { name: string; pilotId: string | null }[]
  firstOfficers: { name: string; pilotId: string | null }[]
}

export function RosterPairingsView({
  assignments,
  activityCodeMap,
  periodStartDate,
  searchQuery,
  activityFilter,
}: RosterPairingsViewProps) {
  // Find today's day number, default to day 1
  const todayDay = useMemo(() => {
    for (let d = 1; d <= 28; d++) {
      if (isToday(periodStartDate, d)) return d
    }
    return 1
  }, [periodStartDate])

  const [selectedDay, setSelectedDay] = useState(todayDay)

  // Build crew groups for the selected day
  const crewGroups = useMemo(() => {
    let dayAssignments = assignments.filter((a) => a.day_number === selectedDay)

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      dayAssignments = dayAssignments.filter(
        (a) =>
          a.pilot_last_name.toLowerCase().includes(q) ||
          a.pilot_first_name.toLowerCase().includes(q)
      )
    }

    // Apply activity filter
    if (activityFilter.length > 0) {
      dayAssignments = dayAssignments.filter((a) => activityFilter.includes(a.activity_code))
    }

    // Group by activity code
    const groupMap = new Map<string, CrewGroup>()
    for (const a of dayAssignments) {
      if (!groupMap.has(a.activity_code)) {
        const codeInfo = activityCodeMap.get(a.activity_code)
        groupMap.set(a.activity_code, {
          code: a.activity_code,
          codeName: codeInfo?.name || a.activity_code,
          category: codeInfo?.category || 'OTHER',
          captains: [],
          firstOfficers: [],
        })
      }
      const group = groupMap.get(a.activity_code)!
      const pilot = {
        name: `${a.pilot_last_name} ${a.pilot_first_name.charAt(0)}.`,
        pilotId: a.pilot_id,
      }
      if (a.rank === 'CAPTAIN') {
        group.captains.push(pilot)
      } else {
        group.firstOfficers.push(pilot)
      }
    }

    // Sort: flight codes first, then by total crew size desc
    return Array.from(groupMap.values()).sort((a, b) => {
      const aFlight = a.category === 'FLIGHT' ? 0 : 1
      const bFlight = b.category === 'FLIGHT' ? 0 : 1
      if (aFlight !== bFlight) return aFlight - bFlight
      const aTotal = a.captains.length + a.firstOfficers.length
      const bTotal = b.captains.length + b.firstOfficers.length
      return bTotal - aTotal
    })
  }, [assignments, selectedDay, searchQuery, activityFilter, activityCodeMap])

  const days = Array.from({ length: 28 }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex flex-wrap gap-1">
        {days.map((d) => {
          const today = isToday(periodStartDate, d)
          const isWeekBoundary = d > 1 && d % 7 === 1
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={cn(
                'flex h-10 w-10 flex-col items-center justify-center rounded-lg border text-xs transition-colors',
                isWeekBoundary && 'ml-2',
                selectedDay === d
                  ? 'border-primary bg-primary text-primary-foreground'
                  : today
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400'
                    : 'border-border hover:bg-muted'
              )}
            >
              <span className="text-[9px] leading-none opacity-70">
                {getDateLabelWithWeekday(periodStartDate, d).split(' ')[0]}
              </span>
              <span className="leading-tight font-medium">{d}</span>
            </button>
          )
        })}
      </div>

      {/* Day header */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">
          Day {selectedDay} — {getDateLabelWithWeekday(periodStartDate, selectedDay)}
        </h3>
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs">
          {crewGroups.length} activities
        </span>
      </div>

      {/* Crew groups */}
      {crewGroups.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
          No assignments match the current filters for this day.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crewGroups.map((group) => (
            <div key={group.code} className="bg-card rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{group.code}</span>
                  <span className="text-muted-foreground text-xs">{group.codeName}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  {group.captains.length + group.firstOfficers.length}
                </div>
              </div>

              <div className="space-y-2">
                {group.captains.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-wider uppercase">
                      CPT
                    </p>
                    {group.captains.map((p, i) => (
                      <div
                        key={p.pilotId ?? `${p.name}-${i}`}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {p.pilotId ? (
                          <Link
                            href={`/dashboard/pilots?id=${p.pilotId}`}
                            className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                          >
                            {p.name}
                          </Link>
                        ) : (
                          <span>{p.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {group.firstOfficers.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-wider uppercase">
                      F/O
                    </p>
                    {group.firstOfficers.map((p, i) => (
                      <div
                        key={p.pilotId ?? `${p.name}-${i}`}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {p.pilotId ? (
                          <Link
                            href={`/dashboard/pilots?id=${p.pilotId}`}
                            className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                          >
                            {p.name}
                          </Link>
                        ) : (
                          <span>{p.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
