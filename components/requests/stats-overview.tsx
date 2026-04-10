/**
 * Stats Overview Component
 * Author: Maurice Rondeau
 * Date: December 20, 2025
 *
 * Displays clickable summary statistics cards for request management dashboard.
 * Clicking a card filters the requests table to show matching requests.
 */

'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Clock, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RequestStats } from '@/lib/utils/request-stats-utils'

export type StatFilter = 'pending' | 'critical' | 'warning' | 'clean'

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
  href: string
  isActive: boolean
}

function StatCard({ label, value, icon, description, variant, href, isActive }: StatCardProps) {
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
    <Link href={href}>
      <Card
        className={cn(
          'cursor-pointer p-3 transition-all hover:shadow-md',
          variantStyles[variant],
          isActive && 'ring-primary ring-2 ring-offset-2'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-medium', labelStyles[variant])}>{label}</p>
            <p className={cn('text-2xl font-bold', textStyles[variant])}>{value}</p>
          </div>
          <div className={textStyles[variant]}>{icon}</div>
        </div>
        {description && <p className={cn('mt-1.5 text-xs', labelStyles[variant])}>{description}</p>}
      </Card>
    </Link>
  )
}

/**
 * Determines the active stat filter from URL search params
 */
function getActiveFilter(searchParams: URLSearchParams): StatFilter | null {
  const statFilter = searchParams.get('stat_filter')
  if (
    statFilter === 'pending' ||
    statFilter === 'critical' ||
    statFilter === 'warning' ||
    statFilter === 'clean'
  ) {
    return statFilter
  }
  return null
}

/**
 * Builds the URL for a stat card, preserving tab and view params.
 * Clicking the active filter clears it (toggle behavior).
 */
function buildStatHref(
  filter: StatFilter,
  activeFilter: StatFilter | null,
  searchParams: URLSearchParams
): string {
  const tab = searchParams.get('tab') || 'leave'
  const view = searchParams.get('view') || 'table'
  const base = `/dashboard/requests?tab=${tab}&view=${view}`

  // Toggle: clicking active card clears the filter
  if (activeFilter === filter) {
    return base
  }

  const filterParams: Record<StatFilter, string> = {
    pending: `&status=SUBMITTED,IN_REVIEW&stat_filter=pending`,
    critical: `&status=SUBMITTED,IN_REVIEW&is_past_deadline=true&stat_filter=critical`,
    warning: `&status=SUBMITTED,IN_REVIEW&is_late=true&stat_filter=warning`,
    clean: `&status=SUBMITTED,IN_REVIEW&stat_filter=clean`,
  }

  return base + filterParams[filter]
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  const searchParams = useSearchParams()
  const activeFilter = getActiveFilter(searchParams)

  return (
    <div className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-4', className)}>
      <StatCard
        label="Pending"
        value={stats.pending}
        icon={<Clock className="h-8 w-8" />}
        variant="default"
        href={buildStatHref('pending', activeFilter, searchParams)}
        isActive={activeFilter === 'pending'}
      />
      <StatCard
        label="Critical"
        value={stats.critical}
        icon={<AlertCircle className="h-8 w-8" />}
        description="Conflicts or below minimum crew"
        variant="critical"
        href={buildStatHref('critical', activeFilter, searchParams)}
        isActive={activeFilter === 'critical'}
      />
      <StatCard
        label="Warnings"
        value={stats.warning}
        icon={<AlertTriangle className="h-8 w-8" />}
        description="Late or past deadline"
        variant="warning"
        href={buildStatHref('warning', activeFilter, searchParams)}
        isActive={activeFilter === 'warning'}
      />
      <StatCard
        label="Clean"
        value={stats.clean}
        icon={<CheckCircle className="h-8 w-8" />}
        description="No issues detected"
        variant="success"
        href={buildStatHref('clean', activeFilter, searchParams)}
        isActive={activeFilter === 'clean'}
      />
    </div>
  )
}
