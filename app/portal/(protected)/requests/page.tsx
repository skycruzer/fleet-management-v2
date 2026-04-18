/**
 * Pilot Portal - My Requests Page
 * Developer: Maurice Rondeau
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Calendar, Plane, Loader2, Plus } from 'lucide-react'
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

type TabId = (typeof tabs)[number]['id']

function isValidTab(value: string | null): value is TabId {
  return value === 'leave' || value === 'rdo-sdo'
}

export default function MyRequestsPage() {
  const searchParams = useSearchParams()
  const initialTab = isValidTab(searchParams.get('tab'))
    ? (searchParams.get('tab')! as TabId)
    : 'leave'
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [flightRequests, setFlightRequests] = useState<FlightRequest[]>([])
  const [isLoadingLeave, setIsLoadingLeave] = useState(true)
  const [isLoadingFlight, setIsLoadingFlight] = useState(true)

  useEffect(() => {
    async function fetchLeaveRequests() {
      try {
        const response = await fetch('/api/portal/leave-requests', { credentials: 'include' })
        if (response.ok) {
          const result = await response.json()
          if (result.success) setLeaveRequests(result.data || [])
        }
      } catch {
        // Silently handle error - empty list will be shown
      } finally {
        setIsLoadingLeave(false)
      }
    }

    async function fetchFlightRequests() {
      try {
        const response = await fetch('/api/portal/flight-requests', { credentials: 'include' })
        if (response.ok) {
          const result = await response.json()
          if (result.success) setFlightRequests(result.data || [])
        }
      } catch {
        // Silently handle error - empty list will be shown
      } finally {
        setIsLoadingFlight(false)
      }
    }

    fetchLeaveRequests()
    fetchFlightRequests()
  }, [])

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
          <Link href={newHref}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {newLabel}
            </Button>
          </Link>
        }
        tabs={tabNav}
      />

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {activeTab === 'leave' &&
          (isLoadingLeave ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : (
            <LeaveRequestsList requests={leaveRequests} />
          ))}

        {activeTab === 'rdo-sdo' &&
          (isLoadingFlight ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : (
            <FlightRequestsList initialRequests={flightRequests} />
          ))}
      </main>
    </div>
  )
}
