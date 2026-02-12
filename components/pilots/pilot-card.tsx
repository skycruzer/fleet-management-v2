/**
 * Pilot Card Component
 *
 * Rich card for the card grid view mode with avatar, status ring,
 * rank badge, seniority number, contract type, and quick action buttons.
 *
 * Developer: Maurice Rondeau
 * @date February 2026
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { cardHover, staggerItem } from '@/lib/animations/motion-variants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil } from 'lucide-react'
import { RankBadge } from '@/components/pilots/rank-badge'
import { cn } from '@/lib/utils'

interface PilotCardPilot {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  role: string
  is_active: boolean
  seniority_number: number | null
  contract_type: string | null
  employee_id: string
}

interface PilotCardProps {
  pilot: PilotCardPilot
}

export function PilotCard({ pilot }: PilotCardProps) {
  const { shouldAnimate, getVariants } = useAnimationSettings()

  const fullName = [pilot.first_name, pilot.middle_name, pilot.last_name].filter(Boolean).join(' ')
  const initials = `${pilot.first_name[0]}${pilot.last_name[0]}`.toUpperCase()
  const isCaptain = pilot.role === 'Captain'

  return (
    <motion.article
      variants={getVariants(staggerItem)}
      whileHover={shouldAnimate ? cardHover : undefined}
      className="group border-border bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[var(--color-primary-500)] focus-within:ring-offset-2 hover:shadow-lg"
      role="article"
      aria-label={`Pilot card for ${fullName}`}
    >
      <div className="flex flex-1 flex-col p-5">
        {/* Header: Avatar + Identity */}
        <div className="mb-4 flex items-start gap-3">
          {/* Avatar with status ring */}
          <div
            className={cn(
              'flex-shrink-0 rounded-full p-0.5 ring-2',
              pilot.is_active ? 'ring-[var(--color-status-low)]' : 'ring-border'
            )}
          >
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white',
                isCaptain
                  ? 'bg-gradient-to-br from-[var(--color-warning-500)] to-[var(--color-warning-600)]'
                  : 'bg-gradient-to-br from-[var(--color-accent-600)] to-[var(--color-accent-800)]'
              )}
            >
              {initials}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-foreground truncate text-sm font-semibold">{fullName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <RankBadge rank={pilot.role} className="text-xs" />
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  pilot.is_active
                    ? 'border-[var(--color-status-low-border)] text-[var(--color-status-low)]'
                    : 'text-muted-foreground'
                )}
              >
                {pilot.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {pilot.seniority_number && (
            <div className="text-muted-foreground flex items-center justify-between">
              <span>Seniority</span>
              <span className="text-foreground font-medium">#{pilot.seniority_number}</span>
            </div>
          )}
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Employee ID</span>
            <span className="text-foreground font-medium">{pilot.employee_id}</span>
          </div>
          {pilot.contract_type && (
            <div className="text-muted-foreground flex items-center justify-between">
              <span>Contract</span>
              <span className="text-foreground font-medium">{pilot.contract_type}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="border-border flex items-center gap-2 border-t px-5 py-3">
        <Link href={`/dashboard/pilots/${pilot.id}`} className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            aria-label={`View ${fullName}`}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            View
          </Button>
        </Link>
        <Link href={`/dashboard/pilots/${pilot.id}/edit`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            aria-label={`Edit ${fullName}`}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Button>
        </Link>
      </div>
    </motion.article>
  )
}
