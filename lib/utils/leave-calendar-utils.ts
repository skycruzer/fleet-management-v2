/**
 * Leave Calendar Utility Functions
 * Helper functions for calendar event handling and date calculations
 */

import type { LeaveRequest } from '@/lib/services/leave-service'

export interface CalendarEvent {
  id: string
  pilotName: string
  rank: string
  leaveType: string
  startDate: Date
  endDate: Date
  status: string
  seniority?: number
}

export interface DayEvents {
  date: Date
  events: CalendarEvent[]
  captainsOnLeave: number
  fosOnLeave: number
}

/**
 * Convert a leave request to a calendar event
 */
export function leaveRequestToEvent(request: LeaveRequest): CalendarEvent {
  return {
    id: request.id,
    pilotName: request.pilot_name || 'Unknown',
    rank: request.pilot_role || 'Unknown',
    leaveType: request.request_type || 'UNKNOWN',
    startDate: new Date(request.start_date),
    endDate: new Date(request.end_date),
    status: request.workflow_status,
  }
}

/**
 * Get all events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)
    const checkDate = new Date(date)

    eventStart.setHours(0, 0, 0, 0)
    eventEnd.setHours(0, 0, 0, 0)
    checkDate.setHours(0, 0, 0, 0)

    return checkDate >= eventStart && checkDate <= eventEnd
  })
}

/**
 * Calculate day availability (captains and FOs on leave)
 */
export function calculateDayAvailability(
  events: CalendarEvent[],
  date: Date
): { captains: number; firstOfficers: number } {
  const dayEvents = getEventsForDate(events, date)

  return {
    captains: dayEvents.filter((e) => e.rank === 'Captain').length,
    firstOfficers: dayEvents.filter((e) => e.rank === 'First Officer').length,
  }
}

/**
 * Get background color for event based on status
 */
export function getEventBgColor(event: CalendarEvent): string {
  const statusColors: Record<string, string> = {
    APPROVED: 'bg-green-100 dark:bg-green-900/30',
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30',
    DENIED: 'bg-red-100 dark:bg-red-900/30',
    CANCELLED: 'bg-gray-100 dark:bg-gray-900/30',
  }

  return statusColors[event.status] || 'bg-blue-100 dark:bg-blue-900/30'
}

/**
 * Get text color for event based on status
 */
export function getEventTextColor(event: CalendarEvent): string {
  const statusColors: Record<string, string> = {
    APPROVED: 'text-green-800 dark:text-green-200',
    PENDING: 'text-yellow-800 dark:text-yellow-200',
    DENIED: 'text-red-800 dark:text-red-200',
    CANCELLED: 'text-gray-800 dark:text-gray-200',
  }

  return statusColors[event.status] || 'text-blue-800 dark:text-blue-200'
}

/**
 * Get day status color based on availability
 */
export function getDayStatusColor(
  captainsOnLeave: number,
  fosOnLeave: number,
  totalCaptains: number,
  totalFirstOfficers: number
): string {
  const captainsAvailable = totalCaptains - captainsOnLeave
  const fosAvailable = totalFirstOfficers - fosOnLeave

  // Critical: Less than 10 available
  if (captainsAvailable < 10 || fosAvailable < 10) {
    return 'bg-red-50 dark:bg-red-950'
  }

  // Warning: Exactly 10 or 11 available
  if (captainsAvailable <= 11 || fosAvailable <= 11) {
    return 'bg-yellow-50 dark:bg-yellow-950'
  }

  // Good: More than 11 available
  return ''
}

/**
 * Check if a date is recommended based on availability
 */
export function isRecommendedDate(
  date: Date,
  events: CalendarEvent[],
  rank: string,
  totalCaptains: number,
  totalFirstOfficers: number
): boolean {
  const { captains, firstOfficers } = calculateDayAvailability(events, date)

  if (rank === 'Captain') {
    const available = totalCaptains - captains
    return available > 11 // More than minimum + buffer
  }

  if (rank === 'First Officer') {
    const available = totalFirstOfficers - firstOfficers
    return available > 11
  }

  return false
}
