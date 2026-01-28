/**
 * Pilot Portal - My Requests Page
 * Developer: Maurice Rondeau
 *
 * Consolidates: Leave Requests + RDO/SDO Requests
 * Tabs: Leave Requests | RDO/SDO Requests
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Calendar, Plane, Loader2 } from 'lucide-react'
import { FlightRequestsList } from '@/components/portal/rdo-sdo-requests-list'
import LeaveRequestsList from '@/components/pilot/LeaveRequestsList'
import type { FlightRequest } from '@/lib/services/pilot-flight-service'
import type { LeaveRequest } from '@/lib/services/unified-request-service'

const tabs = [
  { id: 'leave', label: 'Leave Requests', icon: Calendar },
  { id: 'rdo-sdo', label: 'RDO/SDO Requests', icon: Plane },
] as const

type TabId = (typeof tabs)[number]['id']

export default function MyRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('leave')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [flightRequests, setFlightRequests] = useState<FlightRequest[]>([])
  const [isLoadingLeave, setIsLoadingLeave] = useState(true)
  const [isLoadingFlight, setIsLoadingFlight] = useState(true)

  useEffect(() => {
    async function fetchLeaveRequests() {
      try {
        const response = await fetch('/api/portal/leave-requests', {
          credentials: 'include',
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setLeaveRequests(result.data || [])
          }
        }
      } catch {
        // Silently handle error - empty list will be shown
      } finally {
        setIsLoadingLeave(false)
      }
    }

    async function fetchFlightRequests() {
      try {
        const response = await fetch('/api/portal/flight-requests', {
          credentials: 'include',
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setFlightRequests(result.data || [])
          }
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">My Requests</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View and manage your leave and RDO/SDO requests.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/[0.08]">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'text-muted-foreground hover:text-foreground/80 border-transparent hover:border-white/[0.1]'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'leave' && (
          <div>
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
          <div>
            {isLoadingFlight ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : (
              <FlightRequestsList initialRequests={flightRequests} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
