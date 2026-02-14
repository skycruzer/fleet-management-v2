/**
 * Leave Calendar Utility Functions
 * Helper functions for calendar event handling and date calculations
 */

import type { LeaveRequest } from '@/lib/services/unified-request-service'

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
  // Handle nullable end_date - default to start_date for single-day requests
  const endDate = request.end_date ? new Date(request.end_date) : new Date(request.start_date)

  return {
    id: request.id,
    pilotName: request.name || 'Unknown',
    rank: request.rank || 'Unknown',
    leaveType: request.request_type || 'UNKNOWN',
    startDate: new Date(request.start_date),
    endDate,
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
    APPROVED: 'bg-[var(--color-success-muted)]',
    SUBMITTED: 'bg-[var(--color-warning-muted)]',
    PENDING: 'bg-[var(--color-warning-muted)]',
    IN_REVIEW: 'bg-[var(--color-warning-muted)]',
    DENIED: 'bg-[var(--color-destructive-muted)]',
    WITHDRAWN: 'bg-muted/60',
    CANCELLED: 'bg-muted',
  }

  return statusColors[event.status] || 'bg-[var(--color-info-bg)]'
}

/**
 * Get text color for event based on status
 */
export function getEventTextColor(event: CalendarEvent): string {
  const statusColors: Record<string, string> = {
    APPROVED: 'text-[var(--color-success-500)]',
    PENDING: 'text-[var(--color-warning-500)]',
    DENIED: 'text-[var(--color-danger-500)]',
    CANCELLED: 'text-muted-foreground',
  }

  return statusColors[event.status] || 'text-[var(--color-info)]'
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
    return 'bg-[var(--color-destructive-muted)]'
  }

  // Warning: Exactly 10 or 11 available
  if (captainsAvailable <= 11 || fosAvailable <= 11) {
    return 'bg-[var(--color-warning-muted)]'
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
