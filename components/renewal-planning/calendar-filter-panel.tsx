/**
 * Calendar Filter Panel
 * Author: Maurice Rondeau
 *
 * Sidebar filter panel for renewal planning calendar.
 * Allows filtering by category, priority, and utilization level.
 * Uses native HTML details/summary for collapsible sections.
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Filter,
  ChevronDown,
  X,
  Stethoscope,
  Plane,
  Monitor,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CalendarFilters {
  categories: string[]
  utilizationLevel: 'all' | 'low' | 'medium' | 'high'
  showExcludedPeriods: boolean
  priorityRange: [number, number]
}

interface CalendarFilterPanelProps {
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
  categoryStats?: Record<string, number>
  className?: string
}

const CATEGORIES = [
  { id: 'Pilot Medical', label: 'Medical', icon: Stethoscope },
  { id: 'Flight Checks', label: 'Flight Checks', icon: Plane },
  { id: 'Simulator Checks', label: 'Simulator', icon: Monitor },
  { id: 'Ground Courses Refresher', label: 'Ground Courses', icon: GraduationCap },
]

const UTILIZATION_LEVELS = [
  { id: 'all', label: 'All Levels', color: 'text-foreground' },
  { id: 'low', label: 'Low (<60%)', color: 'text-green-600' },
  { id: 'medium', label: 'Medium (60-80%)', color: 'text-yellow-600' },
  { id: 'high', label: 'High (>80%)', color: 'text-red-600' },
]

export function CalendarFilterPanel({
  filters,
  onFiltersChange,
  categoryStats = {},
  className,
}: CalendarFilterPanelProps) {
  const activeFilterCount =
    filters.categories.length +
    (filters.utilizationLevel !== 'all' ? 1 : 0) +
    (filters.showExcludedPeriods ? 0 : 1)

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleUtilizationChange = (level: CalendarFilters['utilizationLevel']) => {
    onFiltersChange({ ...filters, utilizationLevel: level })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      categories: [],
      utilizationLevel: 'all',
      showExcludedPeriods: true,
      priorityRange: [1, 10],
    })
  }

  return (
    <Card className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <h3 className="text-foreground font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground h-7 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <Separator />

      {/* Category Filter */}
      <details open className="group">
        <summary className="hover:bg-muted/50 -mx-1 flex cursor-pointer list-none items-center justify-between rounded px-1 py-1">
          <span className="text-foreground text-sm font-medium">Categories</span>
          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-2 pt-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            const count = categoryStats[category.id] || 0
            const isSelected = filters.categories.includes(category.id)

            return (
              <div
                key={category.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors',
                  isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                )}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    id={`cat-${category.id}`}
                  />
                  <Icon
                    className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')}
                  />
                  <Label
                    htmlFor={`cat-${category.id}`}
                    className={cn('cursor-pointer text-sm', isSelected && 'font-medium')}
                  >
                    {category.label}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            )
          })}
          {filters.categories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({ ...filters, categories: [] })}
              className="text-muted-foreground w-full text-xs"
            >
              Clear categories
            </Button>
          )}
        </div>
      </details>

      <Separator />

      {/* Utilization Level Filter */}
      <details open className="group">
        <summary className="hover:bg-muted/50 -mx-1 flex cursor-pointer list-none items-center justify-between rounded px-1 py-1">
          <span className="text-foreground text-sm font-medium">Utilization Level</span>
          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-1 pt-2">
          {UTILIZATION_LEVELS.map((level) => {
            const isSelected = filters.utilizationLevel === level.id

            return (
              <div
                key={level.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors',
                  isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                )}
                onClick={() =>
                  handleUtilizationChange(level.id as CalendarFilters['utilizationLevel'])
                }
              >
                <div
                  className={cn(
                    'h-3 w-3 rounded-full border-2',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )}
                >
                  {isSelected && <div className="h-full w-full scale-50 rounded-full bg-white" />}
                </div>
                <span className={cn('text-sm', level.color, isSelected && 'font-medium')}>
                  {level.label}
                </span>
              </div>
            )
          })}
        </div>
      </details>

      <Separator />

      {/* Additional Options */}
      <details className="group">
        <summary className="hover:bg-muted/50 -mx-1 flex cursor-pointer list-none items-center justify-between rounded px-1 py-1">
          <span className="text-foreground text-sm font-medium">Options</span>
          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 pt-2">
          {/* Show Excluded Periods Toggle */}
          <div
            className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md p-2"
            onClick={() =>
              onFiltersChange({ ...filters, showExcludedPeriods: !filters.showExcludedPeriods })
            }
          >
            <Checkbox
              checked={filters.showExcludedPeriods}
              onCheckedChange={(checked) =>
                onFiltersChange({ ...filters, showExcludedPeriods: !!checked })
              }
              id="show-excluded"
            />
            <Label htmlFor="show-excluded" className="cursor-pointer text-sm">
              Show excluded periods (Dec/Jan)
            </Label>
          </div>
        </div>
      </details>

      {/* Quick Actions */}
      <div className="space-y-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => handleUtilizationChange('high')}
        >
          <AlertTriangle className="mr-2 h-3 w-3 text-red-500" />
          Show High Risk Only
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => handleUtilizationChange('low')}
        >
          <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
          Show Available Capacity
        </Button>
      </div>
    </Card>
  )
}

/**
 * Default filter values
 */
export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  categories: [],
  utilizationLevel: 'all',
  showExcludedPeriods: true,
  priorityRange: [1, 10],
}
