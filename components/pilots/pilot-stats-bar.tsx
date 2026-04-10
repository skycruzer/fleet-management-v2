/**
 * Pilot Stats Bar Component
 *
 * Displays fleet statistics with colored icon backgrounds, large numbers,
 * and an active-ratio mini bar. Replaces the 4 inline stat Card boxes.
 *
 * Developer: Maurice Rondeau
 * @date February 2026
 */

import { Users, Star, User, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PilotStatsBarProps {
  totalPilots: number
  captains: number
  firstOfficers: number
  activePilots: number
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  iconBg: string
  iconColor: string
  total: number
  accent?: boolean
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor, total, accent }: StatCardProps) {
  const ratio = total > 0 ? (value / total) * 100 : 0

  return (
    <div
      className={cn(
        'bg-card border-border relative overflow-hidden rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md',
        accent && 'border-primary/20'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
            iconBg
          )}
        >
          <Icon className={cn('h-6 w-6', iconColor)} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
        </div>
      </div>

      {/* Ratio mini bar */}
      <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-all', iconBg.replace('/10', ''))}
          style={{ width: `${ratio}%`, backgroundColor: 'currentColor' }}
        >
          <div className={cn('h-full w-full rounded-full opacity-60', iconBg)} />
        </div>
      </div>
    </div>
  )
}

export function PilotStatsBar({
  totalPilots,
  captains,
  firstOfficers,
  activePilots,
}: PilotStatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={Users}
        label="Total Pilots"
        value={totalPilots}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        total={totalPilots}
        accent
      />
      <StatCard
        icon={Star}
        label="Captains"
        value={captains}
        iconBg="bg-[var(--color-warning-500)]/10"
        iconColor="text-[var(--color-warning-500)]"
        total={totalPilots}
      />
      <StatCard
        icon={User}
        label="First Officers"
        value={firstOfficers}
        iconBg="bg-[var(--color-status-low)]/10"
        iconColor="text-[var(--color-status-low)]"
        total={totalPilots}
      />
      <StatCard
        icon={CheckCircle}
        label="Active"
        value={activePilots}
        iconBg="bg-[var(--color-status-low)]/10"
        iconColor="text-[var(--color-status-low)]"
        total={totalPilots}
      />
    </div>
  )
}
