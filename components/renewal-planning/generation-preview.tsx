/**
 * Generation Preview Component
 *
 * Shows real-time preview of renewal generation results
 * before actually committing to the database.
 *
 * CATEGORY-CENTRIC Organization:
 * - Primary view is organized BY CATEGORY
 * - Each category shows renewals, capacity, utilization
 * - Period distribution and pilots grouped by category
 */

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Calendar,
  AlertCircle,
  Stethoscope,
  Plane,
  Monitor,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewData {
  totalPlans: number
  periodsAffected: number
  avgUtilization: number
  distribution: Array<{
    rosterPeriod: string
    periodStart: string
    periodEnd: string
    plannedCount: number
    totalCapacity: number
    utilization: number
  }>
  warnings: Array<{
    rosterPeriod: string
    message: string
    severity: 'warning' | 'critical'
  }>
  categoryBreakdown: Record<string, number>
  pilots?: Array<{
    id: string
    name: string
    category: string
    expiryDate: string
    priority: number
  }>
  conflicts?: Array<{
    pilotId: string
    pilotName: string
    renewals: Array<{ category: string; period: string }>
  }>
}

interface GenerationPreviewProps {
  monthsAhead: number
  categories: string[]
  enabled: boolean
}

const CATEGORIES = [
  {
    id: 'Pilot Medical',
    label: 'Medical',
    icon: Stethoscope,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    progressColor: 'bg-red-500',
    capacityPerPeriod: 4,
  },
  {
    id: 'Flight Checks',
    label: 'Flight',
    icon: Plane,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    progressColor: 'bg-blue-500',
    capacityPerPeriod: 4,
  },
  {
    id: 'Simulator Checks',
    label: 'Simulator',
    icon: Monitor,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    progressColor: 'bg-purple-500',
    capacityPerPeriod: 6,
  },
  {
    id: 'Ground Courses Refresher',
    label: 'Ground',
    icon: GraduationCap,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    progressColor: 'bg-green-500',
    capacityPerPeriod: 8,
  },
]

function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'text-red-600'
  if (utilization > 60) return 'text-yellow-600'
  return 'text-green-600'
}

export function GenerationPreview({ monthsAhead, categories, enabled }: GenerationPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setPreview(null)
      return
    }

    const fetchPreview = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/renewal-planning/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            monthsAhead,
            categories: categories.length > 0 ? categories : undefined,
          }),
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch preview')
        }

        const result = await response.json()
        if (result.success && result.data) {
          setPreview(result.data)
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    // Debounce the preview fetch
    const timeoutId = setTimeout(fetchPreview, 500)
    return () => clearTimeout(timeoutId)
  }, [monthsAhead, categories, enabled])

  if (!enabled) {
    return (
      <Card className="p-6">
        <div className="text-muted-foreground text-center">
          <BarChart3 className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Preview will appear when configuration is ready</p>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="text-primary mb-2 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Calculating preview...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6 dark:bg-red-950/30">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-200">Preview Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!preview) {
    return null
  }

  const criticalWarnings = preview.warnings.filter((w) => w.severity === 'critical')
  const regularWarnings = preview.warnings.filter((w) => w.severity === 'warning')

  // Calculate category data
  const categoryData = CATEGORIES.map((cat) => {
    const count = preview.categoryBreakdown[cat.id] || 0
    const capacity = preview.periodsAffected * cat.capacityPerPeriod
    const utilization = capacity > 0 ? (count / capacity) * 100 : 0
    const pilots = preview.pilots?.filter((p) => p.category === cat.id) || []

    return {
      ...cat,
      count,
      capacity,
      utilization,
      pilots,
    }
  })

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Preview Summary</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              <strong className="text-primary">{preview.totalPlans}</strong> renewals
            </span>
            <span>
              <strong className="text-purple-600">{preview.periodsAffected}</strong> periods
            </span>
            <span className={getUtilizationColor(preview.avgUtilization)}>
              <strong>{Math.round(preview.avgUtilization)}%</strong> avg util
            </span>
          </div>
        </div>
      </Card>

      {/* Category Cards - Primary Organization */}
      <div className="space-y-3">
        <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4" />
          By Category
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {categoryData.map((cat) => {
            const Icon = cat.icon
            const isExpanded = expandedCategory === cat.id

            return (
              <Card
                key={cat.id}
                className={cn(
                  'overflow-hidden transition-all',
                  cat.borderColor,
                  cat.count > 0 && cat.bgColor
                )}
              >
                {/* Category Header */}
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-background rounded-lg p-2 shadow-sm">
                      <Icon className={cn('h-5 w-5', cat.color)} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{cat.label}</h4>
                      <p className="text-muted-foreground text-xs">
                        {cat.count} / {cat.capacity} capacity
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        cat.utilization > 80 && 'border-red-300 text-red-600',
                        cat.utilization > 60 &&
                          cat.utilization <= 80 &&
                          'border-yellow-300 text-yellow-600',
                        cat.utilization <= 60 && 'border-green-300 text-green-600'
                      )}
                    >
                      {Math.round(cat.utilization)}%
                    </Badge>
                    {cat.pilots.length > 0 &&
                      (isExpanded ? (
                        <ChevronUp className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <ChevronDown className="text-muted-foreground h-4 w-4" />
                      ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4 pb-2">
                  <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        cat.utilization > 80 && 'bg-red-500',
                        cat.utilization > 60 && cat.utilization <= 80 && 'bg-yellow-500',
                        cat.utilization <= 60 && cat.progressColor
                      )}
                      style={{ width: `${Math.min(cat.utilization, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Pilot List */}
                {isExpanded && cat.pilots.length > 0 && (
                  <div className="border-t px-4 py-3">
                    <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium">
                      <Users className="h-3 w-3" />
                      Pilots ({cat.pilots.length})
                    </div>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {cat.pilots.slice(0, 8).map((pilot) => (
                        <div key={pilot.id} className="flex items-center justify-between text-xs">
                          <span className="font-medium">{pilot.name}</span>
                          <span className="text-muted-foreground">Exp: {pilot.expiryDate}</span>
                        </div>
                      ))}
                      {cat.pilots.length > 8 && (
                        <p className="text-muted-foreground text-xs italic">
                          +{cat.pilots.length - 8} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Critical Warnings */}
      {criticalWarnings.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-4 dark:bg-red-950/30">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-200">
            <AlertCircle className="h-4 w-4" />
            Critical Capacity Issues
          </h3>
          <div className="space-y-1.5">
            {criticalWarnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 text-xs text-red-700 dark:text-red-300"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>
                  <strong>{warning.rosterPeriod}:</strong> {warning.message}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Regular Warnings */}
      {regularWarnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 p-4 dark:bg-yellow-950/30">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-900 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            Capacity Warnings ({regularWarnings.length})
          </h3>
          <div className="space-y-1.5">
            {regularWarnings.slice(0, 3).map((warning, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 text-xs text-yellow-700 dark:text-yellow-300"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>
                  <strong>{warning.rosterPeriod}:</strong> {warning.message}
                </span>
              </div>
            ))}
            {regularWarnings.length > 3 && (
              <p className="text-xs text-yellow-600 italic dark:text-yellow-400">
                +{regularWarnings.length - 3} more warnings...
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Conflict Detection */}
      {preview.conflicts && preview.conflicts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 p-4 dark:bg-orange-950/30">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-900 dark:text-orange-200">
            <AlertTriangle className="h-4 w-4" />
            Scheduling Conflicts ({preview.conflicts.length})
          </h3>
          <div className="space-y-1">
            {preview.conflicts.slice(0, 3).map((conflict) => (
              <div key={conflict.pilotId} className="text-xs text-orange-700 dark:text-orange-300">
                <strong>{conflict.pilotName}</strong>: {conflict.renewals.length} renewals in same
                period
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ready Indicator */}
      {preview.totalPlans > 0 &&
        criticalWarnings.length === 0 &&
        (!preview.conflicts || preview.conflicts.length === 0) && (
          <Card className="border-green-200 bg-green-50 p-3 dark:bg-green-950/30">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-900 dark:text-green-200">
                Configuration looks good - ready to generate {preview.totalPlans} renewals!
              </span>
            </div>
          </Card>
        )}
    </div>
  )
}
