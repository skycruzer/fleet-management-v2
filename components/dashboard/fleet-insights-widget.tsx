/**
 * Fleet Insights Widget
 * Developer: Maurice Rondeau
 *
 * Displays 4 key fleet metrics with radial SVG gauge arcs.
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

function getComplianceArcColor(rate: number): string {
  if (rate >= 90) return 'oklch(0.65 0.18 155)'
  if (rate >= 70) return 'oklch(0.65 0.18 80)'
  return 'oklch(0.6 0.22 25)'
}

function getExpiringArcColor(count: number): string {
  if (count === 0) return 'oklch(0.65 0.18 155)'
  if (count <= 5) return 'oklch(0.65 0.18 80)'
  return 'oklch(0.6 0.22 25)'
}

/**
 * Renders a 180-degree (half-circle) SVG gauge arc.
 * The arc sweeps from left to right (9 o'clock to 3 o'clock).
 *
 * @param percent - Fill percentage (0 to 1)
 * @param fillColor - OKLCH color string for the filled portion
 */
function GaugeArc({ percent, fillColor }: { percent: number; fillColor: string }) {
  const clamped = Math.max(0, Math.min(1, percent))
  // Arc geometry: center at (50, 50), radius 40, stroke 3
  const radius = 40
  const circumference = Math.PI * radius // half-circle circumference
  const filled = circumference * clamped
  const gap = circumference - filled

  return (
    <svg
      viewBox="0 0 100 55"
      className="pointer-events-none absolute inset-x-0 top-3 mx-auto h-auto w-[80%]"
      aria-hidden="true"
    >
      {/* Track arc (muted background) */}
      <path
        d="M 10 50 A 40 40 0 0 1 90 50"
        fill="none"
        stroke="oklch(0.22 0.008 260)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {clamped > 0 && (
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={fillColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
        />
      )}
    </svg>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  value: string
  label: string
  valueClassName?: string
  gaugePercent: number
  gaugeColor: string
}

function MetricCard({
  icon,
  value,
  label,
  valueClassName,
  gaugePercent,
  gaugeColor,
}: MetricCardProps) {
  return (
    <Card className="relative flex flex-col items-center gap-1 p-4 text-center">
      <div className="text-muted-foreground/50">{icon}</div>
      <div className="relative flex items-center justify-center">
        <GaugeArc percent={gaugePercent} fillColor={gaugeColor} />
        <span className={cn('relative z-10 text-3xl font-bold tabular-nums', valueClassName)}>
          {value}
        </span>
      </div>
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
        gaugePercent={Math.min(activePilots / 50, 1)}
        gaugeColor="oklch(0.5 0.14 245)"
      />
      <MetricCard
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        value={`${Math.round(complianceRate)}%`}
        label="Compliance"
        valueClassName={getComplianceColor(complianceRate)}
        gaugePercent={complianceRate / 100}
        gaugeColor={getComplianceArcColor(complianceRate)}
      />
      <MetricCard
        icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
        value={String(expiringCerts)}
        label="Expiring"
        valueClassName={getExpiringColor(expiringCerts)}
        gaugePercent={Math.max(0, 1 - expiringCerts / 20)}
        gaugeColor={getExpiringArcColor(expiringCerts)}
      />
      <MetricCard
        icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
        value={String(pendingLeave)}
        label="Pending"
        gaugePercent={Math.min(pendingLeave / 20, 1)}
        gaugeColor="oklch(0.5 0.14 245)"
      />
    </div>
  )
}
