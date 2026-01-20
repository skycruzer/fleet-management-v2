/**
 * Stats Overview Component
 * Author: Maurice Rondeau
 * Date: December 20, 2025
 *
 * Displays summary statistics cards for request management dashboard.
 * Shows Pending, Critical, Warning, and Clean counts.
 */

'use client'

import { Card } from '@/components/ui/card'
import { Clock, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RequestStats } from '@/lib/utils/request-stats-utils'

interface StatsOverviewProps {
  stats: RequestStats
  className?: string
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  description?: string
  variant: 'default' | 'critical' | 'warning' | 'success'
}

function StatCard({ label, value, icon, description, variant }: StatCardProps) {
  const variantStyles = {
    default: 'bg-background border',
    critical: 'bg-[var(--color-status-high-bg)] border-[var(--color-status-high-border)]',
    warning: 'bg-[var(--color-status-medium-bg)] border-[var(--color-status-medium-border)]',
    success: 'bg-[var(--color-status-low-bg)] border-[var(--color-status-low-border)]',
  }

  const textStyles = {
    default: 'text-foreground',
    critical: 'text-[var(--color-status-high)]',
    warning: 'text-[var(--color-status-medium)]',
    success: 'text-[var(--color-status-low)]',
  }

  const labelStyles = {
    default: 'text-muted-foreground',
    critical: 'text-[var(--color-status-high)]',
    warning: 'text-[var(--color-status-medium)]',
    success: 'text-[var(--color-status-low)]',
  }

  return (
    <Card className={cn('p-3', variantStyles[variant])}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn('text-sm font-medium', labelStyles[variant])}>{label}</p>
          <p className={cn('text-2xl font-bold', textStyles[variant])}>{value}</p>
        </div>
        <div className={textStyles[variant]}>{icon}</div>
      </div>
      {description && <p className={cn('mt-1.5 text-xs', labelStyles[variant])}>{description}</p>}
    </Card>
  )
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-4', className)}>
      <StatCard
        label="Pending"
        value={stats.pending}
        icon={<Clock className="h-8 w-8" />}
        variant="default"
      />
      <StatCard
        label="Critical"
        value={stats.critical}
        icon={<AlertCircle className="h-8 w-8" />}
        description="Conflicts or below minimum crew"
        variant="critical"
      />
      <StatCard
        label="Warnings"
        value={stats.warning}
        icon={<AlertTriangle className="h-8 w-8" />}
        description="Late or past deadline"
        variant="warning"
      />
      <StatCard
        label="Clean"
        value={stats.clean}
        icon={<CheckCircle className="h-8 w-8" />}
        description="No issues detected"
        variant="success"
      />
    </div>
  )
}
