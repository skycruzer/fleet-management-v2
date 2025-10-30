'use client'

/**
 * Expiring Certifications Banner Component
 *
 * Simplified clickable banner that shows a summary of expiring certifications.
 * Clicking the banner navigates to a dedicated page with full details.
 */

import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ActionItem {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string
}

interface ExpiringCertificationsBannerProps {
  actionItems: ActionItem[]
}

export function ExpiringCertificationsBanner({ actionItems }: ExpiringCertificationsBannerProps) {
  const highPriorityCount = actionItems.filter((item) => item.priority === 'high').length
  const mediumPriorityCount = actionItems.filter((item) => item.priority === 'medium').length
  const lowPriorityCount = actionItems.filter((item) => item.priority === 'low').length

  if (actionItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-xl border-2 border-success-200 bg-gradient-to-br from-success-50 to-emerald-50 shadow-sm dark:border-success-800 dark:from-success-950/50 dark:to-emerald-950/50"
      >
        <div className="p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-success-500" />
          <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
            All Certifications Current!
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No certifications expiring in the next 30 days
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <Link href="/dashboard/certifications/expiring">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="group cursor-pointer overflow-hidden rounded-xl border-2 border-warning-300 bg-gradient-to-br from-warning-50 via-orange-50 to-red-50 shadow-md transition-all hover:scale-[1.02] hover:border-warning-400 hover:shadow-xl dark:border-warning-700 dark:from-warning-950/50 dark:via-orange-950/50 dark:to-red-950/50 dark:hover:border-warning-600"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-warning-500 to-orange-600 px-6 py-4 dark:from-warning-600 dark:to-orange-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Certifications Expiring Soon</h3>
                <p className="text-sm text-white/80">
                  {actionItems.length} {actionItems.length === 1 ? 'certification requires' : 'certifications require'} attention
                </p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-6">
          {/* High Priority */}
          <div className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/30">
                <AlertTriangle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-danger-600 dark:text-danger-400">
              {highPriorityCount}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Critical
            </p>
          </div>

          {/* Medium Priority */}
          <div className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
                <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-warning-600 dark:text-warning-400">
              {mediumPriorityCount}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Warning
            </p>
          </div>

          {/* Low Priority */}
          <div className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <AlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-primary-600 dark:text-primary-400">
              {lowPriorityCount}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Notice
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="border-t-2 border-warning-200 bg-white/50 px-6 py-4 dark:border-warning-800 dark:bg-slate-800/50">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-warning-800 dark:text-warning-300">
            <span>Click to view detailed certification report</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
