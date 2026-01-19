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
    if (utilization > 100) return 'bg-red-500'
    if (utilization >= 80) return 'bg-orange-500'
    if (utilization >= 50) return 'bg-yellow-500'
    if (utilization > 0) return 'bg-green-500'
    return 'bg-gray-200 dark:bg-gray-700'
  }

  const getUtilizationBgColor = (utilization: number, isSelected: boolean) => {
    if (isSelected) return 'ring-2 ring-primary ring-offset-2'
    if (utilization > 100)
      return 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50'
    if (utilization >= 80)
      return 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50'
    if (utilization >= 50)
      return 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
    if (utilization > 0)
      return 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
    return 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 animate-pulse rounded-full bg-red-600" />
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
                    <p className="text-xs text-red-400">Over capacity!</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-yellow-500" />
            <span className="text-muted-foreground">50-79%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-orange-500" />
            <span className="text-muted-foreground">80-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">≥100%</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
