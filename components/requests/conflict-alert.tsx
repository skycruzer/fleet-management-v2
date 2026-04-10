/**
 * Conflict Alert Component
 *
 * Displays conflict warnings and errors for pilot requests.
 * Shows detailed conflict information with severity indicators.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react'
import type { Conflict, ConflictSeverity } from '@/lib/services/conflict-detection-service'

// ============================================================================
// Type Definitions
// ============================================================================

export interface ConflictAlertProps {
  /**
   * List of conflicts to display
   */
  conflicts: Conflict[]

  /**
   * Optional warnings to display
   */
  warnings?: string[]

  /**
   * Show crew impact summary
   */
  crewImpact?: {
    captainsBefore: number
    captainsAfter: number
    firstOfficersBefore: number
    firstOfficersAfter: number
    belowMinimum: boolean
  }

  /**
   * Custom className
   */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function ConflictAlert({
  conflicts,
  warnings = [],
  crewImpact,
  className = '',
}: ConflictAlertProps) {
  if (conflicts.length === 0 && warnings.length === 0) {
    return null
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getSeverityConfig = (severity: ConflictSeverity) => {
    const configs = {
      LOW: {
        variant: 'default' as const,
        icon: Info,
        iconColor: 'text-[var(--color-info)]',
        bgColor: 'bg-[var(--color-info-bg)]',
        borderColor: 'border-[var(--color-info-border)]',
      },
      MEDIUM: {
        variant: 'default' as const,
        icon: AlertCircle,
        iconColor: 'text-[var(--color-status-medium)]',
        bgColor: 'bg-[var(--color-status-medium-bg)]',
        borderColor: 'border-[var(--color-status-medium-border)]',
      },
      HIGH: {
        variant: 'default' as const,
        icon: AlertTriangle,
        iconColor: 'text-[var(--color-status-medium)]',
        bgColor: 'bg-[var(--color-status-medium-bg)]',
        borderColor: 'border-[var(--color-status-medium-border)]',
      },
      CRITICAL: {
        variant: 'destructive' as const,
        icon: XCircle,
        iconColor: 'text-[var(--color-status-high)]',
        bgColor: 'bg-[var(--color-status-high-bg)]',
        borderColor: 'border-[var(--color-status-high-border)]',
      },
    }

    return configs[severity]
  }

  const getConflictTypeLabel = (type: Conflict['type']) => {
    const labels = {
      OVERLAPPING_REQUEST: 'Overlapping Request',
      CREW_BELOW_MINIMUM: 'Crew Below Minimum',
      MULTIPLE_PENDING: 'Multiple Pending Requests',
      DUPLICATE_REQUEST: 'Duplicate Request',
    }

    return labels[type]
  }

  // Group conflicts by severity
  const criticalConflicts = conflicts.filter((c) => c.severity === 'CRITICAL')
  const highConflicts = conflicts.filter((c) => c.severity === 'HIGH')
  const mediumConflicts = conflicts.filter((c) => c.severity === 'MEDIUM')
  const lowConflicts = conflicts.filter((c) => c.severity === 'LOW')

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Critical Conflicts */}
      {criticalConflicts.map((conflict, index) => {
        const config = getSeverityConfig(conflict.severity)
        const Icon = config.icon

        return (
          <Alert
            key={`critical-${index}`}
            variant={config.variant}
            className={`${config.bgColor} ${config.borderColor} border-2`}
          >
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            <AlertTitle className="flex items-center gap-2">
              {getConflictTypeLabel(conflict.type)}
              <Badge variant="destructive" className="ml-2">
                CRITICAL
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="font-medium">{conflict.message}</p>
              {conflict.details && Object.keys(conflict.details).length > 0 && (
                <div className="mt-3 space-y-1 text-sm">
                  {Object.entries(conflict.details).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )
      })}

      {/* High Severity Conflicts */}
      {highConflicts.map((conflict, index) => {
        const config = getSeverityConfig(conflict.severity)
        const Icon = config.icon

        return (
          <Alert
            key={`high-${index}`}
            variant={config.variant}
            className={`${config.bgColor} ${config.borderColor}`}
          >
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
            <AlertTitle className="flex items-center gap-2">
              {getConflictTypeLabel(conflict.type)}
              <Badge
                variant="secondary"
                className="ml-2 bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]"
              >
                HIGH
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p>{conflict.message}</p>
            </AlertDescription>
          </Alert>
        )
      })}

      {/* Medium Severity Conflicts */}
      {mediumConflicts.map((conflict, index) => {
        const config = getSeverityConfig(conflict.severity)
        const Icon = config.icon

        return (
          <Alert
            key={`medium-${index}`}
            variant={config.variant}
            className={`${config.bgColor} ${config.borderColor}`}
          >
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
            <AlertTitle className="flex items-center gap-2">
              {getConflictTypeLabel(conflict.type)}
              <Badge
                variant="secondary"
                className="ml-2 bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]"
              >
                WARNING
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p>{conflict.message}</p>
            </AlertDescription>
          </Alert>
        )
      })}

      {/* Low Severity Conflicts */}
      {lowConflicts.map((conflict, index) => {
        const config = getSeverityConfig(conflict.severity)
        const Icon = config.icon

        return (
          <Alert
            key={`low-${index}`}
            variant={config.variant}
            className={`${config.bgColor} ${config.borderColor}`}
          >
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
            <AlertTitle className="flex items-center gap-2">
              {getConflictTypeLabel(conflict.type)}
              <Badge variant="outline" className="ml-2">
                INFO
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p>{conflict.message}</p>
            </AlertDescription>
          </Alert>
        )
      })}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert
          variant="default"
          className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)]"
        >
          <AlertCircle className="h-4 w-4 text-[var(--color-status-medium)]" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Crew Impact Summary */}
      {crewImpact && (
        <Alert
          variant={crewImpact.belowMinimum ? 'destructive' : 'default'}
          className={
            crewImpact.belowMinimum
              ? 'border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]'
              : 'border-[var(--color-info-border)] bg-[var(--color-info-bg)]'
          }
        >
          <Info className="h-4 w-4" />
          <AlertTitle>Crew Availability Impact</AlertTitle>
          <AlertDescription>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Captains</p>
                <p className="text-sm">Before: {crewImpact.captainsBefore} available</p>
                <p className="text-sm">
                  After: {crewImpact.captainsAfter} available
                  {crewImpact.captainsAfter < 10 && (
                    <span className="ml-2 font-bold text-[var(--color-status-high)]">
                      ⚠️ Below minimum (10)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium">First Officers</p>
                <p className="text-sm">Before: {crewImpact.firstOfficersBefore} available</p>
                <p className="text-sm">
                  After: {crewImpact.firstOfficersAfter} available
                  {crewImpact.firstOfficersAfter < 10 && (
                    <span className="ml-2 font-bold text-[var(--color-status-high)]">
                      ⚠️ Below minimum (10)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
