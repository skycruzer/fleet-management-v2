/**
 * Date Preset Buttons Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Phase 2.4: Quick date range selection buttons
 * Provides preset buttons for common date ranges
 */

'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { DATE_PRESETS, type DateRange } from '@/lib/utils/date-presets'

interface DatePresetButtonsProps {
  onPresetSelect: (dateRange: DateRange) => void
  className?: string
}

export function DatePresetButtons({ onPresetSelect, className }: DatePresetButtonsProps) {
  const presets = [
    { key: 'thisMonth', ...DATE_PRESETS.thisMonth },
    { key: 'lastMonth', ...DATE_PRESETS.lastMonth },
    { key: 'thisQuarter', ...DATE_PRESETS.thisQuarter },
    { key: 'lastQuarter', ...DATE_PRESETS.lastQuarter },
    { key: 'thisYear', ...DATE_PRESETS.thisYear },
    { key: 'last30Days', ...DATE_PRESETS.last30Days },
    { key: 'last90Days', ...DATE_PRESETS.last90Days },
  ]

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <Calendar className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-sm font-medium">Quick Dates:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPresetSelect(preset.fn())}
            className="h-8 text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
