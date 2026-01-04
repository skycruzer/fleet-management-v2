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
    if (status === 'active' && certifications.expired === 0) return 'ring-success-500'
    if (certifications.expiring > 0) return 'ring-warning-500'
    if (certifications.expired > 0) return 'ring-danger-500'
    return 'ring-slate-300'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group hover:border-primary-300 dark:hover:border-primary-600 relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Background gradient on hover */}
      <div className="from-primary-50/0 to-primary-100/0 dark:from-primary-900/0 dark:to-primary-800/0 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />

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
                <h3 className="font-semibold text-slate-900 dark:text-white">{fullName}</h3>
                {isCaptain && (
                  <div className="bg-accent-100 dark:bg-accent-900/30 flex items-center gap-1 rounded-full px-2 py-0.5">
                    <Star className="text-accent-600 dark:text-accent-400 h-3 w-3" />
                    <span className="text-accent-700 dark:text-accent-400 text-xs font-semibold">
                      CPT
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Seniority #{seniorityNumber}
              </p>
            </div>
          </div>

          {/* More options button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Qualifications (for Captains) */}
        {isCaptain && qualifications && (
          <div className="mb-4 flex flex-wrap gap-2">
            {qualifications.lineCaptain && (
              <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full px-2 py-1 text-xs font-medium">
                Line Captain
              </span>
            )}
            {qualifications.trainingCaptain && (
              <span className="bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400 rounded-full px-2 py-1 text-xs font-medium">
                Training
              </span>
            )}
            {qualifications.examiner && (
              <span className="bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 rounded-full px-2 py-1 text-xs font-medium">
                Examiner
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-4 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
          <div>
            <div className="mb-1 flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <FileCheck className="h-4 w-4" />
              <span className="text-xs">Certs</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {certifications.total}
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Expiring</span>
            </div>
            <p
              className={cn(
                'text-lg font-semibold',
                certifications.expiring > 0
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-slate-900 dark:text-white'
              )}
            >
              {certifications.expiring}
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Status</span>
            </div>
            <p
              className={cn(
                'text-xs font-semibold uppercase',
                status === 'active' && 'text-success-600 dark:text-success-400',
                status === 'leave' && 'text-warning-600 dark:text-warning-400',
                status === 'inactive' && 'text-slate-600 dark:text-slate-400'
              )}
            >
              {status}
            </p>
          </div>
        </div>

        {/* Compliance Progress Bar */}
        <div className="mb-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Compliance Rate
            </span>
            <span
              className={cn(
                'text-sm font-semibold',
                complianceColor === 'success' && 'text-success-600 dark:text-success-400',
                complianceColor === 'warning' && 'text-warning-600 dark:text-warning-400',
                complianceColor === 'danger' && 'text-danger-600 dark:text-danger-400'
              )}
            >
              {complianceRate}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${complianceRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                complianceColor === 'success' && 'bg-success-500',
                complianceColor === 'warning' && 'bg-warning-500',
                complianceColor === 'danger' && 'bg-danger-500'
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-500">
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
