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
    critical: 'bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/20 dark:border-yellow-800',
    success: 'bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800',
  }

  const textStyles = {
    default: 'text-foreground',
    critical: 'text-red-700 dark:text-red-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    success: 'text-green-700 dark:text-green-400',
  }

  const labelStyles = {
    default: 'text-muted-foreground',
    critical: 'text-red-900 dark:text-red-300',
    warning: 'text-yellow-900 dark:text-yellow-300',
    success: 'text-green-900 dark:text-green-300',
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
