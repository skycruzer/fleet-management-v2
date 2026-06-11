/**
 * Fleet Insights Widget
 * Developer: Maurice Rondeau
 *
 * Displays 4 key fleet metrics as clean stat cards.
 * Data sourced from Redis-cached DashboardMetrics (2-5ms response).
 * Each card links to its detail view for drill-down.
 *
 * When the data layer is degraded (`metrics.degraded`) or a fetch
 * throws, a DataDegradedBanner is shown so placeholder figures are
 * never mistaken for real fleet data.
 */

import Link from 'next/link'
import { getDashboardMetrics } from '@/lib/services/dashboard-service-v4'
import { Card } from '@/components/ui/card'
import { ShieldCheck, AlertTriangle, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { DataDegradedBanner } from './data-degraded-banner'

function getComplianceColor(rate: number): string {
  if (rate >= 90) return 'text-success'
  if (rate >= 70) return 'text-warning'
  return 'text-destructive'
}

function getExpiringColor(count: number): string {
  if (count === 0) return 'text-success'
  if (count <= 5) return 'text-warning'
  return 'text-destructive'
}

interface MetricCardProps {
  icon: React.ReactNode
  value: string
  label: string
  href: string
  valueClassName?: string
}

function MetricCard({ icon, value, label, href, valueClassName }: MetricCardProps) {
  return (
    <Link
      href={href}
      aria-label={`${label}: ${value}. View details.`}
      className="focus-visible:ring-ring rounded-xl transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="border-border bg-card flex h-full flex-col items-center gap-2 p-6 text-center shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-interactive-hover)]">
        <div className="text-muted-foreground">{icon}</div>
        <span
          className={cn('text-3xl font-bold tabular-nums', valueClassName || 'text-foreground')}
        >
          {value}
        </span>
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </span>
      </Card>
    </Link>
  )
}

export async function FleetInsightsWidget() {
  let expiredCerts = 0
  let complianceRate = 0
  let expiringCerts = 0
  let pendingLeave = 0
  let degraded = false
  let degradedReason: string | undefined

  try {
    const metrics = await getDashboardMetrics()
    expiredCerts = metrics.certifications.expired
    complianceRate = metrics.certifications.complianceRate
    expiringCerts = metrics.certifications.expiring
    pendingLeave = metrics.leave.pending

    // The service returns (not throws) a placeholder object with
    // `degraded: true` when the data layer fails. Surface it.
    if (metrics.degraded) {
      degraded = true
      degradedReason = metrics.degradedReason
    }
  } catch (error) {
    // Render zero-valued fallback — don't throw so the Suspense boundary
    // stays clean — but log the failure and flag the degraded state so
    // the banner renders. Silent zeros on a compliance dashboard are unsafe.
    degraded = true
    degradedReason = error instanceof Error ? error.message : String(error)
    logError(error instanceof Error ? error : new Error(degradedReason), {
      source: 'FleetInsightsWidget',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'getDashboardMetrics' },
    })
  }

  return (
    <div className="space-y-3">
      {degraded ? <DataDegradedBanner reason={degradedReason} /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Action KPIs — every number is something to act on, not a population count */}
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          value={String(expiredCerts)}
          label="Certs overdue"
          href="/dashboard/certifications?tab=attention"
          valueClassName={expiredCerts > 0 ? 'text-destructive' : 'text-success'}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          value={String(expiringCerts)}
          label="Expiring ≤ 30d"
          href="/dashboard/certifications?tab=attention"
          valueClassName={getExpiringColor(expiringCerts)}
        />
        <MetricCard
          icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
          value={String(pendingLeave)}
          label="Awaiting decision"
          href="/dashboard/approvals"
          valueClassName={pendingLeave > 0 ? 'text-warning' : undefined}
        />
        <MetricCard
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          value={`${Math.round(complianceRate)}%`}
          label="Fleet compliance"
          href="/dashboard/certifications"
          valueClassName={getComplianceColor(complianceRate)}
        />
      </div>
    </div>
  )
}
