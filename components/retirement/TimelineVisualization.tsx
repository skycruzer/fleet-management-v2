/**
 * Timeline Visualization Component
 * Interactive month-by-month retirement timeline chart using Tremor
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { AreaChart, Card } from '@tremor/react'

interface TimelineVisualizationProps {
  timeline: Array<{
    month: string
    year: number
    captains: number
    firstOfficers: number
    total: number
  }>
  onMonthClick?: (month: string) => void
}

/**
 * Client Component that displays interactive monthly retirement timeline
 * Uses Tremor AreaChart for visualization with click handling
 */
export function TimelineVisualization({ timeline, onMonthClick }: TimelineVisualizationProps) {
  // Transform data for Tremor AreaChart
  const chartData = timeline.map((bucket) => ({
    month: bucket.month,
    Captains: bucket.captains,
    'First Officers': bucket.firstOfficers,
  }))

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-lg font-semibold">Monthly Retirement Timeline</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        Next 5 years - Click on a month to view details
      </p>

      {chartData.length === 0 ? (
        <div className="bg-muted flex h-80 items-center justify-center rounded-lg">
          <p className="text-muted-foreground">
            No retirement data available for the forecast period
          </p>
        </div>
      ) : (
        <AreaChart
          className="h-80"
          data={chartData}
          index="month"
          categories={['Captains', 'First Officers']}
          colors={['blue', 'emerald']}
          valueFormatter={(value) => `${value} ${value === 1 ? 'pilot' : 'pilots'}`}
          onValueChange={(v) => {
            if (v && v.month && onMonthClick) {
              onMonthClick(v.month as string)
            }
          }}
          showLegend
          showGridLines
          showXAxis
          showYAxis
          yAxisWidth={48}
          autoMinValue
        />
      )}

      {chartData.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-info)]" />
            <span className="text-muted-foreground">Captains</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-status-low)]" />
            <span className="text-muted-foreground">First Officers</span>
          </div>
        </div>
      )}
    </Card>
  )
}
