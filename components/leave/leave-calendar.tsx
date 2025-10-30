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

import { useState, useEffect } from 'react'
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import type { LeaveRequest } from '@/lib/services/leave-service'
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
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  // Convert leave requests to calendar events
  useEffect(() => {
    const events = leaveRequests.map(leaveRequestToEvent)
    setCalendarEvents(events)
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
      isSameMonth(event.startDate, currentMonth) ||
      isSameMonth(event.endDate, currentMonth)
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
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
            <div className="text-lg font-semibold min-w-[200px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button onClick={goToNextMonth} variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Month Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Users className="h-5 w-5 text-gray-600" />
            <div>
              <div className="text-sm text-gray-600">Total Requests</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm text-green-600">Approved</div>
              <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm text-blue-600">Pending</div>
              <div className="text-2xl font-bold text-blue-900">{stats.pending}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-sm text-red-600">Denied</div>
              <div className="text-2xl font-bold text-red-900">{stats.denied}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
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
        <h3 className="text-sm font-semibold mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
            <span>Approved Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
            <span>Pending Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
            <span>Denied Leave</span>
          </div>
          {showRecommendedDates && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Recommended Date</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-50 border border-green-200"></div>
            <span>Safe Crew Levels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
            <span>Warning Crew Levels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
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
      className={`
        min-h-[120px] p-2 border rounded-lg transition-all cursor-pointer
        hover:border-primary hover:shadow-md
        ${isToday ? 'border-primary border-2' : 'border-gray-200'}
        ${dayStatusColor}
      `}
      onClick={onClick}
    >
      {/* Day Number and Recommended Badge */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>
          {format(date, 'd')}
        </span>
        {isRecommended && (
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
        )}
      </div>

      {/* Crew Availability */}
      <div className="text-xs text-gray-600 mb-2">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>
            C:{totalCaptains - availability.captainsOnLeave} FO:{totalFirstOfficers - availability.fosOnLeave}
          </span>
        </div>
      </div>

      {/* Leave Events */}
      <div className="space-y-1">
        {events.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className={`
              text-xs p-1 rounded truncate cursor-pointer
              ${getEventBgColor(event)}
              ${getEventTextColor(event)}
              border
            `}
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
          <div className="text-xs text-gray-500 pl-1">
            +{events.length - 3} more
          </div>
        )}
      </div>
    </div>
  )
}
