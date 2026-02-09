'use client'

import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { Users, FileCheck, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCard {
  title: string
  value: string | number
  subtitle: string
  icon: string
  trend?: {
    value: number
    direction: 'up' | 'down'
    label: string
  }
  gradientFrom: string
  gradientTo: string
  iconColor: string
}

interface HeroStatsClientProps {
  stats: StatCard[]
}

const iconMap = {
  Users,
  FileCheck,
  Calendar,
  TrendingUp,
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function HeroStatsClient({ stats }: HeroStatsClientProps) {
  const { shouldAnimate, getVariants } = useAnimationSettings()

  return (
    <motion.div
      variants={getVariants(container)}
      initial="hidden"
      animate={shouldAnimate ? 'show' : 'visible'}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon as keyof typeof iconMap] || Users
        const TrendIcon = stat.trend?.direction === 'up' ? TrendingUp : TrendingDown

        return (
          <motion.div
            key={stat.title}
            variants={getVariants(item)}
            whileHover={shouldAnimate ? { y: -4, scale: 1.02 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group border-border bg-card relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all hover:shadow-lg"
          >
            {/* Background gradient on hover */}
            <div className="from-primary-50/0 to-primary-100/0 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative">
              {/* Icon with gradient background */}
              <div
                className={cn(
                  'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br shadow-md',
                  stat.gradientFrom,
                  stat.gradientTo
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>

              {/* Title */}
              <p className="text-muted-foreground mb-1 text-sm font-medium">{stat.title}</p>

              {/* Value */}
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="text-foreground text-3xl font-bold">{stat.value}</h3>

                {/* Trend indicator */}
                {stat.trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                      stat.trend.direction === 'up'
                        ? 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
                        : 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{stat.trend.value}%</span>
                  </div>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-muted-foreground text-sm">{stat.subtitle}</p>

              {/* Trend label */}
              {stat.trend && (
                <p className="text-muted-foreground mt-2 text-xs">{stat.trend.label}</p>
              )}

              {/* Bottom border accent */}
              <div
                className={cn(
                  'absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full',
                  stat.gradientFrom,
                  stat.gradientTo
                )}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
