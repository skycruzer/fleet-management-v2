'use client'

/**
 * Critical Stats Strip Component
 * Condensed horizontal display of key metrics
 * Designed for dashboard header - always visible
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  FileCheck,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatItem {
  /** Label for the stat */
  label: string
  /** Primary value to display */
  value: string | number
  /** Optional icon */
  icon?: LucideIcon
  /** Status indicator */
  status?: 'success' | 'warning' | 'critical' | 'neutral'
  /** Trend direction */
  trend?: 'up' | 'down' | 'stable'
  /** Trend value (e.g., "+5%") */
  trendValue?: string
  /** Link to detailed view */
  href?: string
}

interface CriticalStatsStripProps {
  stats: StatItem[]
  className?: string
}

const statusColors = {
  success: 'text-[var(--color-status-low)]',
  warning: 'text-[var(--color-status-medium)]',
  critical: 'text-[var(--color-status-high)]',
  neutral: 'text-muted-foreground',
}

const statusBgColors = {
  success: 'bg-[var(--color-status-low-bg)]',
  warning: 'bg-[var(--color-status-medium-bg)]',
  critical: 'bg-[var(--color-status-high-bg)]',
  neutral: 'bg-muted',
}

function StatCard({ stat }: { stat: StatItem }) {
  const Icon = stat.icon
  const status = stat.status || 'neutral'

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
        statusBgColors[status],
        stat.href && 'cursor-pointer hover:scale-[1.02] hover:shadow-md'
      )}
    >
      {Icon && (
        <div className={cn('shrink-0', statusColors[status])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground truncate text-xs font-medium">{stat.label}</p>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-xl font-bold', statusColors[status])}>{stat.value}</span>
          {stat.trend && stat.trendValue && (
            <span
              className={cn(
                'flex items-center text-xs font-medium',
                stat.trend === 'up' && 'text-[var(--color-status-low)]',
                stat.trend === 'down' && 'text-[var(--color-status-high)]',
                stat.trend === 'stable' && 'text-muted-foreground'
              )}
            >
              {stat.trend === 'up' && <TrendingUp className="mr-0.5 h-3 w-3" />}
              {stat.trend === 'down' && <TrendingDown className="mr-0.5 h-3 w-3" />}
              {stat.trendValue}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (stat.href) {
    return (
      <Link href={stat.href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function CriticalStatsStrip({ stats, className }: CriticalStatsStripProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:gap-4', className)}>
      {stats.map((stat, index) => (
        <div key={index} className="lg:flex-1">
          <StatCard stat={stat} />
        </div>
      ))}
    </div>
  )
}

/**
 * Pre-configured stats strip for fleet management dashboard
 */
export function FleetStatsStrip({
  totalPilots,
  activeCertifications,
  expiringCerts,
  pendingRequests,
  className,
}: {
  totalPilots: number
  activeCertifications: number
  expiringCerts: number
  pendingRequests: number
  className?: string
}) {
  const stats: StatItem[] = [
    {
      label: 'Active Pilots',
      value: totalPilots,
      icon: Users,
      status: 'neutral',
      href: '/dashboard/pilots',
    },
    {
      label: 'Certifications',
      value: activeCertifications,
      icon: FileCheck,
      status: 'success',
      href: '/dashboard/certifications',
    },
    {
      label: 'Expiring Soon',
      value: expiringCerts,
      icon: AlertTriangle,
      status: expiringCerts > 10 ? 'critical' : expiringCerts > 5 ? 'warning' : 'success',
      href: '/dashboard/certifications?tab=attention',
    },
    {
      label: 'Pending Requests',
      value: pendingRequests,
      icon: Calendar,
      status: pendingRequests > 0 ? 'warning' : 'success',
      href: '/dashboard/requests?status=pending',
    },
  ]

  return <CriticalStatsStrip stats={stats} className={className} />
}

export { type StatItem, type CriticalStatsStripProps }
