/**
 * Date Filter Toggle Component
 * Author: Maurice Rondeau
 * Date: November 16, 2025
 *
 * Provides consistent toggle between Roster Period and Date Range filtering
 * Used across all report forms (Leave, Flight, Certifications)
 */

'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Calendar, CalendarRange } from 'lucide-react'

export type DateFilterMode = 'roster' | 'dateRange'

interface DateFilterToggleProps {
  value: DateFilterMode
  onValueChange: (value: DateFilterMode) => void
  className?: string
}

export function DateFilterToggle({ value, onValueChange, className = '' }: DateFilterToggleProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">Filter By</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onValueChange(val as DateFilterMode)}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="roster" id="filter-roster" />
          <Label
            htmlFor="filter-roster"
            className="flex cursor-pointer items-center gap-2 font-normal"
          >
            <Calendar className="h-4 w-4" />
            Roster Period
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dateRange" id="filter-dateRange" />
          <Label
            htmlFor="filter-dateRange"
            className="flex cursor-pointer items-center gap-2 font-normal"
          >
            <CalendarRange className="h-4 w-4" />
            Date Range
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
