/**
 * Yearly Calendar View for Renewal Planning
 * Author: Maurice Rondeau
 *
 * Displays all roster periods with capacity indicators.
 * Features compact cards with hover details and visual progress bars.
 *
 * Redesigned with:
 * - Compact period cards with better visual hierarchy
 * - Hover cards showing detailed breakdown
 * - Visual progress bars for utilization
 * - Improved responsive design
 */

'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/date-utils'
import { Calendar, AlertTriangle, TrendingUp, Info } from 'lucide-react'
import { PeriodHoverCard } from './period-hover-card'
import { cn } from '@/lib/utils'
import type { CalendarFilters } from './calendar-filter-panel'

interface CategoryBreakdown {
  plannedCount: number
  capacity: number
  pilots?: Array<{ id: string; name: string; checkType: string }>
}

interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  categoryBreakdown: Record<string, CategoryBreakdown>
}

interface RenewalCalendarYearlyProps {
  summaries: RosterPeriodSummary[]
  year: number
  filters?: CalendarFilters
  compact?: boolean
}

export function RenewalCalendarYearly({
  summaries,
  year,
  filters,
  compact = false,
}: RenewalCalendarYearlyProps) {
  // Check if period is in December or January (excluded)
  const isExcludedPeriod = (period: RosterPeriodSummary): boolean => {
    const month = period.periodStartDate.getMonth()
    return month === 0 || month === 11 // January or December
  }

  // Apply filters to summaries
  const filteredSummaries = useMemo(() => {
    if (!filters) return summaries

    return summaries.filter((summary) => {
      // Filter by excluded periods
      const isExcluded = isExcludedPeriod(summary)
      if (!filters.showExcludedPeriods && isExcluded) return false

      // Filter by utilization level
      if (filters.utilizationLevel !== 'all') {
        const util = summary.utilizationPercentage
        if (filters.utilizationLevel === 'low' && util >= 60) return false
        if (filters.utilizationLevel === 'medium' && (util < 60 || util > 80)) return false
        if (filters.utilizationLevel === 'high' && util <= 80) return false
      }

      // Filter by categories (if any selected, period must have renewals in those categories)
      if (filters.categories.length > 0) {
        const hasCategory = filters.categories.some(
          (cat) => summary.categoryBreakdown[cat]?.plannedCount > 0
        )
        if (!hasCategory) return false
      }

      return true
    })
  }, [summaries, filters])

  const getUtilizationColor = (utilization: number): string => {
    if (utilization > 80) return 'border-red-400 dark:border-red-600'
    if (utilization > 60) return 'border-yellow-400 dark:border-yellow-600'
    return 'border-green-400 dark:border-green-600'
  }

  const getUtilizationBg = (utilization: number): string => {
    if (utilization > 80) return 'bg-red-50 dark:bg-red-950/30'
    if (utilization > 60) return 'bg-yellow-50 dark:bg-yellow-950/30'
    return 'bg-green-50 dark:bg-green-950/30'
  }

  const getProgressColor = (utilization: number): string => {
    if (utilization > 80) return 'bg-red-500'
    if (utilization > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getBadgeVariant = (utilization: number): string => {
    if (utilization > 80) return 'bg-red-600 text-white hover:bg-red-700'
    if (utilization > 60) return 'bg-yellow-600 text-white hover:bg-yellow-700'
    return 'bg-green-600 text-white hover:bg-green-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Yearly Calendar - {year}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Visual overview of certification renewals across all roster periods
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">&lt;60%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">60-80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">&gt;80%</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className={cn(
          'grid gap-3',
          compact
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}
      >
        {filteredSummaries.map((summary) => {
          const isExcluded = isExcludedPeriod(summary)
          const utilization = summary.utilizationPercentage

          // Add pilots array to category breakdown for hover card
          const categoryBreakdownWithPilots = Object.fromEntries(
            Object.entries(summary.categoryBreakdown).map(([cat, data]) => [
              cat,
              {
                ...data,
                pilots: (data as any).pilots || [],
              },
            ])
          )

          const cardContent = (
            <Card
              className={cn(
                'group border-l-4 transition-all duration-200',
                isExcluded
                  ? 'cursor-not-allowed border-l-gray-300 bg-gray-50 dark:bg-gray-900/50'
                  : cn(
                      getUtilizationColor(utilization),
                      getUtilizationBg(utilization),
                      'cursor-pointer hover:shadow-md'
                    ),
                compact ? 'p-3' : 'p-4'
              )}
            >
              {/* Header Row */}
              <div className="mb-2 flex items-center justify-between">
                <h3 className={cn('text-foreground font-bold', compact ? 'text-sm' : 'text-base')}>
                  {summary.rosterPeriod}
                </h3>
                {isExcluded ? (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    EXCLUDED
                  </Badge>
                ) : (
                  <Badge className={cn('px-1.5 py-0 text-[10px]', getBadgeVariant(utilization))}>
                    {Math.round(utilization)}%
                  </Badge>
                )}
              </div>

              {/* Date Range */}
              <p className="text-muted-foreground mb-2 text-[10px]">
                {formatDate(summary.periodStartDate)} - {formatDate(summary.periodEndDate)}
              </p>

              {isExcluded ? (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Holiday Period</span>
                </div>
              ) : (
                <>
                  {/* Capacity Count */}
                  <div className="mb-2 flex items-baseline gap-1">
                    <span
                      className={cn('text-foreground font-bold', compact ? 'text-xl' : 'text-2xl')}
                    >
                      {summary.totalPlannedRenewals}
                    </span>
                    <span className="text-muted-foreground text-sm">/ {summary.totalCapacity}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-secondary mb-2 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        getProgressColor(utilization)
                      )}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>

                  {/* Category Quick View (show top 2 in compact mode) */}
                  {!compact && (
                    <div className="space-y-0.5">
                      {Object.entries(summary.categoryBreakdown)
                        .slice(0, 3)
                        .map(([category, data]) => {
                          const catUtil =
                            data.capacity > 0 ? (data.plannedCount / data.capacity) * 100 : 0
                          return (
                            <div
                              key={category}
                              className="flex items-center justify-between text-[10px]"
                            >
                              <span className="text-muted-foreground max-w-[100px] truncate">
                                {category
                                  .replace('Pilot Medical', 'Medical')
                                  .replace('Ground Courses Refresher', 'Ground')}
                              </span>
                              <span
                                className={cn(
                                  'font-medium',
                                  catUtil > 80
                                    ? 'text-red-600'
                                    : catUtil > 60
                                      ? 'text-yellow-600'
                                      : 'text-green-600'
                                )}
                              >
                                {data.plannedCount}/{data.capacity}
                              </span>
                            </div>
                          )
                        })}
                      {Object.keys(summary.categoryBreakdown).length > 3 && (
                        <p className="text-muted-foreground text-[10px] italic">
                          +{Object.keys(summary.categoryBreakdown).length - 3} more
                        </p>
                      )}
                    </div>
                  )}

                  {/* Hover hint */}
                  <div className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                    <Info className="h-3 w-3" />
                    <span>Hover for details</span>
                  </div>
                </>
              )}
            </Card>
          )

          // Wrap with hover card for non-excluded periods
          const wrappedCard = (
            <PeriodHoverCard
              key={summary.rosterPeriod}
              rosterPeriod={summary.rosterPeriod}
              periodStartDate={summary.periodStartDate}
              periodEndDate={summary.periodEndDate}
              totalPlannedRenewals={summary.totalPlannedRenewals}
              totalCapacity={summary.totalCapacity}
              utilizationPercentage={summary.utilizationPercentage}
              categoryBreakdown={categoryBreakdownWithPilots}
              isExcluded={isExcluded}
              side="right"
            >
              {cardContent}
            </PeriodHoverCard>
          )

          // Wrap with link for non-excluded periods
          if (isExcluded) {
            return <div key={summary.rosterPeriod}>{wrappedCard}</div>
          }

          return (
            <Link
              key={summary.rosterPeriod}
              href={`/dashboard/renewal-planning/roster-period/${summary.rosterPeriod}`}
            >
              {wrappedCard}
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredSummaries.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            {filters ? 'No Matching Periods' : 'No Roster Periods Found'}
          </h3>
          <p className="text-muted-foreground">
            {filters
              ? 'Try adjusting your filters to see more results.'
              : `No roster periods available for ${year}. Generate a renewal plan to get started.`}
          </p>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-blue-50 p-4 dark:bg-blue-950/30">
        <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
          Calendar Guide
        </h4>
        <ul className="grid gap-1 text-xs text-blue-700 sm:grid-cols-2 dark:text-blue-300">
          <li className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            Good utilization (&lt;60%)
          </li>
          <li className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            Medium utilization (60-80%)
          </li>
          <li className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            High utilization (&gt;80%)
          </li>
          <li className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
            Excluded periods (Dec/Jan)
          </li>
        </ul>
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          Hover over any period for detailed breakdown. Click to view full pilot schedules.
        </p>
      </Card>
    </div>
  )
}
