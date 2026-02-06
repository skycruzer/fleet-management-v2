/**
 * Leave Page Client Component
 * Developer: Maurice Rondeau
 *
 * Handles tab navigation and renders the appropriate content for each tab
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CheckCircle, Calendar, CalendarCheck } from 'lucide-react'
import { LeaveApprovalClient } from '@/components/admin/leave-approval-client'
import { LeaveCalendarClient } from './calendar/leave-calendar-client'
import { LeaveBidReviewTable } from '@/components/admin/leave-bid-review-table'
import type { LeaveRequest } from '@/lib/services/unified-request-service'

const tabs = [
  { id: 'approvals', label: 'Pending Approvals', icon: CheckCircle },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'bids', label: 'Leave Bids', icon: CalendarCheck },
] as const

type TabId = (typeof tabs)[number]['id']

interface PendingRequest {
  id: string
  pilot_name?: string
  employee_id?: string
  pilot_role?: 'Captain' | 'First Officer' | null
  request_type:
    | 'RDO'
    | 'SDO'
    | 'ANNUAL'
    | 'SICK'
    | 'LSL'
    | 'LWOP'
    | 'MATERNITY'
    | 'COMPASSIONATE'
    | null
  start_date: string
  end_date: string
  days_count: number
  roster_period: string
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  reason?: string | null
  created_at: string | null
  is_late_request?: boolean | null
}

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
}

interface Pilot {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  employee_id: string | null
  role: string | null
  seniority_number: number | null
}

interface LeaveBid {
  id: string
  roster_period_code: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | null
  created_at: string | null
  updated_at: string | null
  pilot_id: string
  pilots: Pilot
  leave_bid_options: LeaveBidOption[]
  bid_year?: number
}

interface LeavePageClientProps {
  activeTab: string
  pendingRequests: PendingRequest[]
  allLeaveRequests: LeaveRequest[]
  totalCaptains: number
  totalFirstOfficers: number
  leaveBids: LeaveBid[]
}

export function LeavePageClient({
  activeTab,
  pendingRequests,
  allLeaveRequests,
  totalCaptains,
  totalFirstOfficers,
  leaveBids,
}: LeavePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentTab, setCurrentTab] = useState<TabId>(activeTab as TabId)

  // Sync state with URL
  useEffect(() => {
    setCurrentTab((activeTab as TabId) || 'approvals')
  }, [activeTab])

  const handleTabChange = (tabId: TabId) => {
    setCurrentTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`)
  }

  return (
    <>
      {/* Tab Navigation */}
      <div className="border-border border-b">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                  currentTab === tab.id
                    ? 'border-[var(--color-primary-600)] text-[var(--color-primary-600)]'
                    : 'text-muted-foreground hover:text-foreground/80 hover:border-border border-transparent'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'approvals' && pendingRequests.length > 0 && (
                  <span className="ml-1 rounded-full bg-[var(--color-warning-muted)] px-2 py-0.5 text-xs text-[var(--color-warning-400)]">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === 'approvals' && <LeaveApprovalClient initialRequests={pendingRequests} />}

        {currentTab === 'calendar' && (
          <LeaveCalendarClient
            leaveRequests={allLeaveRequests}
            totalCaptains={totalCaptains}
            totalFirstOfficers={totalFirstOfficers}
          />
        )}

        {currentTab === 'bids' && <LeaveBidReviewTable bids={leaveBids} />}
      </div>
    </>
  )
}
