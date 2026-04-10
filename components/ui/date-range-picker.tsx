/**
 * Date Range Picker Component
 *
 * A unified date range selector that supports:
 * - Single-day requests with single-click auto-complete
 * - Multi-day ranges with visual highlighting
 * - Popover-based calendar UI
 *
 * Developer: Maurice Rondeau
 * Date: December 20, 2025
 */

'use client'

import * as React from 'react'
import { format, isSameDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface DateRangePickerProps {
  /** Current date range value */
  value?: DateRange
  /** Callback when range changes */
  onChange: (range: DateRange | undefined) => void
  /** Function to disable specific dates */
  disabled?: (date: Date) => boolean
  /** Number of months to display (default: 1) */
  numberOfMonths?: number
  /** Placeholder text when no dates selected */
  placeholder?: string
  /** Additional class names */
  className?: string
  /** ID for form integration */
  id?: string
}

/**
 * Format date range for display
 * - Single day: "Dec 22, 2025"
 * - Same month: "Dec 22 - 27, 2025"
 * - Different months: "Dec 22 - Jan 3, 2025"
 * - Different years: "Dec 22, 2024 - Jan 3, 2025"
 */
function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return ''

  const from = range.from
  const to = range.to

  // Single day or no end date
  if (!to || isSameDay(from, to)) {
    return format(from, 'MMM d, yyyy')
  }

  const fromYear = from.getFullYear()
  const toYear = to.getFullYear()
  const fromMonth = from.getMonth()
  const toMonth = to.getMonth()

  // Different years
  if (fromYear !== toYear) {
    return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`
  }

  // Same year, different months
  if (fromMonth !== toMonth) {
    return `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}`
  }

  // Same month and year
  return `${format(from, 'MMM d')} - ${format(to, 'd, yyyy')}`
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
  numberOfMonths = 1,
  placeholder = 'Select dates',
  className,
  id,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  // Track if we're in the middle of selecting a range
  const [isSelectingRange, setIsSelectingRange] = React.useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      // Reset selection
      onChange(undefined)
      setIsSelectingRange(false)
      return
    }

    // If we have a from date but no to date (first click in range selection)
    if (range.from && !range.to) {
      if (!isSelectingRange) {
        // First click: auto-complete with same date (single-day request)
        // But also mark that we're starting a potential range selection
        onChange({ from: range.from, to: range.from })
        setIsSelectingRange(true)
      } else {
        // Second click deselected the end, just update
        onChange(range)
      }
      return
    }

    // We have both from and to
    if (range.from && range.to) {
      onChange(range)
      setIsSelectingRange(false)
      // Close popover after complete selection
      setOpen(false)
    }
  }

  // Reset selection state when popover closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setIsSelectingRange(false)
    }
  }

  const displayValue = formatDateRange(value)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !displayValue && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={handleSelect}
          numberOfMonths={numberOfMonths}
          disabled={disabled}
        />
        <div className="text-muted-foreground border-t px-3 py-2 text-xs">
          Click once for single day, click again for range
        </div>
      </PopoverContent>
    </Popover>
  )
}
