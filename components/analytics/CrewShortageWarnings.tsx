/**
 * Crew Shortage Warnings Component
 * Displays critical crew shortage predictions and recommendations
 *
 * Features:
 * - Critical period warnings with severity indicators
 * - Actionable recommendations with priority levels
 * - Summary statistics
 * - Visual timeline of shortage periods
 * - Color-coded severity (high/critical)
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, TrendingUp, CheckCircle2, Calendar } from 'lucide-react'

interface CrewShortageWarningsProps {
  criticalPeriods: Array<{
    startMonth: string
    endMonth: string
    severity: 'high' | 'critical'
    captainShortage: number
    firstOfficerShortage: number
    impactDescription: string
  }>
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium'
    action: string
    timeline: string
    impact: string
  }>
  summary: {
    totalCriticalMonths: number
    worstCaseShortage: number
    timeToFirstShortage: number | null
  }
}

/**
 * Get badge variant based on severity
 */
function getSeverityBadgeClasses(severity: 'high' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300'
  }
}

/**
 * Get priority badge classes
 */
function getPriorityBadgeClasses(priority: 'immediate' | 'high' | 'medium'): string {
  switch (priority) {
    case 'immediate':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }
}

/**
 * Client Component for displaying crew shortage warnings and recommendations
 */
export function CrewShortageWarnings({
  criticalPeriods,
  recommendations,
  summary,
}: CrewShortageWarningsProps) {
  const hasShortages = criticalPeriods.length > 0

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasShortages ? (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            <h3 className="text-lg font-semibold text-foreground">Crew Shortage Analysis</h3>
          </div>
          <Badge variant={hasShortages ? 'destructive' : 'default'}>
            {hasShortages ? 'Action Required' : 'All Clear'}
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`rounded-lg border p-3 ${
              summary.totalCriticalMonths > 0
                ? 'border-orange-200 bg-orange-50'
                : 'border-green-200 bg-green-50'
            }`}
          >
            <p
              className={`text-xs font-medium ${
                summary.totalCriticalMonths > 0 ? 'text-orange-700' : 'text-green-700'
              }`}
            >
              Critical Periods
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.totalCriticalMonths > 0 ? 'text-orange-900' : 'text-green-900'
              }`}
            >
              {summary.totalCriticalMonths}
            </p>
          </div>

          <div
            className={`rounded-lg border p-3 ${
              summary.worstCaseShortage > 0
                ? 'border-red-200 bg-red-50'
                : 'border-green-200 bg-green-50'
            }`}
          >
            <p
              className={`text-xs font-medium ${
                summary.worstCaseShortage > 0 ? 'text-red-700' : 'text-green-700'
              }`}
            >
              Worst Case Shortage
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.worstCaseShortage > 0 ? 'text-red-900' : 'text-green-900'
              }`}
            >
              {summary.worstCaseShortage}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-700">Time to First Shortage</p>
            <p className="text-2xl font-bold text-blue-900">
              {summary.timeToFirstShortage !== null
                ? `${summary.timeToFirstShortage} mo`
                : 'None'}
            </p>
          </div>
        </div>
      </Card>

      {/* Critical Periods */}
      {hasShortages && (
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <h4 className="text-base font-semibold text-foreground">
              Critical Shortage Periods ({criticalPeriods.length})
            </h4>
          </div>

          <div className="space-y-3">
            {criticalPeriods.map((period, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${
                  period.severity === 'critical'
                    ? 'border-red-300 bg-red-50'
                    : 'border-orange-300 bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle
                      className={`h-4 w-4 ${
                        period.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                      }`}
                    />
                    <span className="font-semibold text-sm text-foreground">
                      {period.startMonth} - {period.endMonth}
                    </span>
                  </div>
                  <Badge className={getSeverityBadgeClasses(period.severity)}>
                    {period.severity.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-2">{period.impactDescription}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Captain Shortage:</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {period.captainShortage}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">FO Shortage:</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {period.firstOfficerShortage}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h4 className="text-base font-semibold text-foreground">
              Recommended Actions ({recommendations.length})
            </h4>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getPriorityBadgeClasses(rec.priority)}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">{rec.action}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Timeline:</span>
                    <p className="text-xs font-medium text-foreground">{rec.timeline}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Impact:</span>
                    <p className="text-xs font-medium text-foreground">{rec.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Shortages Message */}
      {!hasShortages && (
        <Card className="p-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-green-900 mb-2">
              No Crew Shortages Predicted
            </h4>
            <p className="text-sm text-green-700">
              Based on current retirement projections and minimum crew requirements, no critical
              shortages are expected in the next 5 years.
            </p>
            <p className="text-xs text-green-600 mt-2">
              Continue monitoring succession planning and recruitment to maintain adequate staffing
              levels.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
