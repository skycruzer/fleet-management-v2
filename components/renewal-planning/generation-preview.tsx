'use client'

/**
 * Generation Preview Component
 * Author: Maurice Rondeau
 * Date: December 19, 2025
 *
 * Shows real-time preview of renewal generation results
 * before actually committing to the database.
 *
 * Features:
 * - Live preview as configuration changes
 * - Distribution chart visualization
 * - Capacity warnings
 * - Total statistics
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react'
import { getUtilizationStatus, getUtilizationColorClass } from '@/lib/utils/category-capacity-utils'

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
}

interface GenerationPreviewProps {
  monthsAhead: number
  categories: string[]
  enabled: boolean
}

export function GenerationPreview({ monthsAhead, categories, enabled }: GenerationPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      <Card className="border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Preview Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!preview) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 font-semibold">Preview Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-primary text-3xl font-bold">{preview.totalPlans}</p>
            <p className="text-muted-foreground text-xs">Total Renewals</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-3xl font-bold">{preview.periodsAffected}</p>
            <p className="text-muted-foreground text-xs">Periods Affected</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-3xl font-bold">{Math.round(preview.avgUtilization)}%</p>
            <p className="text-muted-foreground text-xs">Avg Utilization</p>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      {preview.categoryBreakdown && Object.keys(preview.categoryBreakdown).length > 0 && (
        <Card className="p-6">
          <h3 className="text-foreground mb-3 font-semibold">By Category</h3>
          <div className="space-y-2">
            {Object.entries(preview.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Warnings */}
      {preview.warnings && preview.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <h3 className="mb-3 font-semibold text-yellow-900">Capacity Warnings</h3>
          <div className="space-y-2">
            {preview.warnings.map((warning, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 text-sm ${
                  warning.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>{warning.rosterPeriod}:</strong> {warning.message}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Distribution Preview */}
      {preview.distribution && preview.distribution.length > 0 && (
        <Card className="p-6">
          <h3 className="text-foreground mb-4 font-semibold">Period Distribution</h3>
          <div className="space-y-3">
            {preview.distribution.slice(0, 6).map((period) => {
              const utilizationStatus = getUtilizationStatus(period.utilization)
              const colorClass = getUtilizationColorClass(period.utilization)

              return (
                <div key={period.rosterPeriod} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{period.rosterPeriod}</span>
                    <span className="text-muted-foreground">
                      {period.plannedCount} / {period.totalCapacity}
                    </span>
                  </div>
                  <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full transition-all ${colorClass}`}
                      style={{ width: `${Math.min(period.utilization, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {preview.distribution.length > 6 && (
              <p className="text-muted-foreground text-center text-xs">
                +{preview.distribution.length - 6} more periods
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Ready Indicator */}
      {preview.totalPlans > 0 && preview.warnings.length === 0 && (
        <Card className="border-green-200 bg-green-50 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Configuration looks good - ready to generate!
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
