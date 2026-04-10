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
      return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)] border-[var(--color-status-high-border)]'
    case 'high':
      return 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] border-[var(--color-status-medium-border)]'
  }
}

/**
 * Get priority badge classes
 */
function getPriorityBadgeClasses(priority: 'immediate' | 'high' | 'medium'): string {
  switch (priority) {
    case 'immediate':
      return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)] border-[var(--color-status-high-border)]'
    case 'high':
      return 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] border-[var(--color-status-medium-border)]'
    case 'medium':
      return 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] border-[var(--color-status-medium-border)]'
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
              <AlertTriangle className="h-5 w-5 text-[var(--color-status-medium)]" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-[var(--color-status-low)]" />
            )}
            <h3 className="text-foreground text-lg font-semibold">Crew Shortage Analysis</h3>
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
                ? 'border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)]'
                : 'border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]'
            }`}
          >
            <p
              className={`text-xs font-medium ${
                summary.totalCriticalMonths > 0
                  ? 'text-[var(--color-status-medium)]'
                  : 'text-[var(--color-status-low)]'
              }`}
            >
              Critical Periods
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.totalCriticalMonths > 0
                  ? 'text-[var(--color-status-medium)]'
                  : 'text-[var(--color-status-low)]'
              }`}
            >
              {summary.totalCriticalMonths}
            </p>
          </div>

          <div
            className={`rounded-lg border p-3 ${
              summary.worstCaseShortage > 0
                ? 'border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]'
                : 'border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]'
            }`}
          >
            <p
              className={`text-xs font-medium ${
                summary.worstCaseShortage > 0
                  ? 'text-[var(--color-status-high)]'
                  : 'text-[var(--color-status-low)]'
              }`}
            >
              Worst Case Shortage
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.worstCaseShortage > 0
                  ? 'text-[var(--color-status-high)]'
                  : 'text-[var(--color-status-low)]'
              }`}
            >
              {summary.worstCaseShortage}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3">
            <p className="text-xs font-medium text-[var(--color-info)]">Time to First Shortage</p>
            <p className="text-foreground text-2xl font-bold">
              {summary.timeToFirstShortage !== null ? `${summary.timeToFirstShortage} mo` : 'None'}
            </p>
          </div>
        </div>
      </Card>

      {/* Critical Periods */}
      {hasShortages && (
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[var(--color-status-medium)]" />
            <h4 className="text-foreground text-base font-semibold">
              Critical Shortage Periods ({criticalPeriods.length})
            </h4>
          </div>

          <div className="space-y-3">
            {criticalPeriods.map((period, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${
                  period.severity === 'critical'
                    ? 'border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]'
                    : 'border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)]'
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle
                      className={`h-4 w-4 ${
                        period.severity === 'critical'
                          ? 'text-[var(--color-status-high)]'
                          : 'text-[var(--color-status-medium)]'
                      }`}
                    />
                    <span className="text-foreground text-sm font-semibold">
                      {period.startMonth} - {period.endMonth}
                    </span>
                  </div>
                  <Badge className={getSeverityBadgeClasses(period.severity)}>
                    {period.severity.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-muted-foreground mb-2 text-xs">{period.impactDescription}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-xs">Captain Shortage:</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {period.captainShortage}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-xs">FO Shortage:</span>
                    <Badge variant="outline" className="font-mono text-xs">
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
            <TrendingUp className="h-5 w-5 text-[var(--color-info)]" />
            <h4 className="text-foreground text-base font-semibold">
              Recommended Actions ({recommendations.length})
            </h4>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="space-y-2 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center space-x-2">
                      <Badge className={getPriorityBadgeClasses(rec.priority)}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <span className="text-foreground text-sm font-semibold">{rec.action}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground text-xs">Timeline:</span>
                    <p className="text-foreground text-xs font-medium">{rec.timeline}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Impact:</span>
                    <p className="text-foreground text-xs font-medium">{rec.impact}</p>
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
          <div className="rounded-lg border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-[var(--color-status-low)]" />
            <h4 className="text-foreground mb-2 text-base font-semibold">
              No Crew Shortages Predicted
            </h4>
            <p className="text-sm text-[var(--color-status-low)]">
              Based on current retirement projections and minimum crew requirements, no critical
              shortages are expected in the next 5 years.
            </p>
            <p className="mt-2 text-xs text-[var(--color-status-low)]">
              Continue monitoring succession planning and recruitment to maintain adequate staffing
              levels.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
