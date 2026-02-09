/**
 * Fleet Insights Widget
 * Developer: Maurice Rondeau
 *
 * Displays 4 key fleet metrics in large-number card format.
 * Data sourced from Redis-cached DashboardMetrics (2-5ms response).
 * Designed for the redesigned dashboard landing page.
 */

import { getDashboardMetrics } from '@/lib/services/dashboard-service-v4'
import { Card } from '@/components/ui/card'
import { Users, ShieldCheck, AlertTriangle, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

function getComplianceColor(rate: number): string {
  if (rate >= 90) return 'text-success-600'
  if (rate >= 70) return 'text-warning-600'
  return 'text-destructive'
}

function getExpiringColor(count: number): string {
  if (count === 0) return 'text-success-600'
  if (count <= 5) return 'text-warning-600'
  return 'text-destructive'
}

interface MetricCardProps {
  icon: React.ReactNode
  value: string
  label: string
  valueClassName?: string
}

function MetricCard({ icon, value, label, valueClassName }: MetricCardProps) {
  return (
    <Card className="flex flex-col items-center gap-1 p-4 text-center">
      <div className="text-muted-foreground/50">{icon}</div>
      <span className={cn('text-3xl font-bold tabular-nums', valueClassName)}>{value}</span>
      <span className="text-muted-foreground text-xs tracking-wider uppercase">{label}</span>
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
