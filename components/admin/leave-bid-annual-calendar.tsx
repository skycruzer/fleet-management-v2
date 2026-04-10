'use client'

/**
 * Annual Leave Bid Calendar Component
 * Displays a full year calendar view with all leave bid information
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns'

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
}

interface Pilot {
  id: string
  first_name: string
  last_name: string
  rank: string | null
  seniority_number: number | null
}

interface LeaveBid {
  id: string
  bid_year: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING'
  pilots: Pilot
  leave_bid_options: LeaveBidOption[]
}

interface LeaveBidAnnualCalendarProps {
  bids: LeaveBid[]
  initialYear?: number
}

export function LeaveBidAnnualCalendar({ bids, initialYear }: LeaveBidAnnualCalendarProps) {
  const currentYear = initialYear || new Date().getFullYear() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Filter bids for selected year
  const yearBids = bids.filter((bid) => bid.bid_year === selectedYear)

  // Get all dates with leave bids
  const getLeaveBidsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const bidsOnDate: Array<{ bid: LeaveBid; option: LeaveBidOption }> = []

    yearBids.forEach((bid) => {
      bid.leave_bid_options.forEach((option) => {
        const startDate = new Date(option.start_date)
        const endDate = new Date(option.end_date)

        if (date >= startDate && date <= endDate) {
          bidsOnDate.push({ bid, option })
        }
      })
    })

    return bidsOnDate
  }

  // Get months for the year
  const months = Array.from({ length: 12 }, (_, i) => new Date(selectedYear, i, 1))

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <Card key={monthDate.toISOString()} className="overflow-hidden">
        <CardHeader className="bg-primary p-3">
          <CardTitle className="text-primary-foreground text-center text-base font-bold">
            {format(monthDate, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-muted-foreground text-center text-xs font-semibold">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const bidsOnDate = getLeaveBidsForDate(day)
              const isCurrentMonth = isSameMonth(day, monthDate)
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`relative min-h-[50px] rounded border p-1 text-xs ${isCurrentMonth ? 'bg-card' : 'bg-muted'} ${isCurrentDay ? 'border-primary border-2' : 'border-border'} ${bidsOnDate.length > 0 ? 'bg-[var(--color-info-bg)]' : ''} `}
                >
                  <div
                    className={`text-xs font-semibold ${!isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground'}`}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Show bid indicators */}
                  {bidsOnDate.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {bidsOnDate.slice(0, 3).map(({ bid, option }) => (
                        <div
                          key={`${bid.id}-${option.id}`}
                          className={`truncate rounded px-1 py-0.5 text-[8px] font-medium ${bid.status === 'APPROVED' ? 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]' : ''} ${bid.status === 'PENDING' ? 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]' : ''} ${bid.status === 'REJECTED' ? 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]' : ''} `}
                          title={`${bid.pilots.first_name} ${bid.pilots.last_name} - Priority ${option.priority}`}
                        >
                          {bid.pilots.last_name} P{option.priority}
                        </div>
                      ))}
                      {bidsOnDate.length > 3 && (
                        <div className="text-muted-foreground text-[8px]">
                          +{bidsOnDate.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
              {selectedYear - 1}
            </Button>

            <div className="text-center">
              <h2 className="text-foreground text-2xl font-bold">{selectedYear}</h2>
              <p className="text-muted-foreground text-sm">
                {yearBids.length} bid{yearBids.length !== 1 ? 's' : ''} for this year
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear + 1)}>
              {selectedYear + 1}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]"></div>
              <span className="text-muted-foreground text-sm">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)]"></div>
              <span className="text-muted-foreground text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]"></div>
              <span className="text-muted-foreground text-sm">Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="border-accent h-4 w-4 rounded border-2"></div>
              <span className="text-muted-foreground text-sm">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid - 4 columns x 3 rows */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map(renderMonth)}
      </div>
    </div>
  )
}
