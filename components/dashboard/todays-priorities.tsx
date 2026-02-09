/**
 * Today's Priorities Component
 * Developer: Maurice Rondeau
 *
 * Server component that displays a prioritized agenda list
 * combining expiring certifications, pending requests, and
 * roster period alerts. Data sourced from Redis-cached
 * getTodaysPriorities() (2-minute TTL).
 * Part of the Video Buddy-inspired dashboard redesign (Phase 2).
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ClipboardList, Calendar, CheckCircle2 } from 'lucide-react'
import { getTodaysPriorities } from '@/lib/services/dashboard-service-v4'

interface PriorityItem {
  icon: React.ReactNode
  label: string
  count: number | string
  href: string
  variant: 'destructive' | 'warning' | 'default'
}

export async function TodaysPriorities() {
  const items: PriorityItem[] = []

  try {
    const priorities = await getTodaysPriorities()

    // Build priority items — only show items that have counts > 0
    if (priorities.expiringCerts.count > 0) {
      items.push({
        icon: <AlertTriangle className="text-destructive h-4 w-4" aria-hidden="true" />,
        label: `${priorities.expiringCerts.count} certification${priorities.expiringCerts.count === 1 ? '' : 's'} expiring within 7 days`,
        count:
          priorities.expiringCerts.critical > 0
            ? `${priorities.expiringCerts.critical} critical`
            : String(priorities.expiringCerts.count),
        href: '/dashboard/certifications?filter=expiring',
        variant: 'destructive',
      })
    }

    if (priorities.pendingRequests.total > 0) {
      const parts: string[] = []
      if (priorities.pendingRequests.leave > 0) {
        parts.push(`${priorities.pendingRequests.leave} leave`)
      }
      if (priorities.pendingRequests.flight > 0) {
        parts.push(`${priorities.pendingRequests.flight} flight`)
      }

      items.push({
        icon: <ClipboardList className="text-warning h-4 w-4" aria-hidden="true" />,
        label: `${priorities.pendingRequests.total} pending request${priorities.pendingRequests.total === 1 ? '' : 's'}${parts.length > 0 ? ` (${parts.join(', ')})` : ''}`,
        count: String(priorities.pendingRequests.total),
        href: '/dashboard/requests?status=pending',
        variant: 'warning',
      })
    }

    // Always show roster period info
    items.push({
      icon: <Calendar className="text-primary h-4 w-4" aria-hidden="true" />,
      label: `${priorities.rosterAlert.currentPeriod} ends in ${priorities.rosterAlert.daysRemaining} day${priorities.rosterAlert.daysRemaining === 1 ? '' : 's'}`,
      count: `${priorities.rosterAlert.daysRemaining}d`,
      href: '/dashboard/renewal-planning',
      variant: 'default',
    })
  } catch {
    // Fail silently — widget is non-critical
  }

  return (
    <Card className="h-full p-4">
      <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
        Today&apos;s Priorities
      </h3>

      {items.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-center">
          <CheckCircle2 className="text-success h-5 w-5" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">All clear — no urgent items today</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
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
    </Card>
  )
}
