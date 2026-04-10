/**
 * Multi-Year Retirement Forecast Chart Component
 * Interactive 10-year retirement forecast visualization using Tremor BarChart
 *
 * Features:
 * - Stacked bar chart showing captain and first officer retirements
 * - 10-year forecasting period
 * - Interactive hover tooltips
 * - Color-coded by rank (blue for captains, emerald for FOs)
 * - Responsive design
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { BarChart, Card } from '@tremor/react'
import { TrendingUp } from 'lucide-react'

interface MultiYearForecastChartProps {
  data: Array<{
    year: number
    captains: number
    firstOfficers: number
    total: number
    yearLabel: string
  }>
}

/**
 * Client Component for multi-year retirement forecast chart
 * Uses Tremor's BarChart with stacked bars for captains and first officers
 */
export function MultiYearForecastChart({ data }: MultiYearForecastChartProps) {
  // Transform data for Tremor BarChart
  const chartData = data.map((yearData) => ({
    year: yearData.yearLabel,
    Captains: yearData.captains,
    'First Officers': yearData.firstOfficers,
  }))

  // Calculate total retirements across all years
  const totalRetirements = data.reduce((sum, year) => sum + year.total, 0)

  // Find peak retirement year
  const peakYear = data.reduce((peak, year) => (year.total > peak.total ? year : peak), data[0])

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-[var(--color-info)]" />
          <h3 className="text-foreground text-lg font-semibold">10-Year Retirement Forecast</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Total (10 years)</p>
            <p className="text-foreground text-2xl font-bold">{totalRetirements}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Peak Year</p>
            <p className="text-foreground text-lg font-semibold">
              {peakYear.yearLabel} ({peakYear.total})
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <BarChart
        className="h-96"
        data={chartData}
        index="year"
        categories={['Captains', 'First Officers']}
        colors={['blue', 'emerald']}
        valueFormatter={(value) => `${value} pilot${value === 1 ? '' : 's'}`}
        stack
        showLegend
        showGridLines
        showXAxis
        showYAxis
        yAxisWidth={48}
        autoMinValue
      />

      {/* Summary Stats */}
      <div className="border-border mt-6 grid grid-cols-3 gap-4 border-t pt-4">
        <div className="rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3">
          <p className="text-xs font-medium text-[var(--color-info)]">Avg per Year</p>
          <p className="text-foreground text-xl font-bold">
            {Math.round(totalRetirements / data.length)}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-3">
          <p className="text-xs font-medium text-[var(--color-status-low)]">Captains</p>
          <p className="text-foreground text-xl font-bold">
            {data.reduce((sum, year) => sum + year.captains, 0)}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-category-simulator)]/30 bg-[var(--color-category-simulator-bg)] p-3">
          <p className="text-xs font-medium text-[var(--color-category-simulator)]">
            First Officers
          </p>
          <p className="text-foreground text-xl font-bold">
            {data.reduce((sum, year) => sum + year.firstOfficers, 0)}
          </p>
        </div>
      </div>

      {/* Planning Recommendation */}
      {totalRetirements > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-3">
          <p className="text-xs text-[var(--color-status-medium)]">
            <span className="font-semibold">Planning Insight:</span>{' '}
            {peakYear.total >= 5
              ? `Prepare for significant retirement wave in ${peakYear.yearLabel} with ${peakYear.total} expected retirements.`
              : `Retirements are well-distributed across the next 10 years. Continue monitoring succession pipeline.`}
          </p>
        </div>
      )}
    </Card>
  )
}
