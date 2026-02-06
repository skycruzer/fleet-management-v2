/**
 * Card Density Toggle
 * Compact / comfortable toggle for card-heavy pages
 *
 * Author: Maurice Rondeau
 */

'use client'

import { LayoutGrid, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCardDensity, type CardDensity } from '@/lib/hooks/use-card-density'
import { cn } from '@/lib/utils'

interface DensityToggleProps {
  className?: string
}

export function DensityToggle({ className }: DensityToggleProps) {
  const { density, toggleDensity } = useCardDensity()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDensity}
      className={cn('h-8 w-8', className)}
      aria-label={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} view`}
      title={density === 'comfortable' ? 'Compact view' : 'Comfortable view'}
    >
      {density === 'comfortable' ? (
        <LayoutList className="h-4 w-4" />
      ) : (
        <LayoutGrid className="h-4 w-4" />
      )}
    </Button>
  )
}

/**
 * CSS class helper for density-aware card padding
 */
export function densityClasses(density: CardDensity) {
  return density === 'compact' ? 'p-3 gap-2' : 'p-6 gap-4'
}
