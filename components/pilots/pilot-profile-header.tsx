/**
 * Pilot Profile Header Component
 *
 * Clean, monochromatic hero section for the pilot detail page.
 * Shows avatar, name, rank, seniority, and quick action buttons.
 *
 * Developer: Maurice Rondeau
 * @date February 2026
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { Button } from '@/components/ui/button'
import { RetirementCountdownBadge } from '@/components/pilots/retirement-countdown-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Edit, EllipsisVertical, Trash2, Star, Shield, Briefcase } from 'lucide-react'
import { RankBadge } from '@/components/pilots/rank-badge'
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
      initial={shouldAnimate ? { opacity: 0, y: -12 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--color-border)] bg-card p-6 shadow-[var(--shadow-card)] sm:p-8"
    >
      {/* Top row: Avatar + Identity + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar with status ring */}
          <div
            className={cn(
              'flex-shrink-0 rounded-full p-0.5 ring-3',
              pilot.is_active
                ? 'ring-[var(--color-status-low)]'
                : 'ring-[var(--color-border)]'
            )}
          >
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold sm:h-20 sm:w-20 sm:text-2xl',
                isCaptain
                  ? 'bg-[var(--color-warning-muted)] text-[var(--color-warning-500)]'
                  : 'bg-[var(--color-muted)] text-foreground'
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
            <h1 className="text-foreground text-2xl font-bold tracking-[-0.02em] sm:text-4xl">
              {fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RankBadge rank={pilot.role} />
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-semibold',
                  pilot.is_active
                    ? 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)] ring-1 ring-[var(--color-status-low-border)]'
                    : 'bg-[var(--color-muted)] text-muted-foreground ring-1 ring-[var(--color-border)]'
                )}
              >
                {pilot.is_active ? 'Active' : 'Inactive'}
              </span>
              {pilot.seniority_number && (
                <span className="rounded-full bg-[var(--color-warning-muted)] px-3 py-1 text-sm font-semibold text-[var(--color-warning-600)] ring-1 ring-[var(--color-warning-500)]/30">
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
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Link href={`/dashboard/pilots/${pilot.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onPilotDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Pilot'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-[var(--color-muted)] p-3">
          <div className="text-muted-foreground mb-0.5 flex items-center gap-1.5 text-sm font-medium">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Employee ID
          </div>
          <div className="text-foreground text-lg font-bold sm:text-xl">{pilot.employee_id}</div>
        </div>
        <div className="rounded-lg bg-[var(--color-muted)] p-3">
          <div className="text-muted-foreground mb-0.5 flex items-center gap-1.5 text-sm font-medium">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            Contract
          </div>
          <div className="text-foreground text-lg font-bold sm:text-xl">
            {pilot.contract_type || 'Not Set'}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-muted)] p-3">
          <div className="text-muted-foreground mb-0.5 text-sm font-medium">Current Certs</div>
          <div className="text-lg font-bold text-[var(--color-status-low)] sm:text-xl">
            {pilot.certificationStatus.current}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-muted)] p-3">
          <div className="text-muted-foreground mb-0.5 text-sm font-medium">Attention</div>
          <div
            className={cn(
              'text-lg font-bold sm:text-xl',
              pilot.certificationStatus.expiring + pilot.certificationStatus.expired > 0
                ? 'text-[var(--color-status-medium)]'
                : 'text-foreground'
            )}
          >
            {pilot.certificationStatus.expiring + pilot.certificationStatus.expired}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
