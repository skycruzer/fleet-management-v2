/**
 * Today's Priorities Component
 * Developer: Maurice Rondeau
 *
 * Server component that lists actionable items only — expiring
 * certifications and pending requests. Roster-period context lives in
 * the roster widgets, not here, so an empty list genuinely means
 * "nothing to act on". Data from Redis-cached getTodaysPriorities().
 */

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ClipboardList, CheckCircle2, ListChecks } from 'lucide-react'
import { getTodaysPriorities } from '@/lib/services/dashboard-service-v4'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { DashboardCard } from './dashboard-card'
import { EmptyState } from './empty-state'

interface PriorityItem {
  icon: React.ReactNode
  label: string
  count: number | string
  href: string
  variant: 'destructive' | 'warning' | 'default'
}

export async function TodaysPriorities() {
  const items: PriorityItem[] = []
  let hasError = false

  try {
    const priorities = await getTodaysPriorities()

    // Named expiring certs lead — "who and what", not just a count
    for (const cert of priorities.expiringCerts.items) {
      items.push({
        icon: <AlertTriangle className="text-destructive h-4 w-4" aria-hidden="true" />,
        label: `${cert.pilotName} — ${cert.checkType}`,
        count: cert.daysLeft < 0 ? `${Math.abs(cert.daysLeft)}d overdue` : `${cert.daysLeft}d left`,
        href: '/dashboard/certifications?tab=attention',
        variant: cert.daysLeft <= 3 ? 'destructive' : 'warning',
      })
    }
    const namedCount = priorities.expiringCerts.items.length
    if (priorities.expiringCerts.count > namedCount) {
      items.push({
        icon: <AlertTriangle className="text-warning h-4 w-4" aria-hidden="true" />,
        label: `${priorities.expiringCerts.count - namedCount} more certification${priorities.expiringCerts.count - namedCount === 1 ? '' : 's'} expiring within 7 days`,
        count: String(priorities.expiringCerts.count - namedCount),
        href: '/dashboard/certifications?tab=attention',
        variant: 'warning',
      })
    }

    if (priorities.pendingRequests.total > 0) {
      const parts: string[] = []
      if (priorities.pendingRequests.leave > 0) {
        parts.push(`${priorities.pendingRequests.leave} leave`)
      }
      if (priorities.pendingRequests.flight > 0) {
        parts.push(`${priorities.pendingRequests.flight} RDO/SDO`)
      }

      items.push({
        icon: <ClipboardList className="text-warning h-4 w-4" aria-hidden="true" />,
        label: `${priorities.pendingRequests.total} request${priorities.pendingRequests.total === 1 ? '' : 's'} awaiting decision${parts.length > 0 ? ` (${parts.join(', ')})` : ''} — crew impact shown in the queue`,
        count: String(priorities.pendingRequests.total),
        href: '/dashboard/approvals',
        variant: 'warning',
      })
    }
  } catch (error) {
    // Don't render a false "all clear" — flag the error and log it.
    // On a compliance dashboard, an empty list must mean "nothing urgent",
    // never "we couldn't check".
    hasError = true
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'TodaysPriorities',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getTodaysPriorities' },
    })
  }

  return (
    <DashboardCard
      title="Action required today"
      icon={ListChecks}
      action={{ href: '/dashboard/approvals', label: 'Open approvals queue' }}
    >
      {hasError ? (
        <div className="flex items-center gap-2 py-4" role="alert">
          <AlertTriangle className="text-warning h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">
            Unable to load priorities — data may be incomplete. Try refreshing.
          </p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear"
          description="No urgent items to act on today."
          className="py-6"
        />
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2.5 transition-colors"
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <p className="text-foreground min-w-0 flex-1 text-sm">{item.label}</p>
              <Badge variant={item.variant}>{item.count}</Badge>
            </Link>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}
