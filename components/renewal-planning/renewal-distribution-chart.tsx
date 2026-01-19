/**
 * Renewal Distribution Chart
 *
 * CSS-only bar chart showing renewal distribution across roster periods.
 * Uses calculated heights for bars based on utilization percentage.
 * Color-coded by utilization status (green/yellow/red).
 */

'use client'

import { cn } from '@/lib/utils'

interface PeriodData {
  rosterPeriod: string
  plannedCount: number
  totalCapacity: number
  utilization: number
}

interface RenewalDistributionChartProps {
  data: PeriodData[]
  maxHeight?: number
  className?: string
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'bg-red-500'
  if (utilization > 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getUtilizationBgColor(utilization: number): string {
  if (utilization > 80) return 'bg-red-100 dark:bg-red-950'
  if (utilization > 60) return 'bg-yellow-100 dark:bg-yellow-950'
  return 'bg-green-100 dark:bg-green-950'
}

export function RenewalDistributionChart({
  data,
  maxHeight = 160,
  className,
}: RenewalDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        No distribution data available
      </div>
    )
  }

  // Calculate max utilization for scaling (cap at 100% for visual consistency)
  const maxUtilization = Math.max(...data.map((d) => Math.min(d.utilization, 100)), 100)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Chart Container */}
      <div className="flex items-end gap-1.5" style={{ height: maxHeight }}>
        {data.map((period) => {
          const height =
            maxUtilization > 0 ? (Math.min(period.utilization, 100) / maxUtilization) * 100 : 0
          const color = getUtilizationColor(period.utilization)
          const bgColor = getUtilizationBgColor(period.utilization)

          return (
            <div
              key={period.rosterPeriod}
              className="group relative flex flex-1 cursor-pointer flex-col items-center justify-end"
              style={{ height: '100%' }}
              title={`${period.rosterPeriod}: ${period.plannedCount}/${period.totalCapacity} (${Math.round(period.utilization)}%)`}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full z-10 mb-2 hidden group-hover:block">
                <div className="bg-popover rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{period.rosterPeriod}</div>
                  <div className="text-muted-foreground">
                    {period.plannedCount} / {period.totalCapacity} ({Math.round(period.utilization)}
                    %)
                  </div>
                </div>
              </div>

              {/* Bar Container */}
              <div
                className={cn(
                  'relative w-full rounded-t-sm transition-all duration-300',
                  bgColor,
                  'group-hover:opacity-80'
                )}
                style={{ height: `${Math.max(height, 4)}%` }}
              >
                {/* Filled portion */}
                <div
                  className={cn(
                    'absolute right-0 bottom-0 left-0 rounded-t-sm transition-all duration-500',
                    color
                  )}
                  style={{ height: '100%' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="flex gap-1.5">
        {data.map((period) => (
          <div key={`label-${period.rosterPeriod}`} className="flex-1 text-center">
            <span className="text-muted-foreground text-[10px] font-medium">
              {period.rosterPeriod.replace('RP', '')}
            </span>
          </div>
        ))}
      </div>

      {/* Y-Axis Reference Lines (optional visual guide) */}
      <div className="text-muted-foreground mt-1 flex items-center justify-between text-[10px]">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}
