/**
 * Pilot Portal - My Requests Page
 * Developer: Maurice Rondeau
 */

'use client'

import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
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

const TAB_VALUES = ['leave', 'rdo-sdo'] as const
type TabId = (typeof TAB_VALUES)[number]

export default function MyRequestsPage() {
  // nuqs manages URL sync automatically — keeps deep links, back/forward, and refresh in sync
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_VALUES).withDefault('leave')
  )
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    leave: null,
    'rdo-sdo': null,
  })
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

  // WAI-ARIA tabs keyboard pattern: Left/Right move between tabs, Home/End jump to ends
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const nextTab = tabs[nextIndex].id
    void setActiveTab(nextTab)
    tabRefs.current[nextTab]?.focus()
  }

  const tabNav = (
    <nav
      role="tablist"
      aria-label="Request type"
      className="border-border -mb-px flex gap-6 border-b"
    >
      {tabs.map((tab, index) => {
        const Icon = tab.icon
        const count = tab.id === 'leave' ? leaveRequests.length : flightRequests.length
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[tab.id] = node
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
              isActive
                ? 'border-foreground text-foreground'
                : 'text-muted-foreground hover:text-foreground/80 hover:border-border border-transparent'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
            <span className="text-muted-foreground text-xs">
              {count}
              <span className="sr-only"> {tab.label.toLowerCase()}</span>
            </span>
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
        {activeTab === 'leave' && (
          <div role="tabpanel" id="panel-leave" aria-labelledby="tab-leave">
            {isLoadingLeave ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : (
              <LeaveRequestsList requests={leaveRequests} />
            )}
          </div>
        )}

        {activeTab === 'rdo-sdo' && (
          <div role="tabpanel" id="panel-rdo-sdo" aria-labelledby="tab-rdo-sdo">
            {isLoadingFlight ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : (
              <FlightRequestsList initialRequests={flightRequests} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
