/**
 * View Mode Toggle Component
 *
 * Toggle between Table, Cards, and Calendar views for requests.
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

'use client'

import { LayoutGrid, Table, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewMode = 'table' | 'cards' | 'calendar'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

const viewModes = [
  { value: 'table' as const, icon: Table, label: 'Table View' },
  { value: 'cards' as const, icon: LayoutGrid, label: 'Cards View' },
  { value: 'calendar' as const, icon: Calendar, label: 'Calendar View' },
]

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-lg border bg-muted p-1', className)}>
      {viewModes.map(({ value: mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant={value === mode ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onChange(mode)}
          className={cn(
            'h-8 w-8 p-0',
            value === mode && 'bg-background shadow-sm'
          )}
          aria-label={label}
          aria-pressed={value === mode}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}
