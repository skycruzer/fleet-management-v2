/**
 * Urgent Alert Banner Client Component
 *
 * Client-side interactive alert banner with dismissal functionality
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface UrgentAlertBannerClientProps {
  total: number
  critical: number
  warning: number
  notice: number
  urgencyLevel: 'critical' | 'warning' | 'notice'
}

export function UrgentAlertBannerClient({
  total,
  critical,
  warning,
  notice,
  urgencyLevel,
}: UrgentAlertBannerClientProps) {
  // Initialize as not dismissed to match server render, update after hydration
  const [isDismissed, setIsDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check localStorage after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true)
    const dismissed = localStorage.getItem('urgent-alert-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const now = Date.now()
    // Auto-show after 24 hours (86400000ms)
    if (now - dismissedTime < 86400000) {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('urgent-alert-dismissed', Date.now().toString())
  }

  // Color scheme based on urgency
  const colorScheme = {
    critical: {
      bg: 'bg-[var(--color-status-high-bg)]',
      border: 'border-[var(--color-status-high-border)]',
      text: 'text-[var(--color-status-high)]',
      iconBg: 'bg-[var(--color-status-high)]',
      iconText: 'text-white',
      buttonBg: 'bg-[var(--color-status-high)] hover:bg-[var(--color-danger-600)]',
      buttonText: 'text-white',
    },
    warning: {
      bg: 'bg-[var(--color-status-medium-bg)]',
      border: 'border-[var(--color-status-medium-border)]',
      text: 'text-[var(--color-status-medium)]',
      iconBg: 'bg-[var(--color-status-medium)]',
      iconText: 'text-white',
      buttonBg: 'bg-[var(--color-status-medium)] hover:bg-[var(--color-warning-600)]',
      buttonText: 'text-white',
    },
    notice: {
      bg: 'bg-[var(--color-info-bg)]',
      border: 'border-[var(--color-info-border)]',
      text: 'text-[var(--color-info)]',
      iconBg: 'bg-[var(--color-info)]',
      iconText: 'text-white',
      buttonBg: 'bg-[var(--color-info)] hover:bg-[var(--color-accent-600)]',
      buttonText: 'text-white',
    },
  }

  const colors = colorScheme[urgencyLevel]

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn('relative overflow-hidden rounded-lg border p-4', colors.bg, colors.border)}
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                colors.iconBg
              )}
            >
              <AlertCircle className={cn('h-5 w-5', colors.iconText)} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className={cn('font-semibold', colors.text)}>
                {total} Certification{total !== 1 ? 's' : ''} Expiring Soon
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {critical > 0 && (
                  <span className={colors.text}>
                    <span className="font-medium">{critical}</span> within 7 days
                  </span>
                )}
                {warning > 0 && (
                  <span className={colors.text}>
                    <span className="font-medium">{warning}</span> within 14 days
                  </span>
                )}
                {notice > 0 && (
                  <span className={colors.text}>
                    <span className="font-medium">{notice}</span> within 30 days
                  </span>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/dashboard/certifications?filter=expiring"
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                colors.buttonBg,
                colors.buttonText
              )}
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                'hover:bg-black/5'
              )}
              aria-label="Dismiss alert"
            >
              <X className={cn('h-4 w-4', colors.text)} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
