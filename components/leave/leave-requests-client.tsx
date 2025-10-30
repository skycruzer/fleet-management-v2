/**
 * Leave Requests Client Component
 * Client-side filtering and review functionality for leave requests
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeaveRequestGroup } from '@/components/leave/leave-request-group'
import { Calendar, Filter } from 'lucide-react'
import type { LeaveRequest } from '@/lib/services/leave-service'

interface LeaveRequestsClientProps {
  requests: LeaveRequest[]
  availablePeriods: string[]
}

export function LeaveRequestsClient({ requests, availablePeriods }: LeaveRequestsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')

  // Filter requests by selected period
  const filteredRequests = useMemo(() => {
    if (selectedPeriod === 'all') {
      return requests
    }
    return requests.filter((req) => req.roster_period === selectedPeriod)
  }, [requests, selectedPeriod])

  // Calculate stats from filtered data
  const stats = filteredRequests.reduce(
    (acc, req) => {
      acc.total++
      if (req.status === 'PENDING') acc.pending++
      else if (req.status === 'APPROVED') acc.approved++
      else if (req.status === 'DENIED') acc.denied++
      acc.totalDays += req.days_count
      return acc
    },
    { total: 0, pending: 0, approved: 0, denied: 0, totalDays: 0 }
  )

  // Group filtered requests by type -> role -> sort by start date
  const groupedRequests = filteredRequests.reduce(
    (acc, req) => {
      const type = req.request_type || 'Other'
      const role = (req.pilots?.role as 'Captain' | 'First Officer') || 'Unknown'

      if (!acc[type]) {
        acc[type] = { Captain: [], 'First Officer': [], Unknown: [] }
      }
      if (!acc[type][role]) {
        acc[type][role] = []
      }
      acc[type][role].push(req)
      return acc
    },
    {} as Record<string, Record<string, LeaveRequest[]>>
  )

  // Sort requests within each role by start date
  Object.keys(groupedRequests).forEach((type) => {
    Object.keys(groupedRequests[type]).forEach((role) => {
      groupedRequests[type][role].sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )
    })
  })

  // Sort types alphabetically
  const sortedTypes = Object.keys(groupedRequests).sort()

  return (
    <>
      {/* Filter Section */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Filter Requests</h3>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="period-filter" className="text-sm font-medium text-foreground">
              Roster Period:
            </label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="period-filter" className="w-[200px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {availablePeriods.sort().map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedPeriod !== 'all' && (
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} for{' '}
            {selectedPeriod}
          </div>
        )}
      </Card>

      {/* Leave Request Type Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">
            {selectedPeriod === 'all' ? 'All Request Types' : `Requests for ${selectedPeriod}`}
          </h3>
          <div className="text-muted-foreground text-sm">
            {sortedTypes.length} types • {filteredRequests.length} total requests
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Leave requests are grouped by type and role, sorted by start date within each group.
        </p>
      </Card>

      {/* Grouped Leave Requests by Type and Role */}
      <div className="space-y-4">
        {sortedTypes.map((type) => (
          <LeaveRequestGroup
            key={type}
            type={type}
            roleGroups={groupedRequests[type]}
            defaultExpanded
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <EmptyState
          icon={Calendar}
          title={selectedPeriod === 'all' ? 'No leave requests found' : `No requests for ${selectedPeriod}`}
          description={
            selectedPeriod === 'all'
              ? 'Submit your first leave request to get started with the leave management system.'
              : 'No leave requests have been submitted for this roster period.'
          }
          action={
            selectedPeriod === 'all'
              ? {
                  label: 'Submit Leave Request',
                  href: '/dashboard/leave/new',
                }
              : undefined
          }
        />
      )}
    </>
  )
}
