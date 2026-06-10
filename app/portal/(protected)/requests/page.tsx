/**
 * Pilot Portal - My Requests Page
 * Developer: Maurice Rondeau
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Calendar, Plane, Loader2, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHead } from '@/components/ui/page-head'
import { FlightRequestsList } from '@/components/portal/rdo-sdo-requests-list'
import LeaveRequestsList from '@/components/pilot/leave-requests-list'
import type { FlightRequest } from '@/lib/services/pilot-flight-service'
import type { LeaveRequest } from '@/lib/services/unified-request-service'

const tabs = [
  { id: 'leave', label: 'Leave Requests', icon: Calendar },
  { id: 'rdo-sdo', label: 'RDO/SDO Requests', icon: Plane },
] as const

const TAB_IDS = ['leave', 'rdo-sdo'] as const
type TabId = (typeof tabs)[number]['id']

function FetchErrorBand({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border p-8 text-center"
    >
      <AlertCircle className="text-destructive h-6 w-6" aria-hidden="true" />
      <p className="text-foreground text-sm">{message} Check your connection and try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export default function MyRequestsPage() {
  // Two-way URL sync: ?tab= deep links work and tab switches update the URL
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_IDS).withDefault('leave')
  )
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [flightRequests, setFlightRequests] = useState<FlightRequest[]>([])
  const [isLoadingLeave, setIsLoadingLeave] = useState(true)
  const [isLoadingFlight, setIsLoadingFlight] = useState(true)
  // Distinguish "failed to load" from "no requests" — a pilot on a flaky
  // connection must never mistake an error for an empty list
  const [leaveError, setLeaveError] = useState(false)
  const [flightError, setFlightError] = useState(false)

  const fetchLeaveRequests = useCallback(async () => {
    setIsLoadingLeave(true)
    setLeaveError(false)
    try {
      const response = await fetch('/api/portal/leave-requests', { credentials: 'include' })
      if (!response.ok) throw new Error('Request failed')
      const result = await response.json()
      if (!result.success) throw new Error('Request failed')
      setLeaveRequests(result.data || [])
    } catch {
      setLeaveError(true)
    } finally {
      setIsLoadingLeave(false)
    }
  }, [])

  const fetchFlightRequests = useCallback(async () => {
    setIsLoadingFlight(true)
    setFlightError(false)
    try {
      const response = await fetch('/api/portal/flight-requests', { credentials: 'include' })
      if (!response.ok) throw new Error('Request failed')
      const result = await response.json()
      if (!result.success) throw new Error('Request failed')
      setFlightRequests(result.data || [])
    } catch {
      setFlightError(true)
    } finally {
      setIsLoadingFlight(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaveRequests()
    fetchFlightRequests()
  }, [fetchLeaveRequests, fetchFlightRequests])

  const newHref =
    activeTab === 'rdo-sdo' ? '/portal/flight-requests/new' : '/portal/leave-requests/new'
  const newLabel = activeTab === 'rdo-sdo' ? 'New RDO/SDO Request' : 'New Leave Request'

  const tabNav = (
    <nav className="border-border -mb-px flex gap-6 border-b">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const count = tab.id === 'leave' ? leaveRequests.length : flightRequests.length
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-foreground text-foreground'
                : 'text-muted-foreground hover:text-foreground/80 hover:border-border border-transparent'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
            <span className="text-muted-foreground text-xs">{count}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div>
      <PageHead
        title="My Requests"
        description="View and manage your leave and RDO/SDO requests."
        action={
          <Button asChild size="sm">
            <Link href={newHref}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {newLabel}
            </Link>
          </Button>
        }
        tabs={tabNav}
      />

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {activeTab === 'leave' &&
          (isLoadingLeave ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : leaveError ? (
            <FetchErrorBand
              message="Couldn't load your leave requests."
              onRetry={fetchLeaveRequests}
            />
          ) : (
            <LeaveRequestsList requests={leaveRequests} />
          ))}

        {activeTab === 'rdo-sdo' &&
          (isLoadingFlight ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : flightError ? (
            <FetchErrorBand
              message="Couldn't load your RDO/SDO requests."
              onRetry={fetchFlightRequests}
            />
          ) : (
            <FlightRequestsList initialRequests={flightRequests} />
          ))}
      </main>
    </div>
  )
}
