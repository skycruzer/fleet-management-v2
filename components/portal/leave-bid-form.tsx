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

import { useState, useEffect } from 'react'
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
    initialData?.options.map(opt => ({
      priority: opt.priority,
      start_date: opt.start_date,
      end_date: opt.end_date,
      roster_periods: []
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

  // Calculate roster periods when dates change
  useEffect(() => {
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
        } catch (error) {
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
  }, [options.map((o) => `${o.start_date}-${o.end_date}`).join('|')])

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

      const url = isEdit && initialData?.id
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
      'border-cyan-300 bg-cyan-50',
      'border-blue-300 bg-blue-50',
      'border-indigo-300 bg-indigo-50',
      'border-purple-300 bg-purple-50',
    ]
    return colors[priority - 1] || 'border-gray-300 bg-gray-50'
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year Selection */}
          <div>
            <label htmlFor="bid-year" className="mb-2 block text-sm font-medium text-gray-700">
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose which year you want to submit your leave bid for
            </p>
          </div>

          {/* Instructions */}
          <Alert className="border-cyan-200 bg-cyan-50">
            <AlertDescription className="text-sm text-cyan-900">
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
                className={`rounded-lg border-2 p-4 transition-all ${getPriorityColor(option.priority)}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {getPriorityLabel(option.priority)}
                  </h3>
                  {(option.start_date || option.end_date) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => clearOption(option.priority)}
                      className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Start Date */}
                  <div>
                    <label
                      htmlFor={`start-${option.priority}`}
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      id={`start-${option.priority}`}
                      value={option.start_date}
                      onChange={(e) => updateOption(option.priority, 'start_date', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      min={`${bidYear}-01-01`}
                      max={`${bidYear}-12-31`}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label
                      htmlFor={`end-${option.priority}`}
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      id={`end-${option.priority}`}
                      value={option.end_date}
                      onChange={(e) => updateOption(option.priority, 'end_date', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      min={option.start_date || `${bidYear}-01-01`}
                      max={`${bidYear}-12-31`}
                      disabled={!option.start_date}
                    />
                  </div>
                </div>

                {/* Date Preview with Roster Periods */}
                {option.start_date && option.end_date && (
                  <div className="mt-3 space-y-2 rounded-md bg-white px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {format(new Date(option.start_date), 'MMM dd, yyyy')} -{' '}
                        {format(new Date(option.end_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">
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
                      <div className="border-t border-gray-200 pt-2">
                        <p className="text-xs font-medium text-gray-600">Roster Period(s):</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {option.roster_periods.map((rp, index) => (
                            <span
                              key={index}
                              className="inline-flex rounded bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800"
                            >
                              {rp}
                            </span>
                          ))}
                        </div>
                        {option.roster_periods.length > 1 && (
                          <p className="mt-1 text-xs text-orange-600">
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
          <div className="flex justify-end gap-3 pt-4">
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Leave Bid'}
            </Button>
          </div>
        </form>
    </div>
  )
}
