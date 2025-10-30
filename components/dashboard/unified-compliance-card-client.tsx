/**
 * Unified Compliance Card Client Component
 *
 * Client-side component with animations and interactivity
 */

'use client'

import { motion } from 'framer-motion'
import { FileCheck, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface Category {
  name: string
  current: number
  total: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

interface UnifiedComplianceCardClientProps {
  overallCompliance: number
  categories: Category[]
}

export function UnifiedComplianceCardClient({
  overallCompliance,
  categories,
}: UnifiedComplianceCardClientProps) {
  const getComplianceColor = () => {
    if (overallCompliance >= 95) return 'success'
    if (overallCompliance >= 85) return 'warning'
    return 'danger'
  }

  const getCategoryColor = (status: Category['status']) => {
    switch (status) {
      case 'excellent':
        return 'bg-success-500'
      case 'good':
        return 'bg-primary-500'
      case 'warning':
        return 'bg-warning-500'
      case 'critical':
        return 'bg-danger-500'
    }
  }

  const complianceColor = getComplianceColor()

  return (
    <Card className="overflow-hidden p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Fleet Compliance
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Current certification compliance across all pilots
          </p>
        </div>
        <FileCheck className="h-5 w-5 text-slate-400" />
      </div>

      {/* Main Content: Circle + Bars Layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left: Circular Progress */}
        <div className="flex flex-col items-center lg:w-48 lg:flex-shrink-0">
          <div className="relative">
            {/* Outer ring */}
            <svg className="h-40 w-40 -rotate-90 transform">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-slate-200 dark:text-slate-700"
              />
              {/* Progress circle */}
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                className={cn(
                  complianceColor === 'success' && 'text-success-500',
                  complianceColor === 'warning' && 'text-warning-500',
                  complianceColor === 'danger' && 'text-danger-500'
                )}
                initial={{ strokeDasharray: '0 440' }}
                animate={{
                  strokeDasharray: `${(overallCompliance / 100) * 440} 440`,
                }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className={cn(
                  'text-4xl font-bold',
                  complianceColor === 'success' && 'text-success-600 dark:text-success-400',
                  complianceColor === 'warning' && 'text-warning-600 dark:text-warning-400',
                  complianceColor === 'danger' && 'text-danger-600 dark:text-danger-400'
                )}
              >
                {overallCompliance}%
              </motion.span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Compliant
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div
            className={cn(
              'mt-4 rounded-lg px-4 py-2 text-center text-sm font-semibold',
              complianceColor === 'success' && 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400',
              complianceColor === 'warning' && 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
              complianceColor === 'danger' && 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400'
            )}
          >
            {complianceColor === 'success' && 'Excellent'}
            {complianceColor === 'warning' && 'Good'}
            {complianceColor === 'danger' && 'Needs Attention'}
          </div>
        </div>

        {/* Right: Category Progress Bars */}
        <div className="flex-1 space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Category Breakdown
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category, index) => {
              const percentage = (category.current / category.total) * 100

              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {category.name}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {category.current}/{category.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
                      className={cn('h-full rounded-full', getCategoryColor(category.status))}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
        <Link
          href="/dashboard/certifications"
          className="group flex items-center justify-between rounded-lg p-3 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
        >
          <span className="text-slate-700 dark:text-slate-300">
            View All Certifications
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Card>
  )
}
