'use client'

/**
 * Deadline Widget Component
 *
 * Displays upcoming roster period deadlines with countdown timers,
 * request statistics, and urgency indicators.
 *
 * Author: Maurice Rondeau
 * Date: November 11, 2025
 */

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// Types
// ============================================================================

interface DeadlineAlert {
  rosterPeriod: {
    code: string
    startDate: string
    endDate: string
    deadlineDate: string
    status: string
  }
  daysUntilDeadline: number
  milestone: number
  pendingCount: number
  submittedCount: number
  approvedCount: number
  deniedCount: number

  // Category-specific breakdowns
  leaveRequestsCount: number
  flightRequestsCount: number
  leavePendingCount: number
  flightPendingCount: number
  leaveApprovedCount: number
  flightApprovedCount: number
}

interface DeadlineWidgetProps {
  /**
   * Maximum number of periods to display (default: 3)
   */
  maxPeriods?: number

  /**
   * Callback when user clicks "Review Requests" button
   */
  onReviewClick?: (rosterPeriodCode: string) => void

  /**
   * Whether to show compact view (default: false)
   */
  compact?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function DeadlineWidget({
  maxPeriods = 3,
  onReviewClick,
  compact = false,
}: DeadlineWidgetProps) {
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch deadline alerts
  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true)
        const response = await fetch('/api/deadline-alerts')
        const data = await response.json()

        if (data.success) {
          setAlerts(data.data.slice(0, maxPeriods))
        } else {
          setError(data.error || 'Failed to load deadline alerts')
        }
      } catch (err) {
        setError('Failed to fetch deadline alerts')
        console.error('DeadlineWidget fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()

    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [maxPeriods])

  // Get urgency color
  function getUrgencyColor(daysUntilDeadline: number): string {
    if (daysUntilDeadline <= 0)
      return 'text-[var(--color-status-high)] bg-[var(--color-status-high-bg)]'
    if (daysUntilDeadline <= 3)
      return 'text-[var(--color-status-high)] bg-[var(--color-status-high-bg)]'
    if (daysUntilDeadline <= 7)
      return 'text-[var(--color-status-medium)] bg-[var(--color-status-medium-bg)]'
    return 'text-[var(--color-info)] bg-[var(--color-info-bg)]'
  }

  // Get urgency badge variant
  function getUrgencyVariant(
    daysUntilDeadline: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (daysUntilDeadline <= 0) return 'destructive'
    if (daysUntilDeadline <= 3) return 'destructive'
    if (daysUntilDeadline <= 7) return 'secondary'
    return 'outline'
  }

  // Get urgency label
  function getUrgencyLabel(daysUntilDeadline: number): string {
    if (daysUntilDeadline === 0) return 'DEADLINE TODAY'
    if (daysUntilDeadline === 1) return 'DEADLINE TOMORROW'
    if (daysUntilDeadline < 0) return 'OVERDUE'
    return `${daysUntilDeadline} days remaining`
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roster Deadlines</CardTitle>
          <CardDescription>Upcoming request deadlines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roster Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-[var(--color-status-high)]">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roster Deadlines</CardTitle>
          <CardDescription>No upcoming deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <p>All deadlines are up to date</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact view
  if (compact) {
    const nextAlert = alerts[0]
    if (!nextAlert) return null

    return (
      <Card className={getUrgencyColor(nextAlert.daysUntilDeadline)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{nextAlert.rosterPeriod.code}</p>
              <p className="text-sm">{getUrgencyLabel(nextAlert.daysUntilDeadline)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{nextAlert.pendingCount}</p>
              <p className="text-xs">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Roster Deadlines
            </CardTitle>
            <CardDescription>Upcoming request deadlines</CardDescription>
          </div>
          {alerts.some((a) => a.daysUntilDeadline <= 3) && (
            <Badge variant="destructive" className="animate-pulse">
              Urgent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.rosterPeriod.code}
            className="rounded-lg border p-4 transition-shadow hover:shadow-md"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground h-5 w-5" />
                <div>
                  <h3 className="font-semibold">{alert.rosterPeriod.code}</h3>
                  <p className="text-muted-foreground text-sm">
                    Deadline:{' '}
                    {new Date(alert.rosterPeriod.deadlineDate).toLocaleDateString('en-AU', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <Badge variant={getUrgencyVariant(alert.daysUntilDeadline)}>
                {getUrgencyLabel(alert.daysUntilDeadline)}
              </Badge>
            </div>

            {/* Statistics - Category Breakdown */}
            <div className="mb-3 space-y-3">
              {/* Leave Requests */}
              <div className="border-l-4 border-[var(--color-category-flight)] pl-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-foreground text-sm font-semibold">Leave Requests</p>
                  <Badge variant="outline" className="text-xs">
                    {alert.leaveRequestsCount} total
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[var(--color-category-flight-bg)] p-2 text-center">
                    <p className="text-lg font-bold text-[var(--color-status-medium)]">
                      {alert.leavePendingCount}
                    </p>
                    <p className="text-muted-foreground text-xs">Pending</p>
                  </div>
                  <div className="rounded bg-[var(--color-category-flight-bg)] p-2 text-center">
                    <p className="text-lg font-bold text-[var(--color-status-low)]">
                      {alert.leaveApprovedCount}
                    </p>
                    <p className="text-muted-foreground text-xs">Approved</p>
                  </div>
                </div>
              </div>

              {/* Flight Requests */}
              <div className="border-l-4 border-[var(--color-category-simulator)] pl-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-foreground text-sm font-semibold">Flight Requests (RDO/SDO)</p>
                  <Badge variant="outline" className="text-xs">
                    {alert.flightRequestsCount} total
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[var(--color-category-simulator-bg)] p-2 text-center">
                    <p className="text-lg font-bold text-[var(--color-status-medium)]">
                      {alert.flightPendingCount}
                    </p>
                    <p className="text-muted-foreground text-xs">Pending</p>
                  </div>
                  <div className="rounded bg-[var(--color-category-simulator-bg)] p-2 text-center">
                    <p className="text-lg font-bold text-[var(--color-status-low)]">
                      {alert.flightApprovedCount}
                    </p>
                    <p className="text-muted-foreground text-xs">Approved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action button */}
            {alert.pendingCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onReviewClick?.(alert.rosterPeriod.code)}
              >
                Review {alert.pendingCount} Pending Request{alert.pendingCount !== 1 ? 's' : ''}
              </Button>
            )}

            {/* Warning for urgent deadlines */}
            {alert.daysUntilDeadline <= 1 && alert.pendingCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-status-high)]">
                <AlertTriangle className="h-4 w-4" />
                <p>Action required before deadline!</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
