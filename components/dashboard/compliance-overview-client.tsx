'use client'

import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { CheckCircle2, FileCheck, ClipboardPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ComplianceCategory {
  name: string
  current: number
  total: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

interface ComplianceOverviewProps {
  overallCompliance: number
  categories: ComplianceCategory[]
  actionItems: {
    id: string
    title: string
    priority: 'high' | 'medium' | 'low'
    dueDate: string
  }[]
}

export function ComplianceOverviewClient({
  overallCompliance,
  categories,
  actionItems,
}: ComplianceOverviewProps) {
  const { shouldAnimate } = useAnimationSettings()

  const getComplianceColor = () => {
    if (overallCompliance >= 95) return 'success'
    if (overallCompliance >= 85) return 'warning'
    return 'danger'
  }

  const complianceColor = getComplianceColor()

  const getCategoryColor = (status: ComplianceCategory['status']) => {
    switch (status) {
      case 'excellent':
        return 'success'
      case 'good':
        return 'primary'
      case 'warning':
        return 'warning'
      case 'critical':
        return 'danger'
      default:
        return 'primary'
    }
  }

  // Empty state when no categories or certifications exist
  if (!categories || categories.length === 0) {
    return (
      <div className="grid w-full gap-6 md:grid-cols-2">
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimate ? { delay: 0.1 } : { duration: 0 }}
          className="group border-border bg-card relative overflow-hidden rounded-lg border p-6 shadow-sm md:col-span-2"
        >
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <ClipboardPlus className="text-muted-foreground h-8 w-8" aria-hidden="true" />
            </div>
            <h4 className="text-foreground mb-2 text-lg font-semibold">
              No Certifications Tracked
            </h4>
            <p className="text-muted-foreground mb-4 max-w-md text-sm">
              Set up certification tracking for your pilots to monitor fleet compliance. Add check
              types and assign them to pilots to get started.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/admin/check-types"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label="Set up check types for certification tracking"
              >
                <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
                Set Up Check Types
              </Link>
              <Link
                href="/dashboard/certifications"
                className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                aria-label="View certifications page"
              >
                View Certifications
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid w-full gap-6 md:grid-cols-2">
      {/* Main Compliance Card */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldAnimate ? { delay: 0.1 } : { duration: 0 }}
        className="group border-border bg-card relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all hover:shadow-lg"
      >
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground text-lg font-semibold">Fleet Compliance</h3>
            <FileCheck className="text-muted-foreground h-5 w-5" />
          </div>

          {/* Large Compliance Badge */}
          <div className="mb-6 flex items-center justify-center">
            <div className="relative">
              {/* Outer ring */}
              <svg
                className="h-40 w-40 -rotate-90 transform"
                role="img"
                aria-labelledby="compliance-chart-title compliance-chart-desc"
              >
                <title id="compliance-chart-title">Fleet Compliance Chart</title>
                <desc id="compliance-chart-desc">
                  {overallCompliance}% fleet compliance.{' '}
                  {complianceColor === 'success' && 'Excellent compliance level.'}
                  {complianceColor === 'warning' &&
                    'Good compliance level, minor attention needed.'}
                  {complianceColor === 'danger' && 'Compliance needs attention.'}
                </desc>
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                  aria-hidden="true"
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
                  initial={
                    shouldAnimate
                      ? { strokeDasharray: '0 440' }
                      : { strokeDasharray: `${(overallCompliance / 100) * 440} 440` }
                  }
                  animate={{
                    strokeDasharray: `${(overallCompliance / 100) * 440} 440`,
                  }}
                  transition={shouldAnimate ? { duration: 1.5, ease: 'easeOut' } : { duration: 0 }}
                  aria-hidden="true"
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={shouldAnimate ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={shouldAnimate ? { delay: 0.5, duration: 0.5 } : { duration: 0 }}
                  className={cn(
                    'text-4xl font-bold',
                    complianceColor === 'success' && 'text-success-600',
                    complianceColor === 'warning' && 'text-warning-600',
                    complianceColor === 'danger' && 'text-danger-600'
                  )}
                >
                  {overallCompliance}%
                </motion.span>
                <span className="text-muted-foreground text-sm">Compliant</span>
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg p-3',
              complianceColor === 'success' && 'bg-success-50',
              complianceColor === 'warning' && 'bg-warning-50',
              complianceColor === 'danger' && 'bg-danger-50'
            )}
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              className={cn(
                'h-5 w-5',
                complianceColor === 'success' && 'text-success-600',
                complianceColor === 'warning' && 'text-warning-600',
                complianceColor === 'danger' && 'text-danger-600'
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-sm font-semibold',
                complianceColor === 'success' && 'text-success-700',
                complianceColor === 'warning' && 'text-warning-700',
                complianceColor === 'danger' && 'text-danger-700'
              )}
            >
              {complianceColor === 'success' && 'Excellent Compliance'}
              {complianceColor === 'warning' && 'Good Compliance'}
              {complianceColor === 'danger' && 'Needs Attention'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Categories Breakdown */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldAnimate ? { delay: 0.2 } : { duration: 0 }}
        className="border-border bg-card overflow-hidden rounded-lg border shadow-sm"
      >
        <div className="border-border border-b p-6">
          <h3 className="text-foreground text-lg font-semibold">Category Breakdown</h3>
          <p className="text-muted-foreground text-sm">Current compliance by certification type</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {categories.map((category, index) => {
              const percentage = (category.current / category.total) * 100
              const color = getCategoryColor(category.status)

              return (
                <motion.div
                  key={category.name}
                  initial={shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={shouldAnimate ? { delay: 0.3 + index * 0.1 } : { duration: 0 }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-foreground text-sm font-medium">{category.name}</span>
                    <span className="text-foreground text-sm font-semibold">
                      {category.current}/{category.total}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <motion.div
                      initial={shouldAnimate ? { width: 0 } : { width: `${percentage}%` }}
                      animate={{ width: `${percentage}%` }}
                      transition={
                        shouldAnimate
                          ? { duration: 0.8, delay: 0.3 + index * 0.1 }
                          : { duration: 0 }
                      }
                      className={cn(
                        'h-full rounded-full',
                        color === 'success' && 'bg-success-500',
                        color === 'primary' && 'bg-primary-500',
                        color === 'warning' && 'bg-warning-500',
                        color === 'danger' && 'bg-danger-500'
                      )}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
