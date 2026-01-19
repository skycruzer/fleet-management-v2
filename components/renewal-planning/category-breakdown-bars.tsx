/**
 * Category Breakdown Bars
 *
 * Horizontal progress bars showing category-wise breakdown of renewals.
 * Displays planned count vs capacity with color-coded utilization.
 */

'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, Plane, Monitor, GraduationCap, FileQuestion } from 'lucide-react'

interface CategoryData {
  category: string
  plannedCount: number
  capacity: number
}

interface CategoryBreakdownBarsProps {
  categories: CategoryData[]
  className?: string
  compact?: boolean
}

// Get icon for each category
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Pilot Medical':
      return Stethoscope
    case 'Flight Checks':
      return Plane
    case 'Simulator Checks':
      return Monitor
    case 'Ground Courses Refresher':
      return GraduationCap
    default:
      return FileQuestion
  }
}

// Get utilization color
function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'bg-red-500'
  if (utilization > 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getUtilizationTextColor(utilization: number): string {
  if (utilization > 80) return 'text-red-600 dark:text-red-400'
  if (utilization > 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

// Get short category name for display
function getShortCategoryName(category: string): string {
  switch (category) {
    case 'Pilot Medical':
      return 'Medical'
    case 'Flight Checks':
      return 'Flight'
    case 'Simulator Checks':
      return 'Simulator'
    case 'Ground Courses Refresher':
      return 'Ground'
    default:
      return category
  }
}

export function CategoryBreakdownBars({
  categories,
  className,
  compact = false,
}: CategoryBreakdownBarsProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
        No category data available
      </div>
    )
  }

  // Sort categories by utilization (highest first)
  const sortedCategories = [...categories].sort((a, b) => {
    const utilA = a.capacity > 0 ? (a.plannedCount / a.capacity) * 100 : 0
    const utilB = b.capacity > 0 ? (b.plannedCount / b.capacity) * 100 : 0
    return utilB - utilA
  })

  return (
    <div className={cn('space-y-3', className)}>
      {sortedCategories.map((cat) => {
        const utilization = cat.capacity > 0 ? (cat.plannedCount / cat.capacity) * 100 : 0
        const color = getUtilizationColor(utilization)
        const textColor = getUtilizationTextColor(utilization)
        const Icon = getCategoryIcon(cat.category)

        return (
          <div key={cat.category} className="space-y-1.5">
            {/* Category Header */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', textColor)} />
                <span className="text-foreground font-medium">
                  {compact ? getShortCategoryName(cat.category) : cat.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold', textColor)}>{cat.plannedCount}</span>
                <span className="text-muted-foreground">/ {cat.capacity}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'px-1.5 py-0 text-xs',
                    utilization > 80 && 'border-red-300 text-red-600',
                    utilization > 60 && utilization <= 80 && 'border-yellow-300 text-yellow-600',
                    utilization <= 60 && 'border-green-300 text-green-600'
                  )}
                >
                  {Math.round(utilization)}%
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full transition-all duration-500', color)}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Compact version for use in tooltips or smaller spaces
 */
export function CategoryBreakdownCompact({
  categories,
  className,
}: {
  categories: CategoryData[]
  className?: string
}) {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2 text-xs', className)}>
      {categories.map((cat) => {
        const utilization = cat.capacity > 0 ? (cat.plannedCount / cat.capacity) * 100 : 0
        const textColor = getUtilizationTextColor(utilization)

        return (
          <div key={cat.category} className="flex items-center justify-between">
            <span className="text-muted-foreground truncate">
              {getShortCategoryName(cat.category)}
            </span>
            <span className={cn('font-medium', textColor)}>
              {cat.plannedCount}/{cat.capacity}
            </span>
          </div>
        )
      })}
    </div>
  )
}
