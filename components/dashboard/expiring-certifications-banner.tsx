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
        className="border-success-200 from-success-50 overflow-hidden rounded-xl border-2 bg-gradient-to-br to-emerald-50 shadow-sm"
      >
        <div className="p-6 text-center">
          <CheckCircle2 className="text-success-500 mx-auto mb-3 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-lg font-bold">All Certifications Current!</h3>
          <p className="text-muted-foreground text-sm">
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
        className="group border-warning-300 from-warning-50 hover:border-warning-400 cursor-pointer overflow-hidden rounded-xl border-2 bg-gradient-to-br via-orange-50 to-red-50 shadow-md transition-all hover:scale-[1.02] hover:shadow-xl"
      >
        {/* Header Section */}
        <div className="from-warning-500 bg-gradient-to-r to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Certifications Expiring Soon</h3>
                <p className="text-sm text-white/80">
                  {actionItems.length}{' '}
                  {actionItems.length === 1 ? 'certification requires' : 'certifications require'}{' '}
                  attention
                </p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-6">
          {/* High Priority */}
          <div className="bg-card rounded-lg p-4 text-center shadow-sm">
            <div className="mb-2 flex items-center justify-center">
              <div className="bg-danger-100 flex h-10 w-10 items-center justify-center rounded-full">
                <AlertTriangle className="text-danger-600 h-5 w-5" />
              </div>
            </div>
            <p className="text-danger-600 text-2xl font-black">{highPriorityCount}</p>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Critical
            </p>
          </div>

          {/* Medium Priority */}
          <div className="bg-card rounded-lg p-4 text-center shadow-sm">
            <div className="mb-2 flex items-center justify-center">
              <div className="bg-warning-100 flex h-10 w-10 items-center justify-center rounded-full">
                <AlertCircle className="text-warning-600 h-5 w-5" />
              </div>
            </div>
            <p className="text-warning-600 text-2xl font-black">{mediumPriorityCount}</p>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Warning
            </p>
          </div>

          {/* Low Priority */}
          <div className="bg-card rounded-lg p-4 text-center shadow-sm">
            <div className="mb-2 flex items-center justify-center">
              <div className="bg-primary-100 flex h-10 w-10 items-center justify-center rounded-full">
                <AlertCircle className="text-primary-600 h-5 w-5" />
              </div>
            </div>
            <p className="text-primary-600 text-2xl font-black">{lowPriorityCount}</p>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Notice
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="border-warning-200 bg-card/50 border-t-2 px-6 py-4">
          <div className="text-warning-800 flex items-center justify-center gap-2 text-sm font-semibold">
            <span>Click to view detailed certification report</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
