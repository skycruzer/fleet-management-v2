/**
 * Hero Stats Component - Cockpit Precision Design
 * Dense information display, no animations, monospace numbers
 *
 * @author Maurice Rondeau
 */

'use client'

import { Users, FileCheck, Calendar, TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCard {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down'
    label: string
  }
  variant: 'primary' | 'success' | 'warning' | 'neutral'
}

const stats: StatCard[] = [
  {
    title: 'Total Pilots',
    value: 27,
    subtitle: 'Active fleet members',
    icon: Users,
    trend: {
      value: 2,
      direction: 'up',
      label: 'vs last month',
    },
    variant: 'primary',
  },
  {
    title: 'Certifications',
    value: 607,
    subtitle: 'Total active certifications',
    icon: FileCheck,
    trend: {
      value: 12,
      direction: 'up',
      label: 'renewed this month',
    },
    variant: 'success',
  },
  {
    title: 'Compliance Rate',
    value: '94.2%',
    subtitle: 'Fleet-wide compliance',
    icon: TrendingUp,
    trend: {
      value: 2.1,
      direction: 'up',
      label: 'improvement',
    },
    variant: 'primary',
  },
  {
    title: 'Leave Requests',
    value: 8,
    subtitle: 'Pending approval',
    icon: Calendar,
    trend: {
      value: 3,
      direction: 'down',
      label: 'vs last week',
    },
    variant: 'warning',
  },
]

const variantStyles = {
  primary: 'border-primary/30 text-primary',
  success: 'border-success/30 text-success',
  warning: 'border-warning/30 text-warning',
  neutral: 'border-border text-muted-foreground',
}

export function HeroStats() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend?.direction === 'up' ? TrendingUp : TrendingDown

        return (
          <div key={stat.title} className="border-border bg-card rounded-sm border p-3">
            <div className="flex items-start justify-between">
              {/* Icon */}
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-sm border',
                  variantStyles[stat.variant]
                )}
              >
                <Icon className="size-4" />
              </div>

              {/* Trend indicator */}
              {stat.trend && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-xs font-medium',
                    stat.trend.direction === 'up'
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  <TrendIcon className="size-3" />
                  <span>{stat.trend.value}%</span>
                </div>
              )}
            </div>

            {/* Value */}
            <div className="mt-2">
              <p className="text-foreground font-mono text-xl font-bold">{stat.value}</p>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-0.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {stat.title}
              </p>
              <p className="text-muted-foreground/70 text-xs">{stat.subtitle}</p>
            </div>

            {/* Trend label */}
            {stat.trend && (
              <p className="text-muted-foreground/60 mt-1.5 text-xs">{stat.trend.label}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
