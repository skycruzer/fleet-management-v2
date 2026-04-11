/**
 * Fleet Insights Widget
 * Developer: Maurice Rondeau
 *
 * Displays 4 key fleet metrics as clean stat cards.
 * Data sourced from Redis-cached DashboardMetrics (2-5ms response).
 */

import { getDashboardMetrics } from '@/lib/services/dashboard-service-v4'
import { Card } from '@/components/ui/card'
import { Users, ShieldCheck, AlertTriangle, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

function getComplianceColor(rate: number): string {
  if (rate >= 90) return 'text-[var(--color-status-low)]'
  if (rate >= 70) return 'text-[var(--color-status-medium)]'
  return 'text-[var(--color-status-high)]'
}

function getExpiringColor(count: number): string {
  if (count === 0) return 'text-[var(--color-status-low)]'
  if (count <= 5) return 'text-[var(--color-status-medium)]'
  return 'text-[var(--color-status-high)]'
}

interface MetricCardProps {
  icon: React.ReactNode
  value: string
  label: string
  valueClassName?: string
}

function MetricCard({ icon, value, label, valueClassName }: MetricCardProps) {
  return (
    <Card className="border-border bg-card flex flex-col items-center gap-2 p-6 text-center shadow-[var(--shadow-card)]">
      <div className="text-muted-foreground">{icon}</div>
      <span className={cn('text-3xl font-bold tabular-nums', valueClassName || 'text-foreground')}>
        {value}
      </span>
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}
      </span>
    </Card>
  )
}

export async function FleetInsightsWidget() {
  let activePilots = 0
  let complianceRate = 0
  let expiringCerts = 0
  let pendingLeave = 0

  try {
    const metrics = await getDashboardMetrics()
    activePilots = metrics.pilots.active
    complianceRate = metrics.certifications.complianceRate
    expiringCerts = metrics.certifications.expiring
    pendingLeave = metrics.leave.pending
  } catch {
    // Render zero-valued fallback — don't throw so Suspense boundary stays clean
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        icon={<Users className="h-5 w-5" aria-hidden="true" />}
        value={String(activePilots)}
        label="Active Pilots"
      />
      <MetricCard
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        value={`${Math.round(complianceRate)}%`}
        label="Compliance"
        valueClassName={getComplianceColor(complianceRate)}
      />
      <MetricCard
        icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
        value={String(expiringCerts)}
        label="Expiring"
        valueClassName={getExpiringColor(expiringCerts)}
      />
      <MetricCard
        icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
        value={String(pendingLeave)}
        label="Pending"
      />
    </div>
  )
}
