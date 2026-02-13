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
    id: 'Flight Checks',
    label: 'Flight',
    icon: Plane,
    color: 'text-[var(--color-category-flight)]',
    bgColor: 'bg-[var(--color-category-flight-bg)]',
    borderColor: 'border-[var(--color-category-flight)]/30',
    progressColor: 'bg-[var(--color-category-flight)]',
    capacityPerPeriod: 4,
  },
  {
    id: 'Simulator Checks',
    label: 'Simulator',
    icon: Monitor,
    color: 'text-[var(--color-category-simulator)]',
    bgColor: 'bg-[var(--color-category-simulator-bg)]',
    borderColor: 'border-[var(--color-category-simulator)]/30',
    progressColor: 'bg-[var(--color-category-simulator)]',
    capacityPerPeriod: 6,
  },
  {
    id: 'Ground Courses Refresher',
    label: 'Ground',
    icon: GraduationCap,
    color: 'text-[var(--color-category-ground)]',
    bgColor: 'bg-[var(--color-category-ground-bg)]',
    borderColor: 'border-[var(--color-category-ground)]/30',
    progressColor: 'bg-[var(--color-category-ground)]',
    capacityPerPeriod: 8,
  },
]

function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'text-[var(--color-status-high)]'
  if (utilization > 60) return 'text-[var(--color-status-medium)]'
  return 'text-[var(--color-status-low)]'
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
      <Card className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[var(--color-status-high)]" />
          <div>
            <p className="font-medium text-[var(--color-status-high-foreground)]">Preview Error</p>
            <p className="text-sm text-[var(--color-status-high-foreground)]">{error}</p>
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
              <strong className="text-[var(--color-info)]">{preview.periodsAffected}</strong>{' '}
              periods
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
                        cat.utilization > 80 &&
                          'border-[var(--color-status-high-border)] text-[var(--color-status-high)]',
                        cat.utilization > 60 &&
                          cat.utilization <= 80 &&
                          'border-[var(--color-status-medium-border)] text-[var(--color-status-medium)]',
                        cat.utilization <= 60 &&
                          'border-[var(--color-status-low-border)] text-[var(--color-status-low)]'
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
                        cat.utilization > 80 && 'bg-[var(--color-status-high)]',
                        cat.utilization > 60 &&
                          cat.utilization <= 80 &&
                          'bg-[var(--color-status-medium)]',
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
        <Card className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-status-high-foreground)]">
            <AlertCircle className="h-4 w-4" />
            Critical Capacity Issues
          </h3>
          <div className="space-y-1.5">
            {criticalWarnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 text-xs text-[var(--color-status-high-foreground)]"
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
        <Card className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-status-medium-foreground)]">
            <AlertTriangle className="h-4 w-4" />
            Capacity Warnings ({regularWarnings.length})
          </h3>
          <div className="space-y-1.5">
            {regularWarnings.slice(0, 3).map((warning, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 text-xs text-[var(--color-status-medium-foreground)]"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>
                  <strong>{warning.rosterPeriod}:</strong> {warning.message}
                </span>
              </div>
            ))}
            {regularWarnings.length > 3 && (
              <p className="text-xs text-[var(--color-status-medium)] italic">
                +{regularWarnings.length - 3} more warnings...
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Conflict Detection */}
      {preview.conflicts && preview.conflicts.length > 0 && (
        <Card className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-status-medium-foreground)]">
            <AlertTriangle className="h-4 w-4" />
            Scheduling Conflicts ({preview.conflicts.length})
          </h3>
          <div className="space-y-1">
            {preview.conflicts.slice(0, 3).map((conflict) => (
              <div
                key={conflict.pilotId}
                className="text-xs text-[var(--color-status-medium-foreground)]"
              >
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
          <Card className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-[var(--color-status-low)]" />
              <span className="text-xs font-medium text-[var(--color-status-low-foreground)]">
                Configuration looks good - ready to generate {preview.totalPlans} renewals!
              </span>
            </div>
          </Card>
        )}
    </div>
  )
}
