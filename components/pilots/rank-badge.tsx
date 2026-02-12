/**
 * Rank Badge Component
 * Standardized badge for displaying pilot ranks across the application
 *
 * Developer: Maurice Rondeau
 */

import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RankBadgeProps {
  rank: string
  className?: string
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  const isCaptain = rank === 'Captain'

  return (
    <Badge
      variant={isCaptain ? 'warning' : 'secondary'}
      className={cn(isCaptain && 'gap-1', className)}
    >
      {isCaptain && <Star className="h-3 w-3" aria-hidden="true" />}
      {rank}
    </Badge>
  )
}
