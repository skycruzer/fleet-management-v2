'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Clock, FileCheck, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Compliance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg lg:col-span-1 dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Fleet Compliance
            </h3>
            <FileCheck className="h-5 w-5 text-slate-400" />
          </div>

          {/* Large Compliance Badge */}
          <div className="mb-6 flex items-center justify-center">
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
                <span className="text-sm text-slate-600 dark:text-slate-400">Compliant</span>
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg p-3',
              complianceColor === 'success' && 'bg-success-50 dark:bg-success-900/20',
              complianceColor === 'warning' && 'bg-warning-50 dark:bg-warning-900/20',
              complianceColor === 'danger' && 'bg-danger-50 dark:bg-danger-900/20'
            )}
          >
            <CheckCircle2
              className={cn(
                'h-5 w-5',
                complianceColor === 'success' && 'text-success-600 dark:text-success-400',
                complianceColor === 'warning' && 'text-warning-600 dark:text-warning-400',
                complianceColor === 'danger' && 'text-danger-600 dark:text-danger-400'
              )}
            />
            <span
              className={cn(
                'text-sm font-semibold',
                complianceColor === 'success' && 'text-success-700 dark:text-success-400',
                complianceColor === 'warning' && 'text-warning-700 dark:text-warning-400',
                complianceColor === 'danger' && 'text-danger-700 dark:text-danger-400'
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2 dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="border-b border-slate-200 p-6 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Category Breakdown
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Current compliance by certification type
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {categories.map((category, index) => {
              const percentage = (category.current / category.total) * 100
              const color = getCategoryColor(category.status)

              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="mb-2 flex items-center justify-between">
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
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
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

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-3 dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="bg-warning-50 dark:bg-warning-900/20 border-b border-slate-200 p-6 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-warning-500 flex h-10 w-10 items-center justify-center rounded-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Urgent Action Items</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {actionItems.length} items require immediate attention
              </p>
            </div>
          </div>
        </div>

        {actionItems.length > 0 ? (
          <>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {actionItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        item.priority === 'high' && 'bg-danger-100 dark:bg-danger-900/30',
                        item.priority === 'medium' && 'bg-warning-100 dark:bg-warning-900/30',
                        item.priority === 'low' && 'bg-primary-100 dark:bg-primary-900/30'
                      )}
                    >
                      <Clock
                        className={cn(
                          'h-4 w-4',
                          item.priority === 'high' && 'text-danger-600 dark:text-danger-400',
                          item.priority === 'medium' && 'text-warning-600 dark:text-warning-400',
                          item.priority === 'low' && 'text-primary-600 dark:text-primary-400'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Due:{' '}
                        {new Date(item.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-slate-700">
              <button className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
                View All Action Items
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 className="text-success-500 mx-auto mb-2 h-12 w-12" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">All Clear!</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No urgent action items at this time
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
