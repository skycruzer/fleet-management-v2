'use client'

import * as React from 'react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type RankKey = 'captain' | 'first_officer' | 'rhs_captain' | 'training_captain' | 'examiner_captain'

interface RankConfig {
  label: string
  abbreviation: string
  variant: BadgeProps['variant']
  className: string
}

const RANK_CONFIG: Record<RankKey, RankConfig> = {
  captain: {
    label: 'Captain',
    abbreviation: 'CPT',
    variant: 'default',
    className:
      'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]',
  },
  first_officer: {
    label: 'First Officer',
    abbreviation: 'FO',
    variant: 'secondary',
    className: '',
  },
  rhs_captain: {
    label: 'RHS Captain',
    abbreviation: 'RHS',
    variant: 'outline',
    className:
      'border-[var(--color-info-border,hsl(var(--accent)))] bg-accent/10 text-accent-foreground',
  },
  training_captain: {
    label: 'Training Captain',
    abbreviation: 'TRN',
    variant: 'outline',
    className: 'border-success/20 bg-success/10 text-success',
  },
  examiner_captain: {
    label: 'Examiner Captain',
    abbreviation: 'EXM',
    variant: 'outline',
    className: 'border-warning/20 bg-warning/10 text-warning',
  },
}

function normalizeRank(rank: string): RankKey | null {
  const lower = rank.toLowerCase().trim()

  if (lower === 'captain' || lower === 'cpt') return 'captain'
  if (lower === 'first officer' || lower === 'fo' || lower === 'first_officer')
    return 'first_officer'
  if (lower === 'rhs captain' || lower === 'rhs' || lower === 'rhs_captain') return 'rhs_captain'
  if (
    lower === 'training captain' ||
    lower === 'trn' ||
    lower === 'training_captain' ||
    lower === 'training'
  )
    return 'training_captain'
  if (
    lower === 'examiner captain' ||
    lower === 'examiner' ||
    lower === 'exm' ||
    lower === 'examiner_captain'
  )
    return 'examiner_captain'

  return null
}

export interface RankBadgeProps {
  /** The rank string (e.g., "Captain", "First Officer", "FO", "Training Captain") */
  rank: string
  /** Show full rank name instead of abbreviation */
  showFull?: boolean
  /** Badge size */
  size?: BadgeProps['size']
  /** Additional CSS classes */
  className?: string
}

function RankBadge({ rank, showFull = false, size, className }: RankBadgeProps) {
  const key = normalizeRank(rank)

  if (!key) {
    return (
      <Badge variant="secondary" size={size} className={className}>
        {rank}
      </Badge>
    )
  }

  const config = RANK_CONFIG[key]
  const displayText = showFull ? config.label : config.abbreviation

  if (showFull) {
    return (
      <Badge variant={config.variant} size={size} className={cn(config.className, className)}>
        {displayText}
      </Badge>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} size={size} className={cn(config.className, className)}>
            {displayText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { RankBadge }
