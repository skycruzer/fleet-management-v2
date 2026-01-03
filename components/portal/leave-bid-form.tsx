'use client'

/**
 * Leave Bid Form Component
 *
 * Developer: Maurice Rondeau
 *
 * Allows pilots to submit their annual leave bid with 4 preferred options.
 * Each option includes a start date and end date for the coming year.
 * Automatically calculates and displays roster periods for each date range.
 *
 * @version 1.1.0
 * @updated 2025-10-27 - Added developer attribution
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Trash2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { getRosterPeriodFromDate, getAffectedRosterPeriods } from '@/lib/utils/roster-utils'

interface LeaveBidOption {
  priority: number
  start_date: string
  end_date: string
  roster_periods?: string[] // Calculated roster periods
}

interface LeaveBidFormProps {
  onSuccess?: () => void
  initialData?: {
    id: string
    bid_year: number
    options: Array<{
      priority: number
      start_date: string
      end_date: string
    }>
  }
  isEdit?: boolean
}

export function LeaveBidForm({ onSuccess, initialData, isEdit }: LeaveBidFormProps = {}) {
  const currentYear = new Date().getFullYear()
  const [bidYear, setBidYear] = useState<number>(initialData?.bid_year || currentYear + 1)
  const [options, setOptions] = useState<LeaveBidOption[]>(
    initialData?.options.map((opt) => ({
      priority: opt.priority,
      start_date: opt.start_date,
      end_date: opt.end_date,
      roster_periods: [],
    })) || [
      { priority: 1, start_date: '', end_date: '', roster_periods: [] },
      { priority: 2, start_date: '', end_date: '', roster_periods: [] },
      { priority: 3, start_date: '', end_date: '', roster_periods: [] },
      { priority: 4, start_date: '', end_date: '', roster_periods: [] },
    ]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Generate year options (next year and up to 2 years ahead)
  const yearOptions = [currentYear + 1, currentYear + 2]

  // Create a stable dependency key for date changes
  const optionDatesKey = useMemo(
    () => options.map((o) => `${o.start_date}-${o.end_date}`).join('|'),
    [options]
  )

  // Track previous dates key to detect changes during render (React Compiler pattern)
  const [prevDatesKey, setPrevDatesKey] = useState(optionDatesKey)

  // Calculate roster periods when dates change - using render-time comparison
  if (optionDatesKey !== prevDatesKey) {
    setPrevDatesKey(optionDatesKey)

    const updatedOptions = options.map((opt) => {
      if (opt.start_date && opt.end_date) {
        try {
          const affectedPeriods = getAffectedRosterPeriods(
            new Date(opt.start_date),
            new Date(opt.end_date)
          )
          return {
            ...opt,
            roster_periods: affectedPeriods.map((p) => p.code),
          }
        } catch {
          return { ...opt, roster_periods: [] }
        }
      }
      return { ...opt, roster_periods: [] }
    })

    // Only update if roster_periods actually changed
    const hasChanged = updatedOptions.some((opt, index) => {
      const current = options[index].roster_periods || []
      const updated = opt.roster_periods || []
      return JSON.stringify(current) !== JSON.stringify(updated)
    })

    if (hasChanged) {
      setOptions(updatedOptions)
    }
  }

  const updateOption = (priority: number, field: 'start_date' | 'end_date', value: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.priority === priority ? { ...opt, [field]: value } : opt))
    )
    setError('')
    setSuccess('')
  }

  const clearOption = (priority: number) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.priority === priority
          ? { ...opt, start_date: '', end_date: '', roster_periods: [] }
          : opt
      )
    )
  }

  const validateBid = (): boolean => {
    // At least one option must be filled
    const filledOptions = options.filter((opt) => opt.start_date && opt.end_date)
    if (filledOptions.length === 0) {
      setError('Please fill at least one leave option')
      return false
    }

    // Validate each filled option
    for (const opt of filledOptions) {
      const startDate = new Date(opt.start_date)
      const endDate = new Date(opt.end_date)

      // End date must be after start date
      if (endDate <= startDate) {
        setError(`Option ${opt.priority}: End date must be after start date`)
        return false
      }

      // Must be for the selected bid year
      if (startDate.getFullYear() !== bidYear && endDate.getFullYear() !== bidYear) {
        setError(`Option ${opt.priority}: Leave dates must be in ${bidYear}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateBid()) {
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Filter out empty options
      const filledOptions = options.filter((opt) => opt.start_date && opt.end_date)

      const url =
        isEdit && initialData?.id
          ? `/api/portal/leave-bids?id=${initialData.id}`
          : '/api/portal/leave-bids'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bid_year: bidYear,
          options: filledOptions,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to submit leave bid')
        setIsSubmitting(false)
        return
      }

      setSuccess('Leave bid submitted successfully!')
      setIsSubmitting(false)

      // Reset form and close dialog after 1.5 seconds
      setTimeout(() => {
        setOptions([
          { priority: 1, start_date: '', end_date: '', roster_periods: [] },
          { priority: 2, start_date: '', end_date: '', roster_periods: [] },
          { priority: 3, start_date: '', end_date: '', roster_periods: [] },
          { priority: 4, start_date: '', end_date: '', roster_periods: [] },
        ])
        setSuccess('')
        setBidYear(currentYear + 1)
        // Call onSuccess callback if provided (to close dialog)
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const getPriorityLabel = (priority: number): string => {
    const labels = ['1st Choice', '2nd Choice', '3rd Choice', '4th Choice']
    return labels[priority - 1] || `Option ${priority}`
  }

  const getPriorityColor = (priority: number): string => {
    const colors = [
      'border-accent/30 bg-accent/5',
      'border-accent/25 bg-accent/[0.03]',
      'border-border bg-muted/30',
      'border-border bg-muted/20',
    ]
    return colors[priority - 1] || 'border-border bg-muted/10'
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Year Selection */}
        <div className="space-y-1.5">
          <label htmlFor="bid-year" className="text-foreground text-sm font-medium">
            Select Year for Leave Bid
          </label>
          <select
            id="bid-year"
            value={bidYear}
            onChange={(e) => {
              setBidYear(Number(e.target.value))
              // Reset dates when changing year
              setOptions([
                { priority: 1, start_date: '', end_date: '', roster_periods: [] },
                { priority: 2, start_date: '', end_date: '', roster_periods: [] },
                { priority: 3, start_date: '', end_date: '', roster_periods: [] },
                { priority: 4, start_date: '', end_date: '', roster_periods: [] },
              ])
            }}
            className="border-border bg-background focus:ring-ring/20 focus:border-foreground/30 flex h-9 w-full rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 focus:ring-2 focus:outline-none"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            Choose which year you want to submit your leave bid for
          </p>
        </div>

        {/* Instructions */}
        <Alert className="border-accent/20 bg-accent/5">
          <AlertDescription className="text-sm">
            Select up to 4 preferred leave periods in order of preference. At least one option is
            required. All dates must be in {bidYear}.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Leave Options */}
        <div className="space-y-4">
          {options.map((option) => (
            <div
              key={option.priority}
              className={`rounded-lg border p-4 transition-all duration-200 ${getPriorityColor(option.priority)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-foreground text-sm font-semibold">
                  {getPriorityLabel(option.priority)}
                </h3>
                {(option.start_date || option.end_date) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => clearOption(option.priority)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Start Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`start-${option.priority}`}
                    className="text-foreground text-sm font-medium"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id={`start-${option.priority}`}
                    value={option.start_date}
                    onChange={(e) => updateOption(option.priority, 'start_date', e.target.value)}
                    className="border-border bg-background focus:ring-ring/20 focus:border-foreground/30 flex h-9 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-2 focus:outline-none"
                    min={`${bidYear}-01-01`}
                    max={`${bidYear}-12-31`}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`end-${option.priority}`}
                    className="text-foreground text-sm font-medium"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id={`end-${option.priority}`}
                    value={option.end_date}
                    onChange={(e) => updateOption(option.priority, 'end_date', e.target.value)}
                    className="border-border bg-background focus:ring-ring/20 focus:border-foreground/30 flex h-9 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    min={option.start_date || `${bidYear}-01-01`}
                    max={`${bidYear}-12-31`}
                    disabled={!option.start_date}
                  />
                </div>
              </div>

              {/* Date Preview with Roster Periods */}
              {option.start_date && option.end_date && (
                <div className="bg-background/80 border-border/50 mt-3 space-y-2 rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {format(new Date(option.start_date), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(option.end_date), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {Math.ceil(
                        (new Date(option.end_date).getTime() -
                          new Date(option.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1}{' '}
                      days
                    </p>
                  </div>
                  {/* Roster Periods */}
                  {option.roster_periods && option.roster_periods.length > 0 && (
                    <div className="border-border/50 border-t pt-2">
                      <p className="text-muted-foreground text-xs font-medium">Roster Period(s):</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {option.roster_periods.map((rp, index) => (
                          <span
                            key={index}
                            className="bg-accent/10 text-accent inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          >
                            {rp}
                          </span>
                        ))}
                      </div>
                      {option.roster_periods.length > 1 && (
                        <p className="text-warning mt-1 text-xs">
                          ⚠️ Spans multiple roster periods ({option.roster_periods.length})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="border-border flex justify-end gap-3 border-t pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOptions([
                { priority: 1, start_date: '', end_date: '', roster_periods: [] },
                { priority: 2, start_date: '', end_date: '', roster_periods: [] },
                { priority: 3, start_date: '', end_date: '', roster_periods: [] },
                { priority: 4, start_date: '', end_date: '', roster_periods: [] },
              ])
              setError('')
              setSuccess('')
            }}
          >
            Reset All
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Leave Bid'}
          </Button>
        </div>
      </form>
    </div>
  )
}
