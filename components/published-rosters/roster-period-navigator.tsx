// Maurice Rondeau — Roster Period Navigator
'use client'

import { useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getCurrentRosterPeriodObject,
  getNextRosterPeriodObject,
  getPreviousRosterPeriodObject,
  formatRosterPeriodFromObject,
  type RosterPeriod,
} from '@/lib/utils/roster-utils'
import { cn } from '@/lib/utils'

interface RosterPeriodNavigatorProps {
  currentPeriodCode: string
  onPeriodChange: (code: string) => void
  uploadedPeriodCodes: string[]
  onUploadClick: () => void
  onViewPdfClick?: () => void
  hasPdf: boolean
}

function buildPeriodFromCode(code: string): RosterPeriod {
  const match = code.match(/^RP(\d{1,2})\/(\d{4})$/)
  if (!match) return getCurrentRosterPeriodObject()

  const number = parseInt(match[1], 10)
  const year = parseInt(match[2], 10)

  // Calculate start date from anchor: RP13/2025 starts Nov 8, 2025
  const anchorStart = new Date(Date.UTC(2025, 10, 8)) // Nov 8, 2025
  const anchorPeriod = 13
  const anchorYear = 2025

  const periodsDiff = (year - anchorYear) * 13 + (number - anchorPeriod)
  const daysDiff = periodsDiff * 28

  const startDate = new Date(anchorStart.getTime() + daysDiff * 86400000)
  const endDate = new Date(startDate.getTime() + 27 * 86400000)

  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const daysRemaining = Math.ceil((endDate.getTime() - todayMidnight.getTime()) / 86400000)

  return { code, number, year, startDate, endDate, daysRemaining }
}

// Generate selectable periods: 2 years back, 1 year forward from current
function generatePeriodOptions(): RosterPeriod[] {
  const current = getCurrentRosterPeriodObject()
  const periods: RosterPeriod[] = []

  // Go back 26 periods (~2 years)
  let p = current
  for (let i = 0; i < 26; i++) {
    p = getPreviousRosterPeriodObject(p)
  }

  // Now go forward 39 periods (26 back + current + 12 forward)
  for (let i = 0; i < 39; i++) {
    periods.push(p)
    p = getNextRosterPeriodObject(p)
  }

  return periods
}

export function RosterPeriodNavigator({
  currentPeriodCode,
  onPeriodChange,
  uploadedPeriodCodes,
  onUploadClick,
  onViewPdfClick,
  hasPdf,
}: RosterPeriodNavigatorProps) {
  const currentPeriod = buildPeriodFromCode(currentPeriodCode)
  const periodOptions = useMemo(() => generatePeriodOptions(), [])
  const isUploaded = uploadedPeriodCodes.includes(currentPeriodCode)
  const todayPeriod = getCurrentRosterPeriodObject()
  const isCurrentPeriod = currentPeriodCode === todayPeriod.code

  const handlePrev = useCallback(() => {
    const prev = getPreviousRosterPeriodObject(currentPeriod)
    onPeriodChange(prev.code)
  }, [currentPeriod, onPeriodChange])

  const handleNext = useCallback(() => {
    const next = getNextRosterPeriodObject(currentPeriod)
    onPeriodChange(next.code)
  }, [currentPeriod, onPeriodChange])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {/* Prev/Next Arrows */}
        <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Previous period">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Period Selector */}
        <Select value={currentPeriodCode} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[320px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {periodOptions.map((p) => {
              const uploaded = uploadedPeriodCodes.includes(p.code)
              const isCurrent = p.code === todayPeriod.code
              return (
                <SelectItem key={p.code} value={p.code}>
                  <span className="flex items-center gap-2">
                    {uploaded && (
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    )}
                    <span className={cn(isCurrent && 'font-semibold')}>
                      {formatRosterPeriodFromObject(p)}
                    </span>
                    {isCurrent && <span className="text-muted-foreground text-xs">(current)</span>}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next period">
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Current period badge */}
        {isCurrentPeriod && (
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Current Period
          </span>
        )}

        {isUploaded && (
          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
            Uploaded
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {hasPdf && onViewPdfClick && (
          <Button variant="outline" size="sm" onClick={onViewPdfClick} className="gap-1.5">
            <FileText className="h-4 w-4" />
            View PDF
          </Button>
        )}
        <Button size="sm" onClick={onUploadClick} className="gap-1.5">
          <Upload className="h-4 w-4" />
          Upload Roster
        </Button>
      </div>
    </div>
  )
}
