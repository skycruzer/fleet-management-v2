'use client'

import { motion } from 'framer-motion'
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
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon as keyof typeof iconMap] || Users
        const TrendIcon = stat.trend?.direction === 'up' ? TrendingUp : TrendingDown

        return (
          <motion.div
            key={stat.title}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            {/* Background gradient on hover */}
            <div className="from-primary-50/0 to-primary-100/0 dark:from-primary-900/0 dark:to-primary-800/0 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />

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
              <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.title}
              </p>

              {/* Value */}
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>

                {/* Trend indicator */}
                {stat.trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                      stat.trend.direction === 'up'
                        ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                        : 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400'
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{stat.trend.value}%</span>
                  </div>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.subtitle}</p>

              {/* Trend label */}
              {stat.trend && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                  {stat.trend.label}
                </p>
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
