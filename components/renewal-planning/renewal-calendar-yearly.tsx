/**
 * Yearly Calendar View for Renewal Planning
 * Displays all 13 roster periods with capacity indicators
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/date-utils'
import { Calendar, AlertTriangle } from 'lucide-react'

interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  categoryBreakdown: Record<
    string,
    {
      plannedCount: number
      capacity: number
    }
  >
}

interface RenewalCalendarYearlyProps {
  summaries: RosterPeriodSummary[]
  year: number
}

export function RenewalCalendarYearly({ summaries, year }: RenewalCalendarYearlyProps) {
  // Check if period is in December or January (excluded)
  const isExcludedPeriod = (period: RosterPeriodSummary): boolean => {
    const month = period.periodStartDate.getMonth()
    return month === 0 || month === 11 // January or December
  }

  const getUtilizationColor = (utilization: number): string => {
    if (utilization > 80)
      return 'bg-red-50 border-red-300 hover:bg-red-100 dark:bg-red-950 dark:border-red-700 dark:hover:bg-red-900'
    if (utilization > 60)
      return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950 dark:border-yellow-700 dark:hover:bg-yellow-900'
    return 'bg-green-50 border-green-300 hover:bg-green-100 dark:bg-green-950 dark:border-green-700 dark:hover:bg-green-900'
  }

  const getBadgeColor = (utilization: number): string => {
    if (utilization > 80) return 'bg-red-600 text-white'
    if (utilization > 60) return 'bg-yellow-600 text-white'
    return 'bg-green-600 text-white'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Yearly Calendar - {year}</h2>
          <p className="text-muted-foreground mt-1">
            Visual overview of certification renewals across all roster periods
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-600" />
            <span className="text-muted-foreground">&lt;60% Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-yellow-600" />
            <span className="text-muted-foreground">60-80% Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-600" />
            <span className="text-muted-foreground">&gt;80% High</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaries.map((summary) => {
          const isExcluded = isExcludedPeriod(summary)
          const color = isExcluded
            ? 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
            : getUtilizationColor(summary.utilizationPercentage)
          const badgeColor = isExcluded
            ? 'bg-gray-600 text-white'
            : getBadgeColor(summary.utilizationPercentage)

          return (
            <Link
              key={summary.rosterPeriod}
              href={
                isExcluded
                  ? '#'
                  : `/dashboard/renewal-planning/roster-period/${summary.rosterPeriod}`
              }
              className={isExcluded ? 'cursor-not-allowed' : ''}
            >
              <Card
                className={`border-2 p-5 transition-all ${color} ${!isExcluded && 'hover:shadow-lg'}`}
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-foreground text-lg font-bold">{summary.rosterPeriod}</h3>
                  {isExcluded && (
                    <AlertTriangle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>

                {/* Date Range */}
                <p className="text-muted-foreground mb-3 text-xs">
                  {formatDate(summary.periodStartDate)} - {formatDate(summary.periodEndDate)}
                </p>

                {/* Exclusion Notice or Capacity Info */}
                {isExcluded ? (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-gray-600 text-white">
                      EXCLUDED
                    </Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Holiday Period</p>
                  </div>
                ) : (
                  <>
                    {/* Renewal Count */}
                    <div className="mb-3">
                      <span className="text-foreground text-3xl font-bold">
                        {summary.totalPlannedRenewals}
                      </span>
                      <span className="text-muted-foreground text-lg">
                        {' '}
                        / {summary.totalCapacity}
                      </span>
                    </div>

                    {/* Utilization Badge */}
                    <Badge className={`${badgeColor} mb-3`}>
                      {Math.round(summary.utilizationPercentage)}% Utilization
                    </Badge>

                    {/* Category Breakdown */}
                    <div className="space-y-1.5">
                      {Object.entries(summary.categoryBreakdown)
                        .slice(0, 3)
                        .map(([category, data]) => {
                          const categoryUtil =
                            data.capacity > 0 ? (data.plannedCount / data.capacity) * 100 : 0
                          const categoryColor =
                            categoryUtil > 80
                              ? 'text-red-700 dark:text-red-300'
                              : categoryUtil > 60
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : 'text-green-700 dark:text-green-300'

                          return (
                            <div
                              key={category}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-muted-foreground truncate">{category}</span>
                              <span className={`font-medium ${categoryColor}`}>
                                {data.plannedCount}/{data.capacity}
                              </span>
                            </div>
                          )
                        })}
                      {Object.keys(summary.categoryBreakdown).length > 3 && (
                        <p className="text-muted-foreground text-xs italic">
                          +{Object.keys(summary.categoryBreakdown).length - 3} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {summaries.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-semibold">No Roster Periods Found</h3>
          <p className="text-muted-foreground">
            No roster periods available for {year}. Generate a renewal plan to get started.
          </p>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-blue-50 p-4 dark:bg-blue-950">
        <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">Calendar Guide</h4>
        <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li>
            • <strong>Green cards</strong>: Good utilization (&lt;60%)
          </li>
          <li>
            • <strong>Yellow cards</strong>: Medium utilization (60-80%)
          </li>
          <li>
            • <strong>Red cards</strong>: High utilization (&gt;80%) - consider rescheduling
          </li>
          <li>
            • <strong>Gray cards</strong>: Excluded periods (December/January holiday months)
          </li>
          <li>• Click any eligible period to see detailed pilot schedules</li>
        </ul>
      </Card>
    </div>
  )
}
