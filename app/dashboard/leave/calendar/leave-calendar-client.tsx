/**
 * Leave Calendar Client Component
 * Client-side interactive calendar with filters and event details
 *
 * @version 1.0.0
 * @since 2025-10-26
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LeaveCalendar } from '@/components/leave/leave-calendar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { LeaveRequest } from '@/lib/services/leave-service'
import type { CalendarEvent } from '@/lib/utils/leave-calendar-utils'
import { format, differenceInDays } from 'date-fns'
import { X, Users, Calendar as CalendarIcon } from 'lucide-react'

interface LeaveCalendarClientProps {
  leaveRequests: LeaveRequest[]
  totalCaptains: number
  totalFirstOfficers: number
}

export function LeaveCalendarClient({
  leaveRequests,
  totalCaptains,
  totalFirstOfficers,
}: LeaveCalendarClientProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [rankFilter, setRankFilter] = useState<string>('all')
  const [showRecommendedDates, setShowRecommendedDates] = useState(false)
  const [highlightRank, setHighlightRank] = useState<'Captain' | 'First Officer' | undefined>()
  const [selectedDay, setSelectedDay] = useState<{
    date: Date
    events: CalendarEvent[]
  } | null>(null)

  // Apply filters
  const filteredRequests = leaveRequests.filter((request) => {
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false
    }

    if (rankFilter !== 'all' && request.pilots?.role !== rankFilter) {
      return false
    }

    return true
  })

  const handleDayClick = (date: Date, events: CalendarEvent[]) => {
    if (events.length > 0) {
      setSelectedDay({ date, events })
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    // Navigate to leave request details
    router.push(`/dashboard/leave/${event.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DENIED">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rank Filter */}
          <div className="space-y-2">
            <Label htmlFor="rank-filter">Rank</Label>
            <Select value={rankFilter} onValueChange={setRankFilter}>
              <SelectTrigger id="rank-filter">
                <SelectValue placeholder="All ranks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranks</SelectItem>
                <SelectItem value="Captain">Captain</SelectItem>
                <SelectItem value="First Officer">First Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recommended Dates */}
          <div className="space-y-2">
            <Label htmlFor="show-recommended">Show Recommended Dates</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="show-recommended"
                checked={showRecommendedDates}
                onCheckedChange={(checked) => {
                  setShowRecommendedDates(checked)
                  if (!checked) {
                    setHighlightRank(undefined)
                  }
                }}
              />
              {showRecommendedDates && (
                <Select
                  value={highlightRank}
                  onValueChange={(value) =>
                    setHighlightRank(value as 'Captain' | 'First Officer')
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Captain">Captain</SelectItem>
                    <SelectItem value="First Officer">First Officer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="space-y-2 flex flex-col justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all')
                setRankFilter('all')
                setShowRecommendedDates(false)
                setHighlightRank(undefined)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredRequests.length} of {leaveRequests.length} leave
              requests
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Captains: {totalCaptains} | First Officers: {totalFirstOfficers}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <LeaveCalendar
        leaveRequests={filteredRequests}
        totalCaptains={totalCaptains}
        totalFirstOfficers={totalFirstOfficers}
        showRecommendedDates={showRecommendedDates}
        highlightRank={highlightRank}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
      />

      {/* Day Details Modal */}
      {selectedDay && (
        <Card className="p-6 fixed bottom-4 right-4 w-96 shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">
                {format(selectedDay.date, 'MMMM d, yyyy')}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDay(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-4">
              {selectedDay.events.length} leave request
              {selectedDay.events.length !== 1 ? 's' : ''}
            </div>

            {selectedDay.events.map((event) => (
              <div
                key={event.id}
                className="p-3 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{event.pilotName}</span>
                  <Badge variant="outline">{event.rank}</Badge>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Type:</span>
                    <Badge className="text-xs">{event.leaveType}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge
                      className={
                        event.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'PENDING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">
                      {differenceInDays(event.endDate, event.startDate) + 1} days
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t mt-2">
                    {format(event.startDate, 'MMM d')} -{' '}
                    {format(event.endDate, 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}

            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => setSelectedDay(null)}
            >
              Close
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
