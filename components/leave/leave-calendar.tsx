/**
 * Leave Calendar Component
 * Interactive calendar view for visualizing leave requests and recommended dates
 *
 * Features:
 * - Monthly calendar view
 * - Color-coded leave requests (approved/pending/denied)
 * - Crew availability indicators
 * - Recommended date highlighting
 * - Click to view leave request details
 *
 * @version 1.0.0
 * @since 2025-10-26
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Star,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import type { LeaveRequest } from '@/lib/services/unified-request-service'
import {
  leaveRequestToEvent,
  getEventsForDate,
  calculateDayAvailability,
  getEventBgColor,
  getEventTextColor,
  getDayStatusColor,
  isRecommendedDate,
  type CalendarEvent,
  type DayEvents,
} from '@/lib/utils/leave-calendar-utils'

interface LeaveCalendarProps {
  leaveRequests: LeaveRequest[]
  totalCaptains?: number
  totalFirstOfficers?: number
  showRecommendedDates?: boolean
  highlightRank?: 'Captain' | 'First Officer'
  onDayClick?: (date: Date, events: CalendarEvent[]) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function LeaveCalendar({
  leaveRequests,
  totalCaptains = 14,
  totalFirstOfficers = 13,
  showRecommendedDates = false,
  highlightRank,
  onDayClick,
  onEventClick,
}: LeaveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Convert leave requests to calendar events using useMemo (derived state)
  const calendarEvents = useMemo(() => {
    return leaveRequests.map(leaveRequestToEvent)
  }, [leaveRequests])

  // Get calendar dates
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  // Calculate statistics for current month
  const monthEvents = calendarEvents.filter(
    (event) =>
      isSameMonth(event.startDate, currentMonth) || isSameMonth(event.endDate, currentMonth)
  )

  const stats = {
    total: monthEvents.length,
    approved: monthEvents.filter((e) => e.status === 'APPROVED').length,
    pending: monthEvents.filter((e) => e.status === 'PENDING').length,
    denied: monthEvents.filter((e) => e.status === 'DENIED').length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <CalendarIcon className="h-6 w-6" />
              Leave Calendar
            </h2>
            <Button onClick={goToToday} variant="outline" size="sm">
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={goToPreviousMonth} variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] text-center text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button onClick={goToNextMonth} variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Month Statistics */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            <Users className="text-muted-foreground h-5 w-5" />
            <div>
              <div className="text-muted-foreground text-sm">Total Requests</div>
              <div className="text-foreground text-2xl font-bold">{stats.total}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-status-low-bg)] p-3">
            <CheckCircle className="h-5 w-5 text-[var(--color-status-low)]" />
            <div>
              <div className="text-sm text-[var(--color-status-low)]">Approved</div>
              <div className="text-foreground text-2xl font-bold">{stats.approved}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-info-bg)] p-3">
            <Clock className="h-5 w-5 text-[var(--color-info)]" />
            <div>
              <div className="text-sm text-[var(--color-info)]">Pending</div>
              <div className="text-foreground text-2xl font-bold">{stats.pending}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-status-high-bg)] p-3">
            <XCircle className="h-5 w-5 text-[var(--color-status-high)]" />
            <div>
              <div className="text-sm text-[var(--color-status-high)]">Denied</div>
              <div className="text-foreground text-2xl font-bold">{stats.denied}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-muted-foreground py-2 text-center text-sm font-semibold">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((date) => {
            const events = getEventsForDate(calendarEvents, date)
            const { captains, firstOfficers } = calculateDayAvailability(calendarEvents, date)
            const availability = {
              captainsOnLeave: captains,
              fosOnLeave: firstOfficers,
            }

            const isRecommended =
              showRecommendedDates &&
              highlightRank &&
              isRecommendedDate(
                date,
                calendarEvents,
                highlightRank,
                totalCaptains,
                totalFirstOfficers
              )

            const isToday = isSameDay(date, new Date())

            return (
              <CalendarDay
                key={date.toISOString()}
                date={date}
                events={events}
                availability={availability}
                isToday={isToday}
                isRecommended={isRecommended}
                totalCaptains={totalCaptains}
                totalFirstOfficers={totalFirstOfficers}
                onClick={() => onDayClick?.(date, events)}
                onEventClick={onEventClick}
              />
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Legend</h3>
        <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]"></div>
            <span>Approved Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-[var(--color-info-border)] bg-[var(--color-info-bg)]"></div>
            <span>Pending Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]"></div>
            <span>Denied Leave</span>
          </div>
          {showRecommendedDates && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[var(--color-status-medium)]" />
              <span>Recommended Date</span>
            </div>
          )}
        </div>

        <div className="border-border mt-3 grid grid-cols-3 gap-4 border-t pt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]"></div>
            <span>Safe Crew Levels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)]"></div>
            <span>Warning Crew Levels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]"></div>
            <span>Critical Crew Levels</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

interface CalendarDayProps {
  date: Date
  events: CalendarEvent[]
  availability: Omit<DayEvents, 'date' | 'events'>
  isToday: boolean
  isRecommended?: boolean
  totalCaptains: number
  totalFirstOfficers: number
  onClick?: () => void
  onEventClick?: (event: CalendarEvent) => void
}

function CalendarDay({
  date,
  events,
  availability,
  isToday,
  isRecommended,
  totalCaptains,
  totalFirstOfficers,
  onClick,
  onEventClick,
}: CalendarDayProps) {
  const dayStatusColor = getDayStatusColor(
    availability.captainsOnLeave,
    availability.fosOnLeave,
    totalCaptains,
    totalFirstOfficers
  )

  return (
    <div
      className={`hover:border-primary min-h-[120px] cursor-pointer rounded-lg border p-2 transition-all hover:shadow-md ${isToday ? 'border-primary border-2' : 'border-border'} ${dayStatusColor} `}
      onClick={onClick}
    >
      {/* Day Number and Recommended Badge */}
      <div className="mb-1 flex items-center justify-between">
        <span className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>
          {format(date, 'd')}
        </span>
        {isRecommended && (
          <Star className="h-3 w-3 fill-[var(--color-status-medium)] text-[var(--color-status-medium)]" />
        )}
      </div>

      {/* Crew Availability */}
      <div className="text-muted-foreground mb-2 text-xs">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>
            C:{totalCaptains - availability.captainsOnLeave} FO:
            {totalFirstOfficers - availability.fosOnLeave}
          </span>
        </div>
      </div>

      {/* Leave Events */}
      <div className="space-y-1">
        {events.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className={`cursor-pointer truncate rounded p-1 text-xs ${getEventBgColor(event)} ${getEventTextColor(event)} border`}
            onClick={(e) => {
              e.stopPropagation()
              onEventClick?.(event)
            }}
            title={`${event.pilotName} (${event.rank}) - ${event.leaveType}`}
          >
            {event.pilotName.split(' ')[0]}
          </div>
        ))}

        {events.length > 3 && (
          <div className="text-muted-foreground pl-1 text-xs">+{events.length - 3} more</div>
        )}
      </div>
    </div>
  )
}
