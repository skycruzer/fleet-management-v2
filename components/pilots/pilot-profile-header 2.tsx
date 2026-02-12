/**
 * Pilot Profile Header Component
 *
 * Persistent hero section rendered above tabs on the pilot detail page.
 * Shows avatar with status ring, name, rank badge, seniority,
 * retirement countdown, and quick action buttons.
 *
 * Developer: Maurice Rondeau
 * @date February 2026
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { Button } from '@/components/ui/button'
import { RetirementCountdownBadge } from '@/components/pilots/RetirementCountdownBadge'
import { ArrowLeft, Edit, Trash2, Star, Shield, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Pilot } from './pilot-detail-tabs'

interface PilotProfileHeaderProps {
  pilot: Pilot
  retirementAge: number
  onPilotDelete: () => Promise<void>
  isDeleting: boolean
}

export function PilotProfileHeader({
  pilot,
  retirementAge,
  onPilotDelete,
  isDeleting,
}: PilotProfileHeaderProps) {
  const { shouldAnimate } = useAnimationSettings()

  const fullName = [pilot.first_name, pilot.middle_name, pilot.last_name].filter(Boolean).join(' ')
  const initials = `${pilot.first_name[0]}${pilot.last_name[0]}`.toUpperCase()
  const isCaptain = pilot.role === 'Captain'

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: -20 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      className="via-primary relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-accent-600)] to-[var(--color-accent-800)] p-6 text-white shadow-2xl sm:p-8"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative">
        {/* Top row: Avatar + Identity + Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar with status ring */}
            <div
              className={cn(
                'flex-shrink-0 rounded-full p-0.5 ring-3',
                pilot.is_active ? 'ring-[var(--color-status-low)]' : 'ring-white/30'
              )}
            >
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold sm:h-20 sm:w-20 sm:text-2xl',
                  isCaptain
                    ? 'bg-white/20 text-[var(--color-warning-500)] backdrop-blur-sm'
                    : 'bg-white/20 text-white backdrop-blur-sm'
                )}
              >
                {isCaptain ? (
                  <Star className="h-8 w-8 text-[var(--color-warning-500)] sm:h-10 sm:w-10" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-4xl">{fullName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                  {pilot.role}
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm',
                    pilot.is_active
                      ? 'bg-[var(--color-status-low)]/30 ring-1 ring-[var(--color-status-low)]/50'
                      : 'bg-white/20 ring-1 ring-white/30'
                  )}
                >
                  {pilot.is_active ? 'Active' : 'Inactive'}
                </span>
                {pilot.seniority_number && (
                  <span className="rounded-full bg-[var(--color-warning-muted)] px-3 py-1 text-sm font-semibold ring-1 ring-[var(--color-warning-500)]/50 backdrop-blur-sm">
                    Seniority #{pilot.seniority_number}
                  </span>
                )}
                <RetirementCountdownBadge
                  dateOfBirth={pilot.date_of_birth}
                  retirementAge={retirementAge}
                  compact={false}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <Link href="/dashboard/pilots">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <Link href={`/dashboard/pilots/${pilot.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={onPilotDelete} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-0.5 flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Employee ID
            </div>
            <div className="text-lg font-bold sm:text-xl">{pilot.employee_id}</div>
          </div>
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-0.5 flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
              Contract
            </div>
            <div className="text-lg font-bold sm:text-xl">{pilot.contract_type || 'Not Set'}</div>
          </div>
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-0.5 text-sm font-medium text-white/80">Current Certs</div>
            <div className="text-lg font-bold text-[var(--color-status-low)] sm:text-xl">
              {pilot.certificationStatus.current}
            </div>
          </div>
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-0.5 text-sm font-medium text-white/80">Attention</div>
            <div
              className={cn(
                'text-lg font-bold sm:text-xl',
                pilot.certificationStatus.expiring + pilot.certificationStatus.expired > 0
                  ? 'text-[var(--color-status-medium)]'
                  : 'text-white'
              )}
            >
              {pilot.certificationStatus.expiring + pilot.certificationStatus.expired}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
