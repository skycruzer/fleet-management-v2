/**
 * View Mode Toggle Component
 *
 * Toggle between Table, Cards, and Calendar views for requests.
 * Supports both controlled mode (value/onChange) and URL-based mode (currentView).
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, Table, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewMode = 'table' | 'cards' | 'calendar'

interface ViewModeToggleProps {
  /** Current view mode (URL-based mode) */
  currentView?: ViewMode
  /** Controlled value (controlled mode) */
  value?: ViewMode
  /** Controlled onChange handler */
  onChange?: (mode: ViewMode) => void
  className?: string
}

const viewModes = [
  { value: 'table' as const, icon: Table, label: 'Table View' },
  { value: 'cards' as const, icon: LayoutGrid, label: 'Cards View' },
  { value: 'calendar' as const, icon: Calendar, label: 'Calendar View' },
]

export function ViewModeToggle({ currentView, value, onChange, className }: ViewModeToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use currentView (URL-based) or value (controlled)
  const activeMode = currentView ?? value ?? 'table'

  const handleModeChange = (mode: ViewMode) => {
    if (onChange) {
      // Controlled mode
      onChange(mode)
    } else {
      // URL-based mode - update search params
      const params = new URLSearchParams(searchParams.toString())
      params.set('view', mode)
      router.push(`?${params.toString()}`)
    }
  }

  return (
    <div className={cn('bg-muted flex items-center gap-1 rounded-lg border p-1', className)}>
      {viewModes.map(({ value: mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant={activeMode === mode ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange(mode)}
          className={cn('h-8 w-8 p-0', activeMode === mode && 'bg-background shadow-sm')}
          aria-label={label}
          aria-pressed={activeMode === mode}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}
