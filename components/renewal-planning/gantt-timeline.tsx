/** Developer: Maurice Rondeau */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface GanttRenewal {
  id: string
  pilot_name: string
  employee_id: string
  check_code: string
  category: string
  planned_renewal_date: string
  original_expiry_date: string
  renewal_window_start: string
  renewal_window_end: string
  roster_period: string
  pairing_status?: string
  paired_pilot_name?: string
}

interface RosterPeriod {
  code: string
  startDate: string
  endDate: string
}

export interface GanttTimelineProps {
  renewals: GanttRenewal[]
  rosterPeriods: RosterPeriod[]
  year: number
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Flight Checks': {
    bg: 'rgba(0, 123, 255, 0.2)',
    border: 'rgb(0, 123, 255)',
    text: 'rgb(0, 123, 255)',
  },
  'Simulator Checks': {
    bg: 'rgba(111, 66, 193, 0.2)',
    border: 'rgb(111, 66, 193)',
    text: 'rgb(111, 66, 193)',
  },
  'Ground Courses Refresher': {
    bg: 'rgba(40, 167, 69, 0.2)',
    border: 'rgb(40, 167, 69)',
    text: 'rgb(40, 167, 69)',
  },
  'Pilot Medical': {
    bg: 'rgba(255, 159, 64, 0.2)',
    border: 'rgb(255, 159, 64)',
    text: 'rgb(255, 159, 64)',
  },
}

const DEFAULT_COLOR = {
  bg: 'rgba(108, 117, 125, 0.2)',
  border: 'rgb(108, 117, 125)',
  text: 'rgb(108, 117, 125)',
}

/**
 * Calculate percentage position of a date within the roster period grid.
 * Uses period boundaries for accurate column alignment.
 */
function getDatePosition(dateStr: string, periods: RosterPeriod[]): number {
  if (periods.length === 0) return 0
  const ts = new Date(dateStr).getTime()
  const columnWidth = 100 / periods.length

  const firstStart = new Date(periods[0].startDate).getTime()
  if (ts <= firstStart) return 0

  const lastEnd = new Date(periods[periods.length - 1].endDate).getTime()
  if (ts >= lastEnd) return 100

  for (let i = 0; i < periods.length; i++) {
    const pStart = new Date(periods[i].startDate).getTime()
    const pEnd = new Date(periods[i].endDate).getTime()

    if (ts >= pStart && ts <= pEnd) {
      const fraction = (ts - pStart) / (pEnd - pStart)
      return (i + fraction) * columnWidth
    }
  }

  return 100
}

export function GanttTimeline({ renewals, rosterPeriods, year }: GanttTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const getPos = useCallback(
    (dateStr: string) => getDatePosition(dateStr, rosterPeriods),
    [rosterPeriods]
  )

  const columnWidth = rosterPeriods.length > 0 ? 100 / rosterPeriods.length : 0

  // Group renewals by category, sorted by pilot name within each group
  const groupedRenewals = useMemo(() => {
    const groups: Record<string, GanttRenewal[]> = {}
    for (const r of renewals) {
      const cat = r.category || 'Unknown'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(r)
    }
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.pilot_name.localeCompare(b.pilot_name))
    }
    return groups
  }, [renewals])

  const categories = Object.keys(groupedRenewals)

  if (rosterPeriods.length === 0 || renewals.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          {rosterPeriods.length === 0
            ? 'No roster period data available for timeline view.'
            : 'No renewal plans to display in timeline.'}
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Renewal Timeline ({year})</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            {categories.map((cat) => {
              const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR
              return (
                <div key={cat} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-3 w-3 rounded-sm border"
                    style={{ backgroundColor: color.bg, borderColor: color.border }}
                  />
                  <span className="text-muted-foreground">{cat}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-foreground text-[10px]">&#9670;</span>
              <span className="text-muted-foreground">Planned Date</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Period headers */}
            <div className="flex">
              <div className="border-border text-muted-foreground w-[200px] shrink-0 border-r px-2 py-1.5 text-xs font-medium">
                Pilot / Check
              </div>
              <div className="flex flex-1">
                {rosterPeriods.map((p) => (
                  <div
                    key={p.code}
                    className="border-border text-muted-foreground border-r px-1 py-1.5 text-center text-[10px] font-medium"
                    style={{ width: `${columnWidth}%` }}
                  >
                    {p.code.split('/')[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Category groups */}
            {categories.map((category) => {
              const color = CATEGORY_COLORS[category] || DEFAULT_COLOR
              const items = groupedRenewals[category]

              return (
                <div key={category}>
                  {/* Category header row */}
                  <div className="border-border flex border-t-2">
                    <div
                      className="border-border w-[200px] shrink-0 border-r px-2 py-1 text-xs font-semibold"
                      style={{ color: color.text }}
                    >
                      {category} ({items.length})
                    </div>
                    <div className="flex-1" />
                  </div>

                  {/* Renewal rows */}
                  {items.map((renewal, idx) => {
                    const barLeft = getPos(renewal.renewal_window_start)
                    const barRight = getPos(renewal.renewal_window_end)
                    const barWidth = Math.max(barRight - barLeft, 0.5)
                    const diamondPos = getPos(renewal.planned_renewal_date)
                    const isHovered = hoveredId === renewal.id

                    return (
                      <div
                        key={renewal.id}
                        className={`border-border flex border-t ${idx % 2 === 0 ? 'bg-muted/30' : ''}`}
                        onMouseEnter={() => setHoveredId(renewal.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* Pilot info column */}
                        <div className="border-border w-[200px] shrink-0 border-r px-2 py-1.5">
                          <div className="text-foreground truncate text-xs font-medium">
                            {renewal.pilot_name}
                          </div>
                          <div className="text-muted-foreground truncate text-[10px]">
                            {renewal.check_code} &bull; {renewal.employee_id}
                          </div>
                        </div>

                        {/* Timeline bar area */}
                        <div className="relative flex-1 py-1.5" style={{ minHeight: '28px' }}>
                          {/* Vertical grid lines */}
                          {rosterPeriods.map((p, i) => (
                            <div
                              key={p.code}
                              className="border-border/30 absolute top-0 bottom-0 border-r"
                              style={{ left: `${(i + 1) * columnWidth}%` }}
                            />
                          ))}

                          {/* Renewal window bar */}
                          <div
                            className="absolute top-1/2 h-5 -translate-y-1/2 rounded-sm border transition-opacity"
                            style={{
                              left: `${barLeft}%`,
                              width: `${barWidth}%`,
                              backgroundColor: color.bg,
                              borderColor: color.border,
                              opacity: isHovered ? 1 : 0.75,
                            }}
                          />

                          {/* Diamond marker at planned date */}
                          <div
                            className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45"
                            style={{
                              left: `${diamondPos}%`,
                              backgroundColor: color.border,
                            }}
                          />

                          {/* Tooltip on hover */}
                          {isHovered && (
                            <div
                              className="border-border bg-popover absolute bottom-full z-20 mb-2 w-56 rounded-md border p-2.5 text-xs shadow-md"
                              style={{
                                left: `${Math.min(Math.max(diamondPos, 10), 80)}%`,
                                transform: 'translateX(-50%)',
                              }}
                            >
                              <div className="text-foreground font-semibold">
                                {renewal.pilot_name}
                              </div>
                              <div className="text-muted-foreground mt-1 space-y-0.5">
                                <div>Check: {renewal.check_code}</div>
                                <div>Planned: {renewal.planned_renewal_date}</div>
                                <div>Expiry: {renewal.original_expiry_date}</div>
                                <div>
                                  Window: {renewal.renewal_window_start} &rarr;{' '}
                                  {renewal.renewal_window_end}
                                </div>
                                {renewal.paired_pilot_name && (
                                  <div>Paired with: {renewal.paired_pilot_name}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
