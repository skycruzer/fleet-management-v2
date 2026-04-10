// Maurice Rondeau — Interactive Roster Grid
'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { RankFilter } from './roster-toolbar'
import type { RosterAssignmentRow, ActivityCodeInfo } from './types'
import { isToday, getDateLabel, getDayOfWeek, isWeekend } from './roster-date-utils'

interface RosterGridProps {
  assignments: RosterAssignmentRow[]
  activityCodeMap: Map<string, ActivityCodeInfo>
  periodStartDate: string
  searchQuery: string
  activityFilter: string[]
  rankFilter: RankFilter
  compact?: boolean
}

// Map Tailwind class names to CSS colors
const COLOR_MAP: Record<string, { bg: string; bgDark: string; text: string }> = {
  'bg-blue-100': { bg: '#dbeafe', bgDark: '#1e3a5f', text: '#1e40af' },
  'bg-gray-100': { bg: '#f3f4f6', bgDark: '#374151', text: '#4b5563' },
  'bg-green-100': { bg: '#dcfce7', bgDark: '#14532d', text: '#166534' },
  'bg-amber-100': { bg: '#fef3c7', bgDark: '#78350f', text: '#92400e' },
  'bg-purple-100': { bg: '#f3e8ff', bgDark: '#3b0764', text: '#6b21a8' },
  'bg-slate-200': { bg: '#e2e8f0', bgDark: '#334155', text: '#475569' },
  'bg-teal-100': { bg: '#ccfbf1', bgDark: '#134e4a', text: '#0f766e' },
  'bg-indigo-100': { bg: '#e0e7ff', bgDark: '#312e81', text: '#4338ca' },
  'bg-red-100': { bg: '#fee2e2', bgDark: '#7f1d1d', text: '#dc2626' },
  'bg-yellow-100': { bg: '#fef9c3', bgDark: '#713f12', text: '#a16207' },
}

const DEFAULT_COLOR = { bg: '#fef9c3', bgDark: '#713f12', text: '#a16207' }

interface PilotRow {
  key: string
  pilotId: string | null
  lastName: string
  firstName: string
  rank: string
  days: Map<number, string> // day_number -> activity_code
}

interface CrewPairingInfo {
  day: number
  code: string
  codeName: string
  category: string
  dateLabel: string
  captains: { name: string; pilotId: string | null }[]
  firstOfficers: { name: string; pilotId: string | null }[]
}

export function RosterGrid({
  assignments,
  activityCodeMap,
  periodStartDate,
  searchQuery,
  activityFilter,
  rankFilter,
  compact,
}: RosterGridProps) {
  const [crewPairing, setCrewPairing] = useState<CrewPairingInfo | null>(null)

  // Build pilot rows from flat assignments
  const { captains, firstOfficers } = useMemo(() => {
    const pilotMap = new Map<string, PilotRow>()

    for (const a of assignments) {
      const key = `${a.rank}_${a.pilot_last_name}_${a.pilot_first_name}`
      if (!pilotMap.has(key)) {
        pilotMap.set(key, {
          key,
          pilotId: a.pilot_id,
          lastName: a.pilot_last_name,
          firstName: a.pilot_first_name,
          rank: a.rank,
          days: new Map(),
        })
      }
      pilotMap.get(key)!.days.set(a.day_number, a.activity_code)
    }

    const allPilots = Array.from(pilotMap.values())
    return {
      captains: allPilots.filter((p) => p.rank === 'CAPTAIN'),
      firstOfficers: allPilots.filter((p) => p.rank === 'FIRST_OFFICER'),
    }
  }, [assignments])

  // Apply filters (memoized to avoid re-filtering on every render)
  const { filteredCaptains, filteredFOs } = useMemo(() => {
    const filterPilots = (pilots: PilotRow[]) => {
      let filtered = pilots

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (p) => p.lastName.toLowerCase().includes(q) || p.firstName.toLowerCase().includes(q)
        )
      }

      if (activityFilter.length > 0) {
        filtered = filtered.filter((p) => {
          for (const [, code] of p.days) {
            if (activityFilter.includes(code)) return true
          }
          return false
        })
      }

      return filtered
    }

    return {
      filteredCaptains: rankFilter !== 'FIRST_OFFICER' ? filterPilots(captains) : [],
      filteredFOs: rankFilter !== 'CAPTAIN' ? filterPilots(firstOfficers) : [],
    }
  }, [captains, firstOfficers, searchQuery, activityFilter, rankFilter])

  const days = Array.from({ length: 28 }, (_, i) => i + 1)

  // Handle cell click — show crew pairing
  const handleCellClick = useCallback(
    (day: number, code: string) => {
      const codeInfo = activityCodeMap.get(code)
      const dayAssignments = assignments.filter(
        (a) => a.day_number === day && a.activity_code === code
      )

      const captainList = dayAssignments
        .filter((a) => a.rank === 'CAPTAIN')
        .map((a) => ({
          name: `${a.pilot_last_name} ${a.pilot_first_name.charAt(0)}.`,
          pilotId: a.pilot_id,
        }))
      const foList = dayAssignments
        .filter((a) => a.rank === 'FIRST_OFFICER')
        .map((a) => ({
          name: `${a.pilot_last_name} ${a.pilot_first_name.charAt(0)}.`,
          pilotId: a.pilot_id,
        }))

      setCrewPairing({
        day,
        code,
        codeName: codeInfo?.name || code,
        category: codeInfo?.category || 'Unknown',
        dateLabel: getDateLabel(periodStartDate, day),
        captains: captainList,
        firstOfficers: foList,
      })
    },
    [assignments, activityCodeMap, periodStartDate]
  )

  return (
    <>
      <div className="bg-card overflow-x-auto rounded-lg border">
        <table
          className={cn(
            'border-collapse text-xs',
            compact ? 'w-full table-fixed' : 'w-max min-w-full'
          )}
        >
          {/* Column headers */}
          <thead>
            <tr className="bg-muted/50 border-b">
              <th
                className={cn(
                  'bg-muted/50 sticky left-0 z-20 px-2 py-1.5 text-left font-medium',
                  !compact && 'min-w-[140px]'
                )}
              >
                Pilot
              </th>
              {days.map((d) => {
                const today = isToday(periodStartDate, d)
                const weekend = isWeekend(periodStartDate, d)
                const isWeekBoundary = d > 1 && d % 7 === 1

                return (
                  <th
                    key={d}
                    className={cn(
                      'px-0.5 py-1.5 text-center font-normal',
                      !compact && 'min-w-[52px]',
                      today && 'bg-blue-500/10 dark:bg-blue-500/20',
                      weekend && !today && 'bg-muted/30',
                      isWeekBoundary && 'border-l-border border-l-2'
                    )}
                  >
                    <div className="text-muted-foreground text-[10px]">
                      {getDayOfWeek(periodStartDate, d)}
                    </div>
                    <div className={cn('font-medium', today && 'text-blue-600 dark:text-blue-400')}>
                      {getDateLabel(periodStartDate, d)}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {/* Captains section */}
            {filteredCaptains.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={29}
                    className="bg-card text-muted-foreground sticky left-0 px-2 py-1.5 text-xs font-semibold tracking-wider uppercase"
                  >
                    Captains ({filteredCaptains.length})
                  </td>
                </tr>
                {filteredCaptains.map((pilot) => (
                  <PilotRowComponent
                    key={pilot.key}
                    pilot={pilot}
                    days={days}
                    activityCodeMap={activityCodeMap}
                    periodStartDate={periodStartDate}
                    activityFilter={activityFilter}
                    onCellClick={handleCellClick}
                    compact={compact}
                  />
                ))}
              </>
            )}

            {/* First Officers section */}
            {filteredFOs.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={29}
                    className="bg-card text-muted-foreground sticky left-0 border-t-2 px-2 py-1.5 text-xs font-semibold tracking-wider uppercase"
                  >
                    First Officers ({filteredFOs.length})
                  </td>
                </tr>
                {filteredFOs.map((pilot) => (
                  <PilotRowComponent
                    key={pilot.key}
                    pilot={pilot}
                    days={days}
                    activityCodeMap={activityCodeMap}
                    periodStartDate={periodStartDate}
                    activityFilter={activityFilter}
                    onCellClick={handleCellClick}
                    compact={compact}
                  />
                ))}
              </>
            )}

            {filteredCaptains.length === 0 && filteredFOs.length === 0 && (
              <tr>
                <td colSpan={29} className="text-muted-foreground px-4 py-8 text-center">
                  No pilots match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Crew Pairing Dialog */}
      <Dialog open={!!crewPairing} onOpenChange={(open) => !open && setCrewPairing(null)}>
        <DialogContent className="sm:max-w-sm">
          {crewPairing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="text-muted-foreground h-5 w-5" />
                  <span className="font-mono">{crewPairing.code}</span>
                  <span className="text-muted-foreground">—</span>
                  <span>{crewPairing.dateLabel}</span>
                </DialogTitle>
                <p className="text-muted-foreground text-sm">
                  {crewPairing.codeName} ({crewPairing.category.replaceAll('_', ' ')})
                </p>
              </DialogHeader>

              <div className="space-y-4">
                {crewPairing.captains.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
                      Captains ({crewPairing.captains.length})
                    </p>
                    <div className="space-y-1">
                      {crewPairing.captains.map((p, i) => (
                        <div
                          key={p.pilotId ?? `${p.name}-${i}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
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
                  </div>
                )}

                {crewPairing.firstOfficers.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
                      First Officers ({crewPairing.firstOfficers.length})
                    </p>
                    <div className="space-y-1">
                      {crewPairing.firstOfficers.map((p, i) => (
                        <div
                          key={p.pilotId ?? `${p.name}-${i}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
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
                  </div>
                )}

                <p className="text-muted-foreground text-xs">
                  Total crew: {crewPairing.captains.length + crewPairing.firstOfficers.length}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Pilot Row ──────────────────────────────────────────────────

function PilotRowComponent({
  pilot,
  days,
  activityCodeMap,
  periodStartDate,
  activityFilter,
  onCellClick,
  compact,
}: {
  pilot: PilotRow
  days: number[]
  activityCodeMap: Map<string, ActivityCodeInfo>
  periodStartDate: string
  activityFilter: string[]
  onCellClick: (day: number, code: string) => void
  compact?: boolean
}) {
  return (
    <tr className="border-border/50 hover:bg-muted/30 border-b">
      {/* Sticky pilot name column */}
      <td
        className={cn(
          'bg-card hover:bg-muted/30 sticky left-0 z-10 py-1 font-medium',
          compact ? 'truncate px-1' : 'px-2'
        )}
      >
        {pilot.pilotId ? (
          <Link
            href={`/dashboard/pilots?id=${pilot.pilotId}`}
            className="text-foreground hover:text-blue-600 hover:underline dark:hover:text-blue-400"
          >
            {pilot.lastName} {pilot.firstName.charAt(0)}.
          </Link>
        ) : (
          <span className="text-foreground">
            {pilot.lastName} {pilot.firstName.charAt(0)}.
          </span>
        )}
      </td>

      {/* Activity cells for each day */}
      {days.map((d) => {
        const code = pilot.days.get(d)
        const today = isToday(periodStartDate, d)
        const weekend = isWeekend(periodStartDate, d)
        const isWeekBoundary = d > 1 && d % 7 === 1
        const codeInfo = code ? activityCodeMap.get(code) : null
        const colors = codeInfo ? COLOR_MAP[codeInfo.color] || DEFAULT_COLOR : null
        const isHighlighted = activityFilter.length > 0 && code && activityFilter.includes(code)

        return (
          <td
            key={d}
            className={cn(
              'px-0.5 py-1 text-center',
              today && 'bg-blue-500/10 dark:bg-blue-500/20',
              weekend && !today && 'bg-muted/20',
              isWeekBoundary && 'border-l-border border-l-2',
              activityFilter.length > 0 && !isHighlighted && code && 'opacity-30'
            )}
          >
            {code ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-block w-full rounded px-0.5 py-0.5 font-mono text-[10px] leading-tight',
                      'hover:ring-primary/40 cursor-pointer transition-shadow hover:ring-2',
                      isHighlighted && 'ring-1 ring-blue-500'
                    )}
                    style={colors ? { backgroundColor: colors.bg, color: colors.text } : undefined}
                    onClick={() => onCellClick(d, code)}
                  >
                    {code.length > 7 ? code.slice(0, 6) + '..' : code}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{codeInfo?.name || code}</p>
                  <p className="text-muted-foreground">
                    {getDateLabel(periodStartDate, d)} — Click to see crew
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground/30">—</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}
