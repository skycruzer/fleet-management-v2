/**
 * Period Hover Card
 *
 * Detailed tooltip/hover card for roster period cards.
 * Uses CSS-based hover for showing detailed information.
 */

'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, AlertTriangle, Plane, Monitor, GraduationCap } from 'lucide-react'
import { formatDate } from '@/lib/utils/date-utils'

interface CategoryBreakdown {
  plannedCount: number
  capacity: number
  pilots: Array<{ id: string; name: string; checkType: string }>
}

interface PeriodHoverCardProps {
  children: React.ReactNode
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  categoryBreakdown: Record<string, CategoryBreakdown>
  isExcluded?: boolean
  side?: 'top' | 'bottom' | 'left' | 'right'
}

// Get icon for each category
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Flight Checks':
      return Plane
    case 'Simulator Checks':
      return Monitor
    case 'Ground Courses Refresher':
      return GraduationCap
    default:
      return Calendar
  }
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'text-[var(--color-status-high)]'
  if (utilization > 60) return 'text-[var(--color-status-medium)]'
  return 'text-[var(--color-status-low)]'
}

function getProgressColor(utilization: number): string {
  if (utilization > 80) return 'bg-[var(--color-status-high)]'
  if (utilization > 60) return 'bg-[var(--color-status-medium)]'
  return 'bg-[var(--color-status-low)]'
}

export function PeriodHoverCard({
  children,
  rosterPeriod,
  periodStartDate,
  periodEndDate,
  totalPlannedRenewals,
  totalCapacity,
  utilizationPercentage,
  categoryBreakdown,
  isExcluded = false,
  side = 'right',
}: PeriodHoverCardProps) {
  const categories = Object.entries(categoryBreakdown)
  const highUtilizationCategories = categories.filter(
    ([_, data]) => data.capacity > 0 && (data.plannedCount / data.capacity) * 100 > 80
  )

  // Calculate position class based on side
  const positionClass = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }[side]

  if (isExcluded) {
    return (
      <div className="group relative">
        {children}
        <div className={cn('absolute z-50 hidden w-64 group-hover:block', positionClass)}>
          <div className="bg-popover rounded-lg border p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground font-semibold">{rosterPeriod}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              This period is excluded from renewal scheduling (holiday month).
            </p>
            <div className="text-muted-foreground mt-2 text-xs">
              {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      {children}
      <div className={cn('absolute z-50 hidden w-80 group-hover:block', positionClass)}>
        <div className="bg-popover space-y-4 rounded-lg border p-4 shadow-lg">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-foreground font-semibold">{rosterPeriod}</h4>
              <p className="text-muted-foreground text-xs">
                {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
              </p>
            </div>
            <Badge
              className={cn(
                'text-xs',
                utilizationPercentage > 80 && 'bg-[var(--color-status-high)]',
                utilizationPercentage > 60 &&
                  utilizationPercentage <= 80 &&
                  'bg-[var(--color-status-medium)]',
                utilizationPercentage <= 60 && 'bg-[var(--color-status-low)]'
              )}
            >
              {Math.round(utilizationPercentage)}%
            </Badge>
          </div>

          {/* Overall Capacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Capacity</span>
              <span className={cn('font-semibold', getUtilizationColor(utilizationPercentage))}>
                {totalPlannedRenewals} / {totalCapacity}
              </span>
            </div>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getProgressColor(utilizationPercentage)
                )}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Category Breakdown */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                By Category
              </h5>
              <div className="space-y-1.5">
                {categories.map(([category, data]) => {
                  const catUtil = data.capacity > 0 ? (data.plannedCount / data.capacity) * 100 : 0
                  const Icon = getCategoryIcon(category)

                  return (
                    <div key={category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('h-3 w-3', getUtilizationColor(catUtil))} />
                        <span className="text-muted-foreground max-w-[140px] truncate">
                          {category}
                        </span>
                      </div>
                      <span className={cn('font-medium', getUtilizationColor(catUtil))}>
                        {data.plannedCount}/{data.capacity}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* High Utilization Warning */}
          {highUtilizationCategories.length > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-[var(--color-status-medium-bg)] p-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--color-status-medium)]" />
              <span className="text-[var(--color-status-medium-foreground)]">
                {highUtilizationCategories.length} category
                {highUtilizationCategories.length > 1 ? 'ies' : 'y'} above 80% capacity
              </span>
            </div>
          )}

          {/* Sample Pilots (first 3) */}
          {categories.length > 0 && categories[0][1].pilots.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                <Users className="h-3 w-3" />
                <span>Pilots ({totalPlannedRenewals} total)</span>
              </div>
              <div className="space-y-0.5">
                {categories[0][1].pilots.slice(0, 3).map((pilot) => (
                  <div
                    key={pilot.id}
                    className="text-muted-foreground flex justify-between text-xs"
                  >
                    <span className="max-w-[160px] truncate">{pilot.name}</span>
                    <span className="text-muted-foreground/60">{pilot.checkType}</span>
                  </div>
                ))}
                {totalPlannedRenewals > 3 && (
                  <div className="text-muted-foreground text-xs italic">
                    +{totalPlannedRenewals - 3} more pilots...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Click to view hint */}
          <div className="text-muted-foreground border-t pt-2 text-center text-xs">
            Click to view full details
          </div>
        </div>
      </div>
    </div>
  )
}
