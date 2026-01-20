/**
 * Calendar Filter Panel
 *
 * Sidebar filter panel for renewal planning calendar.
 * Allows filtering by category, check type, priority, and utilization level.
 * Uses native HTML details/summary for collapsible sections.
 *
 * Updated to:
 * - Remove Medical category (28-day window too short for planning)
 * - Remove "Show excluded periods" option (all 13 periods now available)
 * - Add hierarchical check type filtering for Flight Checks and Simulator Checks
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
  ChevronRight,
  X,
  Plane,
  Monitor,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORIES_WITH_CHECK_TYPES,
  getCheckTypesForCategory,
  getAllCheckCodesForCategory,
} from '@/lib/config/renewal-check-types'

export interface CalendarFilters {
  categories: string[]
  checkCodes: string[]
  utilizationLevel: 'all' | 'low' | 'medium' | 'high'
  priorityRange: [number, number]
}

interface CalendarFilterPanelProps {
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
  categoryStats?: Record<string, number>
  className?: string
}

// Medical removed - 28-day grace window is too short for advance planning
const CATEGORIES = [
  { id: 'Flight Checks', label: 'Flight Checks', icon: Plane },
  { id: 'Simulator Checks', label: 'Simulator', icon: Monitor },
  { id: 'Ground Courses Refresher', label: 'Ground Courses', icon: GraduationCap },
]

const UTILIZATION_LEVELS = [
  { id: 'all', label: 'All Levels', color: 'text-foreground' },
  { id: 'low', label: 'Low (<60%)', color: 'text-[var(--color-status-low)]' },
  { id: 'medium', label: 'Medium (60-80%)', color: 'text-[var(--color-status-medium)]' },
  { id: 'high', label: 'High (>80%)', color: 'text-[var(--color-status-high)]' },
]

export function CalendarFilterPanel({
  filters,
  onFiltersChange,
  categoryStats = {},
  className,
}: CalendarFilterPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const activeFilterCount =
    filters.categories.length +
    filters.checkCodes.length +
    (filters.utilizationLevel !== 'all' ? 1 : 0)

  const handleCategoryToggle = (categoryId: string) => {
    const hasCheckTypes = CATEGORIES_WITH_CHECK_TYPES.includes(categoryId)
    let newCategories: string[]
    let newCheckCodes = [...filters.checkCodes]

    if (filters.categories.includes(categoryId)) {
      // Removing category - also remove its check codes
      newCategories = filters.categories.filter((c) => c !== categoryId)
      if (hasCheckTypes) {
        const categoryCheckCodes = getAllCheckCodesForCategory(categoryId)
        newCheckCodes = newCheckCodes.filter((code) => !categoryCheckCodes.includes(code))
      }
    } else {
      // Adding category - also add all its check codes by default
      newCategories = [...filters.categories, categoryId]
      if (hasCheckTypes) {
        const categoryCheckCodes = getAllCheckCodesForCategory(categoryId)
        newCheckCodes = [...new Set([...newCheckCodes, ...categoryCheckCodes])]
      }
    }

    onFiltersChange({ ...filters, categories: newCategories, checkCodes: newCheckCodes })
  }

  const handleCheckCodeToggle = (checkCode: string, parentCategory: string) => {
    let newCheckCodes: string[]
    let newCategories = [...filters.categories]

    if (filters.checkCodes.includes(checkCode)) {
      // Removing check code
      newCheckCodes = filters.checkCodes.filter((c) => c !== checkCode)
      // If no check codes left for this category, remove the category
      const remainingForCategory = newCheckCodes.filter((code) =>
        getAllCheckCodesForCategory(parentCategory).includes(code)
      )
      if (remainingForCategory.length === 0) {
        newCategories = newCategories.filter((c) => c !== parentCategory)
      }
    } else {
      // Adding check code - also ensure parent category is selected
      newCheckCodes = [...filters.checkCodes, checkCode]
      if (!newCategories.includes(parentCategory)) {
        newCategories = [...newCategories, parentCategory]
      }
    }

    onFiltersChange({ ...filters, categories: newCategories, checkCodes: newCheckCodes })
  }

  const handleExpandCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    )
  }

  const handleUtilizationChange = (level: CalendarFilters['utilizationLevel']) => {
    onFiltersChange({ ...filters, utilizationLevel: level })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      categories: [],
      checkCodes: [],
      utilizationLevel: 'all',
      priorityRange: [1, 10],
    })
    setExpandedCategories([])
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
            const hasCheckTypes = CATEGORIES_WITH_CHECK_TYPES.includes(category.id)
            const isExpanded = expandedCategories.includes(category.id)
            const checkTypes = hasCheckTypes ? getCheckTypesForCategory(category.id) : []

            return (
              <div key={category.id} className="space-y-1">
                <div
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* Expand/collapse button for categories with check types */}
                    {hasCheckTypes ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExpandCategory(category.id)
                        }}
                        className="text-muted-foreground hover:text-foreground -ml-1 p-0.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      <span className="w-3" />
                    )}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                      id={`cat-${category.id}`}
                    />
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <Label
                      htmlFor={`cat-${category.id}`}
                      className={cn('cursor-pointer text-sm', isSelected && 'font-medium')}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      {category.label}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>

                {/* Expandable check types */}
                {hasCheckTypes && isExpanded && (
                  <div className="border-muted ml-6 space-y-1 border-l-2 pl-3">
                    {checkTypes.map((checkType) => {
                      const isCheckSelected = filters.checkCodes.includes(checkType.checkCode)
                      return (
                        <div
                          key={checkType.checkCode}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                            isCheckSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                          )}
                          onClick={() => handleCheckCodeToggle(checkType.checkCode, category.id)}
                        >
                          <Checkbox
                            checked={isCheckSelected}
                            onCheckedChange={() =>
                              handleCheckCodeToggle(checkType.checkCode, category.id)
                            }
                            id={`check-${checkType.checkCode}`}
                          />
                          <Label
                            htmlFor={`check-${checkType.checkCode}`}
                            className={cn(
                              'text-muted-foreground cursor-pointer text-xs',
                              isCheckSelected && 'text-foreground font-medium'
                            )}
                          >
                            {checkType.label}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {filters.categories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({ ...filters, categories: [], checkCodes: [] })}
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

      {/* Quick Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => handleUtilizationChange('high')}
        >
          <AlertTriangle className="mr-2 h-3 w-3 text-[var(--color-status-high)]" />
          Show High Risk Only
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => handleUtilizationChange('low')}
        >
          <CheckCircle className="mr-2 h-3 w-3 text-[var(--color-status-low)]" />
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
  checkCodes: [],
  utilizationLevel: 'all',
  priorityRange: [1, 10],
}
