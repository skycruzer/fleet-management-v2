/**
 * Roster Period Timeline
 *
 * Horizontal visualization of all 13 roster periods with utilization indicators.
 * Shows at-a-glance view of capacity utilization across the year.
 */

'use client'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RosterPeriodData {
  code: string
  utilization: number
  plannedCount: number
  totalCapacity: number
}

interface RosterPeriodTimelineProps {
  periods: RosterPeriodData[]
  onPeriodClick?: (code: string) => void
  selectedPeriod?: string
  className?: string
}

export function RosterPeriodTimeline({
  periods,
  onPeriodClick,
  selectedPeriod,
  className,
}: RosterPeriodTimelineProps) {
  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'bg-[var(--color-status-high)]'
    if (utilization >= 80) return 'bg-[var(--color-status-medium)]'
    if (utilization >= 50) return 'bg-[var(--color-status-medium)]/70'
    if (utilization > 0) return 'bg-[var(--color-status-low)]'
    return 'bg-muted'
  }

  const getUtilizationBgColor = (utilization: number, isSelected: boolean) => {
    if (isSelected) return 'ring-2 ring-primary ring-offset-2'
    if (utilization > 100)
      return 'bg-[var(--color-status-high-bg)] hover:bg-[var(--color-status-high-bg)]/80'
    if (utilization >= 80)
      return 'bg-[var(--color-status-medium-bg)] hover:bg-[var(--color-status-medium-bg)]/80'
    if (utilization >= 50)
      return 'bg-[var(--color-status-medium-bg)]/70 hover:bg-[var(--color-status-medium-bg)]/60'
    if (utilization > 0)
      return 'bg-[var(--color-status-low-bg)] hover:bg-[var(--color-status-low-bg)]/80'
    return 'bg-muted hover:bg-muted/80'
  }

  // Extract just the period number from "RP01/2026" format
  const getPeriodNumber = (code: string) => {
    const match = code.match(/RP(\d+)/)
    return match ? match[1] : code
  }

  return (
    <TooltipProvider>
      <div className={cn('w-full', className)}>
        {/* Period labels row */}
        <div className="mb-1 flex justify-between">
          {periods.map((period) => (
            <div
              key={period.code}
              className="text-muted-foreground flex-1 text-center text-[10px] font-medium"
            >
              {getPeriodNumber(period.code)}
            </div>
          ))}
        </div>

        {/* Utilization bars */}
        <div className="flex gap-1">
          {periods.map((period) => {
            const isSelected = selectedPeriod === period.code

            return (
              <Tooltip key={period.code}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onPeriodClick?.(period.code)}
                    className={cn(
                      'flex h-12 flex-1 flex-col items-center justify-end rounded-md p-1 transition-all',
                      getUtilizationBgColor(period.utilization, isSelected),
                      onPeriodClick && 'cursor-pointer'
                    )}
                  >
                    {/* Utilization bar (vertical, grows from bottom) */}
                    <div className="relative flex h-full w-full items-end justify-center">
                      <div
                        className={cn(
                          'w-full rounded-sm transition-all',
                          getUtilizationColor(period.utilization)
                        )}
                        style={{
                          height: `${Math.min(period.utilization, 100)}%`,
                          minHeight: period.utilization > 0 ? '4px' : '0',
                        }}
                      />
                      {/* Overflow indicator */}
                      {period.utilization > 100 && (
                        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 animate-pulse rounded-full bg-[var(--color-status-high)]" />
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-center">
                  <p className="font-semibold">{period.code}</p>
                  <p className="text-xs">
                    {period.plannedCount} / {period.totalCapacity} ({period.utilization}%)
                  </p>
                  {period.utilization > 100 && (
                    <p className="text-xs text-[var(--color-status-high)]">Over capacity!</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-[var(--color-status-low)]" />
            <span className="text-muted-foreground">&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-[var(--color-status-medium)]/70" />
            <span className="text-muted-foreground">50-79%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-[var(--color-status-medium)]" />
            <span className="text-muted-foreground">80-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-[var(--color-status-high)]" />
            <span className="text-muted-foreground">≥100%</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
