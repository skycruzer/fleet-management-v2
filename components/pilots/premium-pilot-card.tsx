'use client'

import { motion } from 'framer-motion'
import { User, Star, Calendar, FileCheck, TrendingUp, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PilotCardProps {
  pilot: {
    id: string
    firstName: string
    lastName: string
    rank: 'Captain' | 'First Officer'
    seniorityNumber: number
    commencementDate: string
    status: 'active' | 'inactive' | 'leave'
    complianceRate: number
    certifications: {
      total: number
      expiring: number
      expired: number
    }
    qualifications?: {
      lineCaptain?: boolean
      trainingCaptain?: boolean
      examiner?: boolean
    }
  }
}

export function PremiumPilotCard({ pilot }: PilotCardProps) {
  const {
    firstName,
    lastName,
    rank,
    seniorityNumber,
    commencementDate,
    status,
    complianceRate,
    certifications,
    qualifications,
  } = pilot

  const fullName = `${firstName} ${lastName}`
  const isCaptain = rank === 'Captain'

  // Determine compliance status color
  const getComplianceColor = () => {
    if (complianceRate >= 90) return 'success'
    if (complianceRate >= 70) return 'warning'
    return 'danger'
  }

  const complianceColor = getComplianceColor()

  // Determine status ring color
  const getStatusRingColor = () => {
    if (status === 'active' && certifications.expired === 0) return 'ring-[var(--color-status-low)]'
    if (certifications.expiring > 0) return 'ring-[var(--color-status-medium)]'
    if (certifications.expired > 0) return 'ring-[var(--color-status-high)]'
    return 'ring-border'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group hover:border-primary border-border bg-card relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all hover:shadow-lg"
    >
      {/* Background gradient on hover */}
      <div className="from-primary-50/0 to-primary-100/0 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with status ring */}
            <div className={cn('rounded-full p-0.5 ring-2', getStatusRingColor())}>
              <div className="from-primary-500 to-primary-700 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-foreground font-semibold">{fullName}</h3>
                {isCaptain && (
                  <div className="bg-accent-100 flex items-center gap-1 rounded-full px-2 py-0.5">
                    <Star className="text-accent-600 h-3 w-3" />
                    <span className="text-accent-700 text-xs font-semibold">CPT</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm">Seniority #{seniorityNumber}</p>
            </div>
          </div>

          {/* More options button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Qualifications (for Captains) */}
        {isCaptain && qualifications && (
          <div className="mb-4 flex flex-wrap gap-2">
            {qualifications.lineCaptain && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
                Line Captain
              </span>
            )}
            {qualifications.trainingCaptain && (
              <span className="rounded-full bg-[var(--color-status-low-bg)] px-2 py-1 text-xs font-medium text-[var(--color-status-low)]">
                Training
              </span>
            )}
            {qualifications.examiner && (
              <span className="bg-accent/10 text-accent rounded-full px-2 py-1 text-xs font-medium">
                Examiner
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-muted mb-4 grid grid-cols-3 gap-4 rounded-lg p-4">
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-1">
              <FileCheck className="h-4 w-4" />
              <span className="text-xs">Certs</span>
            </div>
            <p className="text-foreground text-lg font-semibold">{certifications.total}</p>
          </div>

          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Expiring</span>
            </div>
            <p
              className={cn(
                'text-lg font-semibold',
                certifications.expiring > 0
                  ? 'text-[var(--color-status-medium)]'
                  : 'text-foreground'
              )}
            >
              {certifications.expiring}
            </p>
          </div>

          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Status</span>
            </div>
            <p
              className={cn(
                'text-xs font-semibold uppercase',
                status === 'active' && 'text-[var(--color-status-low)]',
                status === 'leave' && 'text-[var(--color-status-medium)]',
                status === 'inactive' && 'text-muted-foreground'
              )}
            >
              {status}
            </p>
          </div>
        </div>

        {/* Compliance Progress Bar */}
        <div className="mb-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">Compliance Rate</span>
            <span
              className={cn(
                'text-sm font-semibold',
                complianceColor === 'success' && 'text-[var(--color-status-low)]',
                complianceColor === 'warning' && 'text-[var(--color-status-medium)]',
                complianceColor === 'danger' && 'text-[var(--color-status-high)]'
              )}
            >
              {complianceRate}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${complianceRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                complianceColor === 'success' && 'bg-[var(--color-status-low)]',
                complianceColor === 'warning' && 'bg-[var(--color-status-medium)]',
                complianceColor === 'danger' && 'bg-[var(--color-status-high)]'
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-muted-foreground text-xs">
            Since{' '}
            {new Date(commencementDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            })}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            View Profile
          </motion.button>
        </div>

        {/* Bottom accent border */}
        <div
          className={cn(
            'from-primary-500 to-primary-700 absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full'
          )}
        />
      </div>
    </motion.div>
  )
}
