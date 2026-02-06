'use client'

/**
 * Expiring Certifications Banner Component
 *
 * Simplified clickable banner that shows a summary of expiring certifications.
 * Clicking the banner navigates to a dedicated page with full details.
 * Wrapped in Collapsible: expanded for critical (expired), collapsed for warnings only.
 *
 * Author: Maurice Rondeau
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { fadeInUp } from '@/lib/animations/motion-variants'

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

  // Expanded by default when there are critical (high priority) items
  const hasCritical = highPriorityCount > 0
  const [isOpen, setIsOpen] = useState(hasCritical)

  if (actionItems.length === 0) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="border-success-200 from-success-50 overflow-hidden rounded-xl border-2 bg-gradient-to-br to-[var(--color-success-muted)] shadow-sm"
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium transition-colors hover:bg-white/[0.04]">
        <span className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--color-badge-orange)]" aria-hidden="true" />
          Certification Alerts ({actionItems.length})
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Link href="/dashboard/certifications/expiring">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="group border-warning-300 from-warning-50 hover:border-warning-400 cursor-pointer overflow-hidden rounded-xl border-2 bg-gradient-to-br via-[var(--color-badge-orange-bg)] to-[var(--color-destructive-muted)] shadow-md transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            {/* Header Section */}
            <div className="from-warning-500 bg-gradient-to-r to-[var(--color-badge-orange)] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Certifications Expiring Soon</h3>
                    <p className="text-sm text-white/80">
                      {actionItems.length}{' '}
                      {actionItems.length === 1
                        ? 'certification requires'
                        : 'certifications require'}{' '}
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
      </CollapsibleContent>
    </Collapsible>
  )
}
