/**
 * Crew Impact Analysis Component
 * Displays crew requirements vs available pilots with shortage warnings
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface CrewImpactAnalysisProps {
  impactData: {
    monthly: Array<{
      month: string
      availableCaptains: number
      availableFirstOfficers: number
      requiredCaptains: number
      requiredFirstOfficers: number
      captainShortage: number
      firstOfficerShortage: number
      captainUtilization: number
      firstOfficerUtilization: number
      warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
    }>
    warnings: Array<{
      month: string
      rank: string
      severity: 'warning' | 'critical'
      message: string
      shortage: number
    }>
    summary: {
      totalWarnings: number
      criticalMonths: number
      averageCaptainUtilization: number
      averageFirstOfficerUtilization: number
    }
  }
}

/**
 * Server Component that displays crew impact analysis
 * Shows warnings and capacity utilization with color coding
 */
export function CrewImpactAnalysis({
  impactData
}: CrewImpactAnalysisProps) {
  const { warnings, summary } = impactData

  // Get utilization color class
  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 100) return 'bg-red-500'
    if (utilization >= 85) return 'bg-orange-500'
    if (utilization >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Get utilization text color
  const getUtilizationTextColor = (utilization: number): string => {
    if (utilization >= 100) return 'text-red-900'
    if (utilization >= 85) return 'text-orange-900'
    if (utilization >= 75) return 'text-yellow-900'
    return 'text-green-900'
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">Crew Impact Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Retirement impact on crew availability and capacity
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Warnings</div>
              <div className="text-2xl font-bold text-foreground">{summary.totalWarnings}</div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Critical Months</div>
              <div className="text-2xl font-bold text-red-600">{summary.criticalMonths}</div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Avg Utilization</div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round((summary.averageCaptainUtilization + summary.averageFirstOfficerUtilization) / 2)}%
              </div>
            </div>
          </div>

          {/* Capacity Utilization Bars */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-foreground">Current Capacity Utilization</div>

            {/* Captains Utilization */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Captains</span>
                <span className={`text-sm font-medium ${getUtilizationTextColor(summary.averageCaptainUtilization)}`}>
                  {summary.averageCaptainUtilization}%
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getUtilizationColor(summary.averageCaptainUtilization)} transition-all duration-300`}
                  style={{ width: `${Math.min(summary.averageCaptainUtilization, 100)}%` }}
                />
              </div>
            </div>

            {/* First Officers Utilization */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">First Officers</span>
                <span className={`text-sm font-medium ${getUtilizationTextColor(summary.averageFirstOfficerUtilization)}`}>
                  {summary.averageFirstOfficerUtilization}%
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getUtilizationColor(summary.averageFirstOfficerUtilization)} transition-all duration-300`}
                  style={{ width: `${Math.min(summary.averageFirstOfficerUtilization, 100)}%` }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>&lt;75%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span>75-85%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span>85-100%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>&gt;100%</span>
              </div>
            </div>
          </div>

          {/* Warnings Section */}
          {warnings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-foreground">Warnings</span>
              </div>

              <div className="space-y-3">
                {warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-4 ${
                      warning.severity === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {warning.severity === 'critical' ? (
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={warning.severity === 'critical' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {warning.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                          </Badge>
                          <span className={`text-xs font-medium ${
                            warning.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
                          }`}>
                            {warning.month}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{warning.rank}</span>
                        </div>
                        <p className={`text-sm ${
                          warning.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          {warning.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Warnings Message */}
          {warnings.length === 0 && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">All Clear</span>
              </div>
              <p className="text-sm text-green-600">
                No crew shortages detected for the forecast period
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
